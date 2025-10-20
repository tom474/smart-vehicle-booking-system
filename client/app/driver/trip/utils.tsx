import { StopData, UserGroupData } from "@/apis/stop";
import {
	confirmPickup,
	confirmAbsence,
	confirmDropOff,
	getTrip,
	TripData,
	confirmArriveStop,
	confirmEndTrip,
} from "@/apis/trip";

export function getUserGroup(stops: StopData[], nextStop: StopData | null): UserGroupData[] {
	const groups: { [key: string]: UserGroupData } = {};

	stops.forEach((stop) => {
		// Use the group data directly from the stop if available
		if (stop.group && stop.group.length > 0) {
			stop.group.forEach((group) => {
				if (!groups[group.bookingRequestId]) {
					// Determine the appropriate status based on stop type and position
					let status = group.status;

					// If this is the next stop and it's a drop-off, set status to "dropping_off"
					// for groups that have been picked up (status is "picked_up" or already "dropping_off")
					if (
						nextStop &&
						stop.id === nextStop.id &&
						stop.type === "drop_off" &&
						(group.status === "picked_up" || group.status === "dropping_off")
					) {
						status = "dropping_off";
					}

					groups[group.bookingRequestId] = {
						...group,
						status: status,
					};
				}
			});
		}

		// Fallback to tickets if no group data
		if (stop.tickets && (!stop.group || stop.group.length === 0)) {
			stop.tickets.forEach((ticket) => {
				if (!ticket.user) return;

				if (groups[ticket.bookingRequestId]) {
					// Avoid duplicates
					if (ticket.user && !groups[ticket.bookingRequestId].users.some((u) => u.id === ticket.user!.id)) {
						groups[ticket.bookingRequestId].users.push(ticket.user);
					}
				} else {
					// Determine status for ticket-based groups
					let status = ticket.ticketStatus || "pending";

					// If this is the next stop and it's a drop-off, set status to "dropping_off"
					// for tickets that have been picked up
					if (
						nextStop &&
						stop.id === nextStop.id &&
						stop.type === "drop_off" &&
						(status === "picked_up" || status === "dropping_off")
					) {
						status = "dropping_off";
					}

					groups[ticket.bookingRequestId] = {
						bookingRequestId: ticket.bookingRequestId,
						users: [ticket.user],
						contactName: ticket.contactName,
						contactPhoneNumber: ticket.contactPhoneNumber,
						status: status as UserGroupData["status"],
					};
				}
			});
		}
	});

	// Additional pass: Check if any groups need to be marked as "dropping_off"
	// This handles cases where groups have been picked up and are now at a drop-off stop
	if (nextStop && nextStop.type === "drop_off") {
		Object.values(groups).forEach((group) => {
			// Check if this group has passengers at the current drop-off stop
			const hasPassengersAtStop =
				nextStop.group?.some((g) => g.bookingRequestId === group.bookingRequestId) ||
				nextStop.tickets?.some((t) => t.bookingRequestId === group.bookingRequestId);

			if (hasPassengersAtStop && group.status === "picked_up") {
				group.status = "dropping_off";
			}
		});
	}

	return Object.values(groups);
}

// Get stop marker color based on index
export const getStopMarkerColor = (index: number, isCompleted: boolean) => {
	if (isCompleted) return "#4CAF50"; // Green for completed stops
	if (index === 0) return "#FF9800"; // Orange for current/next stop
	return "#9E9E9E"; // Gray for future stops
};

// Start watching user's location for real-time tracking
export const startLocationTracking = (
	setUserLocation: (location: { lat: number; lng: number }) => void,
	setWatchId: (id: number | null) => void,
	maxErrors: number = 3, // Maximum number of errors before stopping
) => {
	if (!navigator.geolocation) {
		console.error("Geolocation is not supported by this browser.");
		return;
	}

	let errorCount = 0;
	let watchId: number | null = null;

	const watchPosition = () => {
		watchId = navigator.geolocation.watchPosition(
			(position) => {
				const newLocation = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				setUserLocation(newLocation);
				// Reset error count on successful location update
				errorCount = 0;
			},
			(error) => {
				errorCount++;
				console.warn(`Error getting location (attempt ${errorCount}/${maxErrors}):`, error);

				if (errorCount >= maxErrors) {
					console.warn("Maximum location errors reached. Stopping location tracking.");
					if (watchId) {
						navigator.geolocation.clearWatch(watchId);
						setWatchId(null);
					}
					return;
				}
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 1000,
			},
		);
	};

	watchPosition();
	if (watchId) {
		setWatchId(watchId);
	}
};

