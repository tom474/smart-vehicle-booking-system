"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { Locate, LocateFixed, MapPinCheckInside, Dot, MapPinXInside } from "lucide-react";
import { format, subMinutes, addMinutes } from "date-fns";
import Lottie from "lottie-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NavigationBar from "@/components/navigation-bar";
import Spinner from "@/components/spinner";

import { useIsMobile } from "@/hooks/useIsMobile";
import carStartAnimation from "@/assets/car-start.json";
import carOnGoingAnimation from "@/assets/car-on-going.json";

import { TripTicketData, getTripTicket } from "@/apis/trip-ticket";
import { getDriverLocation } from "@/apis/trip";

import { MapWithDirections } from "@/app/requester/trip/map-direction";
import StopConnector from "@/app/requester/trip/stop-connector";
import CallButton from "@/app/requester/trip/call-button";
import { AddressComponent } from "@/app/requester/trip/address-component";
import { startLocationTracking } from "@/app/requester/trip/utils";
import Emergency from "@/app/requester/trip/emergency-button";
import CancelDialog from "@/app/requester/trip/cancel-dialog";
import FeedbackSheet from "@/app/requester/trip/feedback";
import { useTranslations } from "next-intl";
import { TripFeedbackData, userGetFeedbackFromTrip } from "@/apis/trip-feedback";
import { capitalize } from "@/lib/string-utils";

