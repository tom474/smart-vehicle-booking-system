"use client";

import { createContext, useContext, useState, useCallback, PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { getTripTickets, TripTicketData } from "@/apis/trip-ticket";
import { getBookingRequests, BookingRequestData } from "@/apis/booking-request";
import { getUserFromCookie } from "@/lib/utils";

interface TripData {
	upcomingTrips: TripTicketData[];
	pendingRequests: TripTicketData[];
	recentTrips: TripTicketData[];
	isLoading: boolean;
}

interface BookingData {
	bookings: BookingRequestData[];
	isLoading: boolean;
}

interface DataContextType {
	tripData: TripData;
	bookingData: BookingData;
	fetchData: (
		statuses?: ("pending" | "approved" | "cancelled" | "completed")[],
		page?: number,
		setHasMore?: (value: boolean) => void,
		all?: boolean,
	) => Promise<void>;
	isBookingRoute: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: PropsWithChildren) {
	const pathname = usePathname();
	const isBookingRoute = pathname?.startsWith("/requester/bookings/");
	const isRequesterHomeRoute = pathname == "/requester";

	const [tripData, setTripData] = useState<TripData>({
		upcomingTrips: [],
		pendingRequests: [],
		recentTrips: [],
		isLoading: true,
	});

	const [bookingData, setBookingData] = useState<BookingData>({
		bookings: [],
		isLoading: true,
	});

	const fetchTripData = useCallback(async () => {
		setTripData((prev) => ({ ...prev, isLoading: true }));
		const user = getUserFromCookie();
		if (!user) {
			console.error("User not found");
			return;
		}

		const tripTickets = await getTripTickets({
			userId: user.id,
		});

		const upcomingData = tripTickets.filter((trip) => trip.status === "scheduled" || trip.status === "on_going");
		const pendingData = tripTickets.filter((trip) => trip.status === "scheduling");
		const sortByDepartureTimeDesc = (arr: TripTicketData[]) =>
			arr.slice().sort((a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime());
		const cancelledData = sortByDepartureTimeDesc(tripTickets.filter((trip) => trip.status === "cancelled"));
		const completedData = sortByDepartureTimeDesc(tripTickets.filter((trip) => trip.status === "completed"));

		setTripData({
			upcomingTrips: upcomingData,
			pendingRequests: pendingData,
			recentTrips: [...cancelledData, ...completedData],
			isLoading: false,
		});
	}, []);

	const fetchBookingData = useCallback(
		async (
			statuses?: ("pending" | "approved" | "cancelled" | "completed")[],
			page?: number,
			setHasMore?: (value: boolean) => void,
			all?: boolean,
		) => {
			setBookingData((prev) => ({ ...prev, isLoading: true }));
			const user = getUserFromCookie();
			if (!user) {
				console.error("User not found");
				return;
			}

			let allBookingRequests: BookingRequestData[] = [];

			// Fetch data for each status
			for (const status of statuses || []) {
				let limit = 10;
				if (all && page) {
					limit = page * 10;
					page = 1;
				}

				let orderDirect: "ASC" | "DESC" = "ASC";
				if (status === "cancelled" || status === "completed") {
					orderDirect = "DESC";
				}

				const bookingRequests = await getBookingRequests({
					status,
					page,
					limit: limit,
					requesterId: user.id,
					orderDirection: orderDirect,
				});

				// Check if there are no items in the fetched page
				if (bookingRequests.length === 0 && setHasMore) {
					setHasMore(false); // Update hasMore to false
				}

				allBookingRequests = allBookingRequests.concat(bookingRequests);
			}

			// Append new bookings to the existing ones and remove duplicates
			setBookingData((prev) => {
				if (all) {
					// Replace entire state when refetching all data
					return {
						bookings: allBookingRequests,
						isLoading: false,
					};
				} else {
					// Only merge when loading more pages
					// Create a map of new bookings by id
					const newBookingsMap = new Map(allBookingRequests.map((b) => [b.id, b]));
					// Merge old bookings, replacing with new if id matches
					const mergedBookings = [
						...prev.bookings.filter((b) => !newBookingsMap.has(b.id)),
						...allBookingRequests,
					];
					return {
						bookings: mergedBookings,
						isLoading: false,
					};
				}
			});
		},
		[],
	);

	const fetchData = useCallback(
		async (
			statuses?: ("pending" | "approved" | "cancelled" | "completed")[],
			page?: number,
			setHasMore?: (value: boolean) => void,
			all?: boolean,
		) => {
			if (isBookingRoute) {
				await fetchBookingData(statuses, page, setHasMore, all);
			} else if (isRequesterHomeRoute) {
				await fetchTripData();
			}
		},
		[isBookingRoute, isRequesterHomeRoute, fetchBookingData, fetchTripData],
	);

	return (
		<DataContext.Provider value={{ tripData, bookingData, fetchData, isBookingRoute }}>
			{children}
		</DataContext.Provider>
	);
}

export function useFetchData() {
	const context = useContext(DataContext);
	if (context === undefined) {
		return null;
	}
	return context;
}