export async function handlePassenger(
	nextStop: StopData | null,
	tripData: { stops?: StopData[]; id?: string } | null,
	passengerGroups: UserGroupData[],
	setPassengerGroups: React.Dispatch<React.SetStateAction<UserGroupData[]>>,
	setNextStop: React.Dispatch<React.SetStateAction<StopData | null>>,
	setCompleted: React.Dispatch<React.SetStateAction<boolean>>,
	setTripData: React.Dispatch<React.SetStateAction<TripData | null>>,
) {
	if (!nextStop || !tripData?.id) return;

	try {
		if (nextStop.type === "pickup") {
			// Get all groups at this stop and confirm pickup for each
			const groupsAtStop = passengerGroups.filter((group) => {
				const isAtCurrentStop =
					nextStop.group?.some((g) => g.bookingRequestId === group.bookingRequestId) ||
					nextStop.tickets?.some((t) => t.bookingRequestId === group.bookingRequestId);
				return isAtCurrentStop && group.status === "pending";
			});

			// Call API to confirm pickup for each group
			for (const group of groupsAtStop) {
				await confirmPickup(tripData.id, group.bookingRequestId, nextStop.id);
			}
		} else if (nextStop.type === "drop_off") {
			// Get all groups at this stop that are dropping off and confirm drop-off for each
			const groupsAtStop = passengerGroups.filter((group) => {
				const isAtCurrentStop =
					nextStop.group?.some((g) => g.bookingRequestId === group.bookingRequestId) ||
					nextStop.tickets?.some((t) => t.bookingRequestId === group.bookingRequestId);
				return isAtCurrentStop && (group.status === "picked_up" || group.status === "dropping_off");
			});

			// Call API to confirm drop-off for each group
			for (const group of groupsAtStop) {
				await confirmDropOff(tripData.id, group.bookingRequestId, nextStop.id);
			}
		}

		// Refetch updated trip data from the server after all API calls
		const updatedTripData = await getTrip(tripData.id);

		// Sort stops by order field
		if (updatedTripData.stops) {
			updatedTripData.stops.sort((a, b) => a.order - b.order);
		}

		setTripData(updatedTripData);

		// Find the new next stop
		let newNextStop = null;
		if (updatedTripData.stops) {
			for (let index = 0; index < updatedTripData.stops.length; index++) {
				const stop = updatedTripData.stops[index];
				if (!stop.actualArrivalTime) {
					newNextStop = updatedTripData.stops[index] || null;
					break;
				}
			}
		}

		// Check if trip is completed
		if (!newNextStop || newNextStop?.actualArrivalTime) {
			await confirmEndTrip(updatedTripData.id);
			setCompleted(true);
			setNextStop(null);
		} else {
			setNextStop(newNextStop);
		}

		// Update passenger groups with the fresh data
		const updatedPassengerGroups = getUserGroup(updatedTripData.stops || [], newNextStop);
		setPassengerGroups(updatedPassengerGroups);
	} catch (error) {
		console.error("Error handling passenger action:", error);
	}
}