export default function OnGoingTrip() {
	const t = useTranslations("RequesterTripDay");

	const [isLoading, setIsLoading] = useState(true);
	const searchParams = useSearchParams();
	const isMobile = useIsMobile();
	const tripId = searchParams.get("tripId");
	const ggmap_api_key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

	const [useCenter, setUseCenter] = useState(false);
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
	const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
	const [completed, setCompleted] = useState<boolean>(false);
	const [watchId, setWatchId] = useState<number | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [tripData, setTripData] = useState<TripTicketData | null>(null);
	const [departureTimeRange, setDepartureTimeRange] = useState<{ from: Date; to: Date } | null>(null);
	const [arrivalTimeRange, setArrivalTimeRange] = useState<{ from: Date; to: Date } | null>(null);

	const [feedback, setFeedback] = useState<TripFeedbackData | undefined>(undefined);

	useEffect(() => {
		const fetchFeedback = async () => {
			if (tripData?.tripId && completed) {
				// Fetch feedback for the trip
				const feedback = await userGetFeedbackFromTrip(tripData.tripId);
				if (feedback) {
					setFeedback(feedback);
				} else {
					setFeedback(undefined);
				}
			}
		};

		fetchFeedback();
	}, [tripData?.tripId, completed]);

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
					const data = await getTripTicket(tripId);

					// Only update state if data has changed
					if (!tripData || JSON.stringify(data) !== JSON.stringify(tripData)) {
						setTripData(data);

						if (
							data.ticketStatus === "dropped_off" ||
							data.ticketStatus === "cancelled" ||
							data.ticketStatus === "no_show"
						) {
							setCompleted(true);
							setIsDrawerOpen(true);
						}

						if (data.departureTime) {
							const arrival = new Date(data.departureTime);
							if (!isNaN(arrival.getTime())) {
								setDepartureTimeRange({
									from: subMinutes(arrival, 5),
									to: addMinutes(arrival, 5),
								});
							} else {
								setDepartureTimeRange(null);
							}
						}

						if (data.arrivalTime) {
							const arrival = new Date(data.arrivalTime);
							if (!isNaN(arrival.getTime())) {
								setArrivalTimeRange({
									from: subMinutes(arrival, 15),
									to: addMinutes(arrival, 15),
								});
							} else {
								setArrivalTimeRange(null);
							}
						}

						if (data.tripId) {
							// Fetch driver location only if tripId is available
							const driverLocationData = await getDriverLocation(data.tripId);
							if (driverLocationData) {
								setDriverLocation({
									lat: driverLocationData.latitude,
									lng: driverLocationData.longitude,
								});
							} else {
								setDriverLocation(null);
							}
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
		}, 5000); // Fetch every 5 seconds

		// Cleanup interval on unmount
		return () => {
			clearInterval(intervalId);
		};
	}, [tripId, tripData, completed]);

	// Get initial location on component mount
	useEffect(() => {
		// Start location tracking by default
		startLocationTracking(setUserLocation, setWatchId, 6); // Stop after 6 errors

		// Cleanup on unmount
		return () => {
			if (watchId) {
				navigator.geolocation.clearWatch(watchId);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Remove watchId dependency to avoid infinite loop

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
					{tripData.ticketStatus === "pending" && t("waitingforDriver")}
					{tripData.ticketStatus === "picked_up" && t("onGoing")}
					{tripData.ticketStatus === "dropped_off" && t("tripCompleted")}
					{(tripData.ticketStatus === "no_show" || tripData.ticketStatus === "cancelled") &&
						t("tripCancelled")}
				</div>
				<div className={`text-subtitle-2 ${completed && "hidden"}`}>
					{departureTimeRange && !completed && tripData.ticketStatus === "pending" && (
						<>
							<span>{t("yourDriverWillArrive")} </span>
							<span>
								{format(departureTimeRange.from, "HH:mm")}
								{" - "}
								{format(departureTimeRange.to, "HH:mm")}
							</span>
						</>
					)}

					{arrivalTimeRange && !completed && tripData.ticketStatus === "picked_up" && (
						<>
							<span>{t("youWillArrive")} </span>
							<span>
								{format(subMinutes(arrivalTimeRange.from, 15), "HH:mm")}
								{" - "}
								{format(addMinutes(arrivalTimeRange.to, 15), "HH:mm")}
							</span>
						</>
					)}
				</div>
			</div>

			<div className="mt-4 text-muted-foreground text-caption">{t("yourDriver")}:</div>
			{tripData.driver ? (
				<div className="flex flex-row items-center justify-between w-full mt-2">
					<div className="flex flex-row items-center gap-2">
						<Avatar className="size-10">
							<AvatarImage
								src={tripData.driver.profileImageUrl ?? undefined}
								alt={tripData.driver.name}
							/>
							<AvatarFallback>{tripData.driver.name.charAt(0).toUpperCase() || "D"}</AvatarFallback>
						</Avatar>
						<div className="text-body-1">
							{tripData.driver.name}
							{/* {tripData.driver.vendorId && (
								<div className="text-muted-foreground text-caption">
									{tripData.driver.vendorId || "Unknown Vendor"}
								</div>
							)} */}
						</div>
						{tripData.driver.phoneNumber && (
							<CallButton name={tripData.driver.name} phoneNumber={tripData.driver.phoneNumber} />
						)}
					</div>
					{tripData.vehicle && (
						<div className="text-body-1 text-end">
							<div className="flex flex-row items-center text-subtitle-1">
								{tripData.vehicle.licensePlate} <Dot />
								{capitalize(tripData.vehicle?.color)}
							</div>
							<div className="text-muted-foreground text-body-2">{tripData.vehicle.model}</div>
						</div>
					)}
				</div>
			) : (
				<div className="text-body-1">{t("noDriverFound")}</div>
			)}
		</div>
	);

	const drawerInfoDiv = (
		<>
			{infoDiv}

			<div className="pt-6">
				{tripData.departureLocation && (
					<div className="relative flex flex-row items-start gap-4">
						{tripData.ticketStatus === "pending" && !completed ? (
							<StopConnector
								isFirst={true}
								isLast={false}
								addressIsClamped={false}
								isCurrentStop={false}
								hasActualArrival={false}
							/>
						) : (
							<StopConnector
								isFirst={false}
								isLast={false}
								addressIsClamped={false}
								isCurrentStop={true}
								hasActualArrival={false}
							/>
						)}
						<div className="flex flex-col flex-1 gap-1 pb-6">
							<AddressComponent location={tripData.departureLocation} onClampDetected={() => {}} />
							<div className="flex flex-col gap-1 text-sm text-muted-foreground">
								<div className="flex flex-row flex-wrap gap-1">
									<span>{t("stop.departure")}: </span>
									<span>{format(tripData.departureTime, "HH:mm, dd/MM/yyyy")}</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{tripData.arrivalLocation && (
					<div className="relative flex flex-row items-start gap-4">
						{tripData.ticketStatus === "pending" && !completed ? (
							<StopConnector
								isFirst={false}
								isLast={true}
								addressIsClamped={false}
								isCurrentStop={false}
								hasActualArrival={false}
							/>
						) : (
							<StopConnector
								isFirst={true}
								isLast={true}
								addressIsClamped={false}
								isCurrentStop={false}
								hasActualArrival={false}
							/>
						)}
						<div className="flex flex-col flex-1 gap-1 pb-6">
							<AddressComponent location={tripData.arrivalLocation} onClampDetected={() => {}} />
							<div className="flex flex-col gap-1 text-sm text-muted-foreground">
								{tripData.ticketStatus === "dropped_off" ? (
									<div className="flex flex-row flex-wrap gap-1">
										<span>{t("stop.actualArrival")}: </span>
										<span>{format(tripData.arrivalTime, "HH:mm, dd/MM/yyyy")}</span>
									</div>
								) : (
									<div className="flex flex-row flex-wrap gap-1">
										<span>{t("stop.estArrival")}: </span>
										<span>{format(tripData.arrivalTime, "HH:mm, dd/MM/yyyy")}</span>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);

	const drawerContent = (
		<>
			<div className="w-full h-full p-2">
				<div className="flex justify-center w-full mb-2">
					{!completed && tripData.ticketStatus === "pending" && (
						<Lottie
							animationData={carStartAnimation}
							loop={true}
							autoplay={true}
							style={{ width: 550, height: 150, transform: "scaleX(-1)" }}
						/>
					)}
					{!completed && tripData.ticketStatus === "picked_up" && (
						<Lottie
							animationData={carOnGoingAnimation}
							loop={true}
							autoplay={true}
							style={{ width: 550, height: 150, transform: "scaleX(-1)" }}
						/>
					)}
					{completed && tripData.ticketStatus === "dropped_off" && (
						<MapPinCheckInside className="mb-2 size-35" strokeWidth={1} />
					)}
					{completed && tripData.ticketStatus === "cancelled" && (
						<MapPinXInside className="mb-2 size-35" strokeWidth={1} />
					)}
					{completed && tripData.ticketStatus === "no_show" && (
						<MapPinXInside className="mb-2 size-35" strokeWidth={1} />
					)}
				</div>

				{drawerInfoDiv}
			</div>

			<div className={`relative flex flex-col w-full ${isMobile ? "mb-15" : ""}`}>
				<div className={`absolute right-0 ${tripData.ticketStatus === "pending" ? "bottom-13" : "bottom-0"}`}>
					{!completed && <Emergency />}
				</div>
				{tripData.ticketStatus === "pending" && !completed && (
					<div className="flex flex-row gap-2">
						<CancelDialog
							tripData={tripData}
							onCancel={() => {
								setIsDrawerOpen(true);
								setCompleted(true);
								setTripData((prev) => (prev ? { ...prev, ticketStatus: "cancelled" } : null));
							}}
						/>
					</div>
				)}
				{/* {!completed && isOnBoard && (
							<ArriveDialog
								setCompleted={() => setCompleted(true)}
								setIsOnBoard={() => setIsOnBoard(false)}
							/>
						)} */}
				{completed && tripData.ticketStatus === "dropped_off" && (
					<FeedbackSheet
						tripId={tripData.tripId}
						tripInfo={drawerInfoDiv}
						feedback={feedback}
						setFeedback={setFeedback}
					/>
				)}
			</div>
		</>
	);

	return (
		<div className="relative w-full h-full overflow-hidden">
			<div className="flex flex-row w-full h-full bg-background">
				{/* Desktop Drawer - only show on desktop */}
				{!isMobile && (
					<div className="w-2/3 overflow-y-auto">
						<div className="flex flex-col h-full p-4">{drawerContent}</div>
					</div>
				)}

				<div className="w-full h-full overflow-hidden rounded-md">
					<APIProvider apiKey={ggmap_api_key} solutionChannel="GMP_devsite_samples_v3_rgmautocomplete">
						{userLocation && (
							<Map
								style={{ width: "100%", height: "100%" }}
								defaultCenter={userLocation || undefined}
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
									driverLocation={driverLocation}
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
						)}
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
						<div className="size-10"></div>
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

						<NavigationBar userRole="Employee" />
					</div>
				</div>
			)}
		</div>
	);
}
