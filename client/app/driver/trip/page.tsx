"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { UserRound, Locate, LocateFixed, MapPinCheckInside, MapPinXInside } from "lucide-react";
import { format } from "date-fns";
import Lottie from "lottie-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NavigationBar from "@/components/navigation-bar";
import Spinner from "@/components/spinner";

import { useIsMobile } from "@/hooks/useIsMobile";
import carStartAnimation from "@/assets/car-start.json";
import carOnGoingAnimation from "@/assets/car-on-going.json";

import { StopData, UserGroupData } from "@/apis/stop";
import { TripData, getTrip, confirmStartTrip, confirmEndTrip } from "@/apis/trip";
import { updateDriverLocation } from "@/apis/trip";

import { MapWithDirections } from "@/app/driver/trip/map-direction";
import StopConnector from "@/app/driver/trip/stop-connector";
import CallButton from "@/app/driver/trip/call-button";
import { AddressComponent, handleClampDetected } from "@/app/driver/trips/address-component";
import {
	getUserGroup,
	getStopMarkerColor,
	startLocationTracking,
	handlePassenger,
	handleSkipUserGroup,
	checkAndCompleteStopsOnLoad,
} from "@/app/driver/trip/utils";
import ReportIncident from "@/app/driver/trip/report-incident";
import SkipDialog from "@/app/driver/trip/skip-dialog";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OnGoingTrip() {
	const t = useTranslations("DriverTripDay");

	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const searchParams = useSearchParams();
	const isMobile = useIsMobile();
	const tripId = searchParams.get("tripId");
	const ggmap_api_key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

	const [useCenter, setUseCenter] = useState(false);

	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
	const [nextStop, setNextStop] = useState<StopData | null>(null);
	const [passengerGroups, setPassengerGroups] = useState<UserGroupData[]>([]);
	const [completed, setCompleted] = useState<boolean>(false);

	const [watchId, setWatchId] = useState<number | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
	const [tripData, setTripData] = useState<TripData | null>(null);
	const [addressClampedStates, setAddressClampedStates] = useState<boolean[]>([]);

	useEffect(() => {
		let isInitialLoad = true;

		// Fetch trip data if tripId is available
		const fetchTripData = async () => {
			if (tripId && !completed) {
				// Don't fetch if trip is completed
				// Only set loading on initial fetch, not on interval updates
				if (isInitialLoad) {
					setIsLoading(true);
				}

				try {
					const data = await getTrip(tripId);
					// Sort stops by order field
					if (data.stops) {
						data.stops.sort((a, b) => a.order - b.order);
					}

					// Only update state if data has changed
					if (!tripData || JSON.stringify(data) !== JSON.stringify(tripData)) {
						setTripData(data);
						let newNextStop = data.stops?.[0] || null;
						if (data.stops) {
							for (let index = 0; index < data.stops.length; index++) {
								const stop = data.stops[index];
								if (!stop.actualArrivalTime) {
									newNextStop = data.stops[index] || null;
									break;
								}
							}
						}
						setNextStop(newNextStop);
						setAddressClampedStates(new Array(data.stops?.length || 0).fill(false));
						const groupsAtCurrentStop = getUserGroup(data.stops || [], newNextStop);
						setPassengerGroups(groupsAtCurrentStop);

						if (data.status === "completed" || data.status === "cancelled") {
							setCompleted(true);
							setIsDrawerOpen(true);
							return; // If trip is already completed, no need to process further
						}

						if (newNextStop?.actualArrivalTime) {
							newNextStop = null; // If the final stop has actual arrival time, trip is finish
							await confirmEndTrip(data.id);
							setCompleted(true);
							setIsDrawerOpen(true);
						}

						// Check and auto-complete stops with all absent passengers on initial load
						if (newNextStop && !completed) {
							await checkAndCompleteStopsOnLoad(
								data,
								newNextStop,
								groupsAtCurrentStop,
								setTripData,
								setNextStop,
								setCompleted,
								setPassengerGroups,
							);
						}
					}
				} catch (error) {
					console.error("Failed to fetch trip:", error);
				} finally {
					// Only set loading false on initial fetch
					if (isInitialLoad) {
						setIsLoading(false);
						isInitialLoad = false;
					}
				}
			}
		};

		// Initial fetch
		fetchTripData();

		// Set up interval to fetch data every 15 seconds (only if not completed)
		const intervalId = setInterval(() => {
			if (!completed) {
				fetchTripData();
			}
		}, 30000); // Fetch every 30 seconds

		// Cleanup interval on unmount
		return () => {
			clearInterval(intervalId);
		};
	}, [tripId, tripData, completed]);

	// Get initial location on component mount
	useEffect(() => {
		if (tripData?.status === "completed" || tripData?.status === "cancelled") {
			setCompleted(true);
			setIsDrawerOpen(true);
			return; // If trip is already completed, no need to start location tracking
		}

		// Start location tracking by default
		startLocationTracking(setUserLocation, setWatchId, 6); // Stop after 6 errors

		// Setup location update interval
		const interval = setInterval(async () => {
			if (navigator.geolocation && tripData?.driver?.id && tripId && userLocation) {
				try {
					await updateDriverLocation(tripId, {
						id: "current",
						type: "custom",
						name: tripData?.driver?.id,
						address: tripData?.driver?.id,
						latitude: userLocation.lat,
						longitude: userLocation.lng,
					});
				} catch (error) {
					console.warn("Failed to update driver location:", error);
				}
			}
		}, 30000); // 30 seconds

		// Cleanup on unmount
		return () => {
			if (watchId) {
				navigator.geolocation.clearWatch(watchId);
			}
			if (interval) {
				clearInterval(interval);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tripData?.driver?.id, tripId, tripData?.status]);

	// Handle location updates when userLocation changes
	useEffect(() => {
		const updateLocation = async () => {
			if (!completed && userLocation && tripData?.driver?.id && tripId) {
				try {
					await updateDriverLocation(tripId, {
						id: "current",
						type: "custom",
						name: tripData?.driver?.id,
						address: tripData?.driver?.id,
						latitude: userLocation.lat,
						longitude: userLocation.lng,
					});
				} catch (error) {
					console.warn("Failed to update driver location:", error);
				}
			}
		};

		// Update location immediately when it first becomes available
		if (userLocation && tripData?.driver?.id && tripId) {
			updateLocation();
		}
	}, [userLocation, tripData?.driver?.id, tripId, completed]);

	const getGroupsAtCurrentStop = (nextStop: StopData | null, passengerGroups: UserGroupData[]) => {
		if (!nextStop) return [];

		const groupsAtStop = passengerGroups.filter((group) => {
			const matchByGroup = nextStop.group?.some((g) => g.bookingRequestId === group.bookingRequestId);
			const matchByTickets = nextStop.tickets?.some((t) => t.bookingRequestId === group.bookingRequestId);
			return matchByGroup || matchByTickets;
		});

		return groupsAtStop;
	};

	if (!ggmap_api_key) {
		console.error("Google Maps API key is not defined.");
		return null;
	}

	if (isLoading || !tripData) {
		return (
			<div className="flex flex-col w-full h-screen p-4">
				<div className="flex flex-col items-center justify-center w-full h-screen">
					<Spinner />
				</div>
			</div>
		);
	}

	const infoDiv = (
		<div className="flex flex-col items-start justify-between">
			<div className="flex flex-col items-start justify-between h-full gap-1">
				<div className="text-subtitle-1">
					{!completed && tripData.status === "scheduled" && t("pleaseStartTrip")}
					{!completed &&
						tripData.status === "on_going" &&
						nextStop?.type === "pickup" &&
						t("pickingUpPassnegers")}
					{!completed &&
						tripData.status === "on_going" &&
						nextStop?.type === "drop_off" &&
						t("droppingOffPassengers")}
					{completed && tripData.status === "completed" && t("tripCompleted")}
					{completed && tripData.status === "cancelled" && t("tripCancelled")}
				</div>
				{!completed && tripData.status === "on_going" && nextStop && (
					<div className="text-muted-foreground text-body-2">
						{nextStop ? nextStop.location.address || nextStop.location.name : t("waitingForNextStop")}
					</div>
				)}
			</div>

			{!completed && (
				<>
					<div className="mt-4 text-muted-foreground text-caption">{t("contactPoints")}:</div>
					{nextStop &&
						getGroupsAtCurrentStop(nextStop, passengerGroups).map((group) => (
							<div key={group.bookingRequestId} className="flex flex-row items-center gap-2 mt-2">
								<Avatar className="size-10">
									<AvatarFallback>
										<UserRound />
									</AvatarFallback>
								</Avatar>
								<div className="text-body-1">{group.contactName}</div>
								<CallButton
									name={group.contactName || "Unknown Driver"}
									phoneNumber={group.contactPhoneNumber || ""}
								/>
							</div>
						))}
				</>
			)}
		</div>
	);

	const drawerContent = (
		<>
			<div className="w-full h-full px-2 overflow-y-auto">
				<Tabs defaultValue="trip" className="w-full h-full">
					<TabsList className="flex-shrink-0 w-full bg-background">
						<TabsTrigger
							value="trip"
							className="data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:font-semibold data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0"
						>
							{t("tripTab")}
						</TabsTrigger>
						<TabsTrigger
							value="passengers"
							className="data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:font-semibold data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0"
						>
							{t("passengersTab")}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="trip" className="flex-1 w-full overflow-y-auto">
						<div className="flex justify-center w-full mb-2">
							{!completed && tripData.status === "scheduled" && (
								<Lottie
									animationData={carStartAnimation}
									loop={true}
									autoplay={true}
									style={{ width: 550, height: 150, transform: "scaleX(-1)" }}
								/>
							)}
							{!completed && tripData.status === "on_going" && (
								<Lottie
									animationData={carOnGoingAnimation}
									loop={true}
									autoplay={true}
									style={{ width: 550, height: 150, transform: "scaleX(-1)" }}
								/>
							)}
							{completed && tripData.status === "completed" && (
								<MapPinCheckInside className="mb-2 size-35" strokeWidth={1} />
							)}
							{completed && tripData.status === "cancelled" && (
								<MapPinXInside className="mb-2 size-35" strokeWidth={1} />
							)}
						</div>

						{infoDiv}

						<div className="pt-6">
							{tripData.stops?.map((stop, index) => (
								<div key={index} className="relative flex flex-row items-start gap-4">
									<StopConnector
										isFirst={index === 0}
										isLast={index === tripData.stops!.length - 1}
										addressIsClamped={addressClampedStates[index]}
										isCurrentStop={nextStop?.id === stop.id}
										hasActualArrival={!!stop.actualArrivalTime}
									/>
									<div className="flex flex-col flex-1 gap-1 pb-6">
										<AddressComponent
											stop={stop}
											onClampDetected={(isClamped) =>
												handleClampDetected(setAddressClampedStates, index, isClamped)
											}
										/>
										<div className="flex flex-col gap-1 text-sm text-muted-foreground">
											{stop.actualArrivalTime ? (
												<div className="flex flex-row flex-wrap gap-1">
													<span>{t("stop.actualArrival")}: </span>
													<span>{format(stop.actualArrivalTime, "HH:mm, dd/MM/yyyy")}</span>
												</div>
											) : (
												<div className="flex flex-row flex-wrap gap-1">
													<span>{t("stop.estArrival")}: </span>
													<span>{format(stop.arrivalTime, "HH:mm, dd/MM/yyyy")}</span>
												</div>
											)}
										</div>
										<div className="flex flex-row gap-1 text-sm text-muted-foreground">
											<span>{t("stop.type.type")}: </span>
											<span>
												{stop.type === "pickup"
													? t("stop.type.pickUp")
													: t("stop.type.dropOff")}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</TabsContent>

					<TabsContent value="passengers" className="flex-1 w-full overflow-y-auto">
						{/* passengers */}
						<div className="flex flex-col gap-2 mt-2">
							<h3 className="text-subtitle-1">{t("passengers.passengers")}</h3>
							{passengerGroups.length ? (
								passengerGroups.map((userGroup, index) => (
									<div key={index} className="flex flex-col gap-2 p-4 border rounded-lg">
										<div className="flex justify-between w-full">
											<p className="text-body-1">
												{t("passengers.booking")} #{userGroup.bookingRequestId}
											</p>
											<div className="flex items-center gap-2">
												{(() => {
													const userGroupStatus = userGroup.status;
													if (
														userGroupStatus === "no_show" ||
														userGroupStatus === "cancelled"
													) {
														return (
															<span className="text-destructive">
																{t("passengers.skipped")}
															</span>
														);
													} else if (userGroupStatus === "dropped_off") {
														return (
															<span className="text-success">
																{t("passengers.droppedOff")}
															</span>
														);
													} else if (userGroupStatus === "dropping_off") {
														return (
															<span className="text-warning">
																{t("passengers.droppingOff")}
															</span>
														);
													} else if (userGroupStatus === "picked_up") {
														return (
															<span className="text-muted-foreground">
																{t("passengers.pickedUp")}
															</span>
														);
													} else {
														return (
															<span className="text-warning">
																{t("passengers.pickingUp")}
															</span>
														);
													}
												})()}

												{/* Skip button for individual user groups - only show for pending pickup passengers */}
												{nextStop?.type === "pickup" &&
													userGroup.status === "pending" &&
													getGroupsAtCurrentStop(nextStop, passengerGroups).some(
														(g) => g.bookingRequestId === userGroup.bookingRequestId,
													) && (
														<SkipDialog
															userGroup={userGroup}
															onSkip={(reason, skipUserGroup) => {
																handleSkipUserGroup(
																	reason,
																	skipUserGroup,
																	nextStop,
																	passengerGroups,
																	setPassengerGroups,
																	false,
																	tripData?.id,
																	setTripData,
																	setNextStop,
																	setCompleted,
																);
															}}
														/>
													)}
											</div>
										</div>
										<div className="flex flex-col gap-2">
											{userGroup.users.map((passenger, passengerIndex) => (
												<div key={passengerIndex} className="flex justify-between w-full">
													<div className="flex items-center gap-2">
														<Avatar className="size-8">
															<AvatarImage
																src={passenger.profileImageUrl || ""}
																alt={passenger.name || "Passenger Profile Image"}
															/>
															<AvatarFallback>
																{passenger.name.charAt(0).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<span>{passenger.name}</span>
													</div>
												</div>
											))}
										</div>
									</div>
								))
							) : (
								<span className="text-muted-foreground">{t("passengers.noPassengers")}</span>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</div>

			<div className={`relative flex flex-col w-full ${isMobile ? "mb-15" : ""}`}>
				<div className="absolute right-0 bottom-13">{!completed && <ReportIncident />}</div>
				{!completed && tripData.status === "scheduled" && (
					<Button
						variant="default"
						className="w-full"
						onClick={async () => {
							setIsProcessing(true);
							try {
								if (tripData.id) {
									const status = await confirmStartTrip(tripData.id);
									if (status) {
										setIsProcessing(false);
										window.location.reload();
									}
								}
							} catch (error) {
								console.error("Failed to start trip:", error);
								setIsProcessing(false);
							}
						}}
						disabled={isProcessing}
					>
						{isProcessing ? t("processing") : t("confirmStartTripBtn")}
					</Button>
				)}

				{/* Action buttons for ongoing trips */}
				{!completed && tripData.status === "on_going" && (
					<div className="flex flex-row gap-2">
						<Button
							variant="default"
							className={`flex-1 ${nextStop?.type === "pickup" ? " bg-primary" : " bg-success"}`}
							onClick={async () => {
								setIsProcessing(true);
								try {
									await handlePassenger(
										nextStop,
										tripData,
										passengerGroups,
										setPassengerGroups,
										setNextStop,
										setCompleted,
										setTripData,
									);
								} finally {
									setIsProcessing(false);
								}
							}}
							disabled={
								isProcessing ||
								(nextStop?.type === "pickup" &&
									(() => {
										const groupsAtStop = getGroupsAtCurrentStop(nextStop, passengerGroups);
										return (
											groupsAtStop.length > 0 &&
											groupsAtStop.every(
												(group) => group.status === "no_show" || group.status === "picked_up",
											)
										);
									})()) ||
								(nextStop?.type === "drop_off" &&
									(() => {
										const groupsAtStop = getGroupsAtCurrentStop(nextStop, passengerGroups);
										return (
											groupsAtStop.length > 0 &&
											groupsAtStop.every(
												(group) => group.status === "no_show" || group.status === "dropped_off",
											)
										);
									})())
							}
						>
							{isProcessing
								? t("processing")
								: nextStop?.type === "pickup"
									? t("pickUpBtn")
									: t("dropOffBtn")}
						</Button>

						{/* Skip passengers button for pickup stops */}
						{nextStop?.type === "pickup" &&
							(() => {
								const groupsAtStop = getGroupsAtCurrentStop(nextStop, passengerGroups);
								const pendingGroups = groupsAtStop.filter((group) => group.status === "pending");

								return (
									pendingGroups.length > 0 && (
										<SkipDialog
											allGroups={pendingGroups}
											onSkip={(reason) => {
												handleSkipUserGroup(
													reason,
													undefined,
													nextStop,
													passengerGroups,
													setPassengerGroups,
													true,
													tripData?.id,
													setTripData,
													setNextStop,
													setCompleted,
												);
											}}
											isSkipAll={true}
											disabled={false}
										/>
									)
								);
							})()}
					</div>
				)}
			</div>
		</>
	);

	return (
		<div className="relative w-full h-full overflow-hidden">
			<div className="flex flex-row w-full h-full bg-background">
				{/* Desktop Drawer - only show on desktop */}
				{!isMobile && (
					<div className="w-2/3 overflow-hidden">
						<div className="flex flex-col h-full p-4">{drawerContent}</div>
					</div>
				)}

				<div className="w-full h-full overflow-hidden rounded-md">
					<APIProvider apiKey={ggmap_api_key} solutionChannel="GMP_devsite_samples_v3_rgmautocomplete">
						<Map
							style={{ width: "100%", height: "100%" }}
							defaultCenter={
								userLocation ||
								(nextStop
									? { lat: nextStop.location.latitude, lng: nextStop.location.longitude }
									: undefined)
							}
							center={useCenter && userLocation ? userLocation : undefined}
							defaultZoom={17.5}
							zoom={useCenter ? 17.5 : undefined}
							gestureHandling="greedy"
							disableDefaultUI={true}
							onDrag={() => setUseCenter(false)}
							mapId="random-map-id"
						>
							<MapWithDirections
								userLocation={userLocation}
								tripData={tripData}
								getStopMarkerColor={getStopMarkerColor}
							/>

							<Button
								variant="outline"
								className={`absolute z-10 py-5 has-[>svg]:px-2 rounded-full right-3 hover:bg-background ${isMobile ? "bottom-50" : "bottom-5"}`}
								onClick={() => setUseCenter(!useCenter)}
							>
								{!useCenter ? (
									<Locate className="size-6" />
								) : (
									<LocateFixed className="size-6 text-primary " />
								)}
								<span className="sr-only">Toggle Center</span>
							</Button>
						</Map>
					</APIProvider>
				</div>
			</div>

			{/* Mobile Drawer - only show on mobile */}
			{isMobile && (
				<div
					className={`absolute bottom-0 w-full transition-all duration-300 ease-in-out bg-background z-100 ${!isDrawerOpen && "rounded-t-3xl"}`}
					style={{
						height: isDrawerOpen ? (isMobile ? "100vh" : "70vh") : "20vh",
					}}
				>
					{/* Drawer Handle */}
					{!completed ? (
						<div className="flex justify-center pt-1">
							<Button
								variant="ghost"
								className="w-full max-w-xs hover:bg-background hover:cursor-pointer"
								onClick={() => setIsDrawerOpen(!isDrawerOpen)}
							>
								<div className="w-12 h-1 mb-2 bg-gray-300 rounded-full"></div>
							</Button>
						</div>
					) : (
						<div className="size-2"></div>
					)}

					<div
						className={`flex flex-col justify-between px-4 pb-15 overflow-hidden transition-all duration-300 ${
							isDrawerOpen ? "hidden" : "opacity-100 max-h-full"
						}`}
						style={{ height: isDrawerOpen ? "0" : "100%" }}
					>
						{infoDiv}
					</div>

					{/* Drawer Content */}
					<div
						className={`flex flex-col justify-between px-4 pb-15 overflow-hidden transition-all duration-300 ${
							isDrawerOpen ? "opacity-100 max-h-full" : "hidden"
						}`}
						style={{ height: isDrawerOpen ? "100%" : "0" }}
					>
						{drawerContent}

						<NavigationBar userRole="Driver" />
					</div>
				</div>
			)}
		</div>
	);
}