export async function handleSkipUserGroup(
	reason: string,
	userGroup: UserGroupData | undefined,
	nextStop: StopData | null,
	passengerGroups: UserGroupData[],
	setPassengerGroups: React.Dispatch<React.SetStateAction<UserGroupData[]>>,
	isSkipAll: boolean = false,
	tripId?: string,
	setTripData?: React.Dispatch<React.SetStateAction<TripData | null>>,
	setNextStop?: React.Dispatch<React.SetStateAction<StopData | null>>,
	setCompleted?: React.Dispatch<React.SetStateAction<boolean>>,
) {
	if (!nextStop || !tripId) return;

	try {
		if (isSkipAll) {
			// Get all pending groups at this stop and confirm absence for each
			const groupsAtStop = passengerGroups.filter((group) => {
				const isAtCurrentStop =
					nextStop.group?.some((g) => g.bookingRequestId === group.bookingRequestId) ||
					nextStop.tickets?.some((t) => t.bookingRequestId === group.bookingRequestId);
				return isAtCurrentStop && group.status === "pending";
			});

			// Call API to confirm absence for each group
			for (const group of groupsAtStop) {
				await confirmAbsence(tripId, group.bookingRequestId, reason, nextStop.id);
			}
		} else if (userGroup) {
			// Call API to confirm absence for the specific user group
			await confirmAbsence(tripId, userGroup.bookingRequestId, reason, nextStop.id);
		}

		// Refetch updated trip data from the server if setTripData is provided
		if (setTripData && setNextStop && setCompleted) {
			const updatedTripData = await getTrip(tripId);

			// Sort stops by order field
			if (updatedTripData.stops) {
				updatedTripData.stops.sort((a, b) => a.order - b.order);
			}

			// Update passenger groups with the fresh data
			const updatedPassengerGroups = getUserGroup(updatedTripData.stops || [], nextStop);
			setPassengerGroups(updatedPassengerGroups);

			// Check for stops ahead of nextStop that can be auto-completed
			await checkAndCompleteStopsAhead(
				updatedTripData,
				nextStop,
				updatedPassengerGroups,
				setTripData,
				setNextStop,
				setCompleted,
			);
		} else {
			// Fallback to local state update if setTripData is not provided
			const updatedGroups = passengerGroups.map((group) => {
				const isAtCurrentStop =
					nextStop.group?.some((g) => g.bookingRequestId === group.bookingRequestId) ||
					nextStop.tickets?.some((t) => t.bookingRequestId === group.bookingRequestId);

				if (isSkipAll && isAtCurrentStop && group.status === "pending") {
					return {
						...group,
						status: "no_show" as UserGroupData["status"],
						skipReason: reason,
					};
				} else if (
					!isSkipAll &&
					userGroup &&
					group.bookingRequestId === userGroup.bookingRequestId &&
					group.status === "pending"
				) {
					return {
						...group,
						status: "no_show" as UserGroupData["status"],
						skipReason: reason,
					};
				}

				return group;
			});

			setPassengerGroups(updatedGroups);
		}
	} catch (error) {
		console.error("Error skipping user group:", error);
	}
}

async function checkAndCompleteStopsAhead(
	tripData: TripData,
	currentNextStop: StopData | null,
	passengerGroups: UserGroupData[],
	setTripData?: React.Dispatch<React.SetStateAction<TripData | null>>,
	setNextStop?: React.Dispatch<React.SetStateAction<StopData | null>>,
	setCompleted?: React.Dispatch<React.SetStateAction<boolean>>,
) {
	if (!tripData.stops || !currentNextStop || !setTripData || !setNextStop || !setCompleted) return;

	// Find the index of the current next stop
	const currentStopIndex = tripData.stops.findIndex((stop) => stop.id === currentNextStop.id);
	if (currentStopIndex === -1) return;

	// Get all stops ahead of the current next stop
	const stopsAhead = tripData.stops.slice(currentStopIndex + 1);
	let updatedTripData = tripData;

	for (const stop of stopsAhead) {
		// Skip if this stop already has actual arrival time
		if (stop.actualArrivalTime) continue;

		// Get all groups at this stop using the most recent trip data
		const groupsAtStop = getGroupsAtStop(stop, passengerGroups);

		// Check if all groups at this stop are absent or already processed
		const allGroupsAbsentOrProcessed =
			groupsAtStop.length === 0 ||
			groupsAtStop.every(
				(group) =>
					group.status === "no_show" ||
					group.status === "cancelled" ||
					group.status === "dropped_off" ||
					(group.status === "picked_up" && stop.type === "drop_off"), // For drop-off stops, picked_up passengers should be processed
			);

		if (allGroupsAbsentOrProcessed) {
			try {
				await confirmArriveStop(stop.id);

				// Refetch trip data immediately after each confirmArriveStop
				updatedTripData = await getTrip(tripData.id);

				// Sort stops by order field
				if (updatedTripData.stops) {
					updatedTripData.stops.sort((a, b) => a.order - b.order);
				}

				// Update the state with fresh data
				setTripData(updatedTripData);
			} catch (error) {
				console.error(`Error auto-completing stop ${stop.id}:`, error);
				// Stop processing if we encounter an error
				break;
			}
		} else {
			// Stop checking if we find a stop that can't be completed
			break;
		}
	}

	// Find the new next stop after all auto-completions
	let newNextStop = null;
	if (updatedTripData.stops) {
		for (let index = 0; index < updatedTripData.stops.length; index++) {
			const stop = updatedTripData.stops[index];
			if (!stop.actualArrivalTime) {
				newNextStop = updatedTripData.stops[index] || null;
				break;
			}
		}
	}

	// Check if trip is completed
	if (!newNextStop || newNextStop?.actualArrivalTime) {
		await confirmEndTrip(updatedTripData.id);
		setCompleted(true);
		setNextStop(null);
	} else {
		setNextStop(newNextStop);
	}
}

export async function checkAndCompleteStopsOnLoad(
	tripData: TripData,
	currentNextStop: StopData | null,
	passengerGroups: UserGroupData[],
	setTripData: React.Dispatch<React.SetStateAction<TripData | null>>,
	setNextStop: React.Dispatch<React.SetStateAction<StopData | null>>,
	setCompleted: React.Dispatch<React.SetStateAction<boolean>>,
	setPassengerGroups: React.Dispatch<React.SetStateAction<UserGroupData[]>>,
) {
	if (!tripData.stops || !currentNextStop) return;

	// Start from the current next stop and check all stops
	let updatedTripData = tripData;
	let stopToCheck: StopData | null = currentNextStop;

	while (stopToCheck && !stopToCheck.actualArrivalTime) {
		// Get all groups at this stop
		const groupsAtStop = getGroupsAtStop(stopToCheck, passengerGroups);

		// Check if all groups at this stop are absent
		const allGroupsAbsent =
			groupsAtStop.length > 0 &&
			groupsAtStop.every((group) => group.status === "no_show" || group.status === "cancelled");

		if (allGroupsAbsent) {
			try {
				await confirmArriveStop(stopToCheck.id);

				// Refetch trip data immediately after confirmArriveStop
				updatedTripData = await getTrip(tripData.id);

				// Sort stops by order field
				if (updatedTripData.stops) {
					updatedTripData.stops.sort((a, b) => a.order - b.order);
				}

				// Update the state with fresh data
				setTripData(updatedTripData);

				// Update passenger groups with fresh data
				const updatedPassengerGroups = getUserGroup(updatedTripData.stops || [], null);
				setPassengerGroups(updatedPassengerGroups);

				// Ensure stops array exists before using findIndex
				if (!updatedTripData.stops) {
					console.error("updatedTripData.stops is undefined");
					break;
				}

				// Find the next stop to check
				const currentStopIndex = updatedTripData.stops.findIndex((stop) => stop.id === stopToCheck!.id);
				if (currentStopIndex !== -1 && currentStopIndex + 1 < updatedTripData.stops!.length) {
					stopToCheck = updatedTripData.stops![currentStopIndex + 1];
				} else {
					stopToCheck = null; // No more stops
				}
			} catch (error) {
				console.error(`Error auto-completing stop ${stopToCheck?.id}:`, error);
				break;
			}
		} else {
			// Stop checking if we find a stop that can't be completed
			break;
		}
	}

	// Find the new next stop after all auto-completions
	let newNextStop = null;
	if (updatedTripData.stops) {
		for (let index = 0; index < updatedTripData.stops.length; index++) {
			const stop = updatedTripData.stops[index];
			if (!stop.actualArrivalTime) {
				newNextStop = updatedTripData.stops[index] || null;
				break;
			}
		}
	}

	// Check if trip is completed
	if (!newNextStop || newNextStop?.actualArrivalTime) {
		await confirmEndTrip(updatedTripData.id);
		setCompleted(true);
		setNextStop(null);
	} else {
		setNextStop(newNextStop);
	}
}

// Helper function to get groups at a specific stop
function getGroupsAtStop(stop: StopData, passengerGroups: UserGroupData[]): UserGroupData[] {
	return passengerGroups.filter((group) => {
		const matchByGroup = stop.group?.some((g) => g.bookingRequestId === group.bookingRequestId);
		const matchByTickets = stop.tickets?.some((t) => t.bookingRequestId === group.bookingRequestId);
		return matchByGroup || matchByTickets;
	});
}
