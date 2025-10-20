"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, UserRound, Car, UsersRound, Dot } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";
import Spinner from "@/components/spinner";
import StatusBadge from "@/components/status-badge";
import { TripData, getTrip, confirmStartTrip } from "@/apis/trip";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { AddressComponent, handleClampDetected } from "@/app/driver/trips/address-component";
import { toast } from "sonner";
import StartEarlyDialog from "@/app/driver/trips/start-early-dialog";
import { capitalize } from "@/lib/string-utils";

interface TripDetailsProps {
	tripId?: string;
	trip?: TripData;
	trigger?: React.ReactNode;
	coordinator?: boolean;
	mobile?: boolean;
	onTripChange?: () => void | Promise<void>;
}

export default function TripDetails({ tripId, trip, trigger, coordinator, mobile = true }: TripDetailsProps) {
	return (
		<Sheet>
			{coordinator
				? trigger && (
						<SheetTrigger className="w-full" asChild>
							{trigger}
						</SheetTrigger>
					)
				: trigger && <SheetTrigger className="w-full">{trigger}</SheetTrigger>}
			<SheetContent
				className={`[&>button]:hidden ${
					mobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl"
				}`}
			>
				<SheetHeader className="hidden">
					<SheetTitle>Trip Details</SheetTitle>
					<SheetDescription>View Trip Information</SheetDescription>
				</SheetHeader>
				<TripDetailsSheet tripId={tripId} trip={trip} coordinator={coordinator} />
			</SheetContent>
		</Sheet>
	);
}

function TripDetailsHeader({ tripId }: { tripId?: string }) {
	const t = useTranslations("DriverTrips");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<p className="text-subtitle-1">
				{t("trip")} #{tripId}
			</p>
			<div className="size-6"></div>
		</div>
	);
}

interface TripDetailsSheetProps {
	tripId?: string;
	trip?: TripData;
	coordinator?: boolean;
}

export function TripDetailsSheet({ tripId, trip, coordinator }: TripDetailsSheetProps) {
	const t = useTranslations("DriverTrips");

	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [tripData, setTripData] = useState<TripData>();
	const [addressClampedStates, setAddressClampedStates] = useState<boolean[]>([]);

	const isStartingSoon = (trip: TripData) => {
		if (trip.status !== "scheduled") return false;

		const now = new Date();
		const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
		const tripDate = new Date(trip.departureTime);

		return tripDate >= now && tripDate <= oneHourFromNow;
	};

	const isTodayTrip = (trip: TripData) => {
		if (trip.status !== "scheduled") return false;

		const today = new Date();
		const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
		const tripDate = new Date(trip.departureTime);

		return tripDate >= todayStart && tripDate <= todayEnd;
	};

	const isPastNow = (trip: TripData) => {
		const now = new Date();
		const tripDate = new Date(trip.departureTime);
		return tripDate < now;
	};

	useEffect(() => {
		const fetchTripData = async () => {
			if (!trip && tripId) {
				setIsLoading(true);
				try {
					// If you have a getTripById API function, use it here
					const data = await getTrip(tripId, false);
					setTripData(data);
				} catch (error) {
					console.error("Failed to fetch trip:", error);
				} finally {
					setIsLoading(false);
				}
			} else if (trip) {
				setTripData(trip);
				// Initialize the clamp states array
				setAddressClampedStates(new Array(trip.stops?.length || 0).fill(false));
			}
		};

		fetchTripData();
	}, [trip, tripId]);

	if (isLoading || !tripData) {
		return (
			<div className="flex flex-col w-full h-screen p-4">
				<TripDetailsHeader tripId={tripData?.id} />
				<div className="flex flex-col items-center justify-center w-full h-screen">
					<Spinner />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full h-screen p-4">
			<TripDetailsHeader tripId={tripData.id} />

			{/* Status */}
			<div className="flex flex-row items-center justify-center w-full gap-2 mt-2">
				<span className="text-md text-muted-foreground">{t("status")}:</span>
				<StatusBadge status={tripData.status} />
			</div>

			<div className="flex flex-col h-full gap-4 p-2 pt-6">
				{/* Trip Information */}
				{coordinator && tripData.driver ? (
					<div className="flex flex-row items-center gap-2">
						<UserRound className="flex-shrink-0" />
						<div className="flex flex-col items-start min-w-0">
							<span className="text-subtitle-2">{tripData.driver.name}</span>
							<span className="text-body-2 text-muted-foreground">{tripData.driver.phoneNumber}</span>
						</div>
					</div>
				) : (
					tripData.outsourcedVehicle && (
						<div className="flex flex-row items-center gap-2">
							<UserRound className="flex-shrink-0" />
							<div className="flex flex-col items-start min-w-0">
								<span className="text-subtitle-2">{tripData.outsourcedVehicle.driverName}</span>
								<span className="text-body-2 text-muted-foreground">
									{tripData.outsourcedVehicle.phoneNumber}
								</span>
							</div>
						</div>
					)
				)}
				<div className="flex flex-row items-center gap-8">
					{tripData.vehicle ? (
						<div className="flex flex-row items-center gap-2">
							<Car className="flex-shrink-0" />
							<div className="flex flex-col items-start min-w-0">
								<span className="text-subtitle-2">{tripData.vehicle.licensePlate}</span>
								<span className="flex flex-row items-center text-body-2 text-muted-foreground">
									{tripData.vehicle.model} <Dot /> {capitalize(tripData.vehicle.color)}
								</span>
							</div>
						</div>
					) : (
						tripData.outsourcedVehicle && (
							<div className="flex flex-row items-center gap-2">
								<Car className="flex-shrink-0" />
								<div className="flex flex-col items-start min-w-0">
									<span className="text-subtitle-2">{tripData.outsourcedVehicle.licensePlate}</span>
									<span className="flex flex-col text-body-2 text-muted-foreground">
										{tripData.outsourcedVehicle.model} <Dot />{" "}
										{tripData.outsourcedVehicle.color
											? capitalize(tripData.outsourcedVehicle.color)
											: "N/A"}
									</span>
								</div>
							</div>
						)
					)}
					<div className="flex flex-row items-center gap-2">
						<UsersRound />
						<div>
							<span className="text-subtitle-1">{t("passengers")}: </span>
							<span className="text-muted-foreground">{tripData.numberOfPassengers}</span>
						</div>
					</div>
				</div>
				<div className="flex flex-col justify-between h-full pt-2">
					<div className="flex flex-col pt-2">
						{tripData.stops?.map((stop, index) => (
							<div key={index} className="relative flex flex-row items-start gap-4">
								<StopConnector
									isFirst={index === 0}
									isLast={index === tripData.stops!.length - 1}
									// hasActualArrival={!!stop.actualArrivalTime}
									addressIsClamped={addressClampedStates[index]}
								/>
								<div className="flex flex-col flex-1 gap-1 pb-6">
									<AddressComponent
										stop={stop}
										onClampDetected={(isClamped) =>
											handleClampDetected(setAddressClampedStates, index, isClamped)
										}
									/>
									<div className="flex flex-col gap-1 text-sm">
										{stop.actualArrivalTime ? (
											<div className="flex flex-row flex-wrap gap-1 text-muted-foreground">
												<span>{t("actualArrival")}</span>
												<span>{format(stop.actualArrivalTime, "HH:mm, dd/MM/yyyy")}</span>
											</div>
										) : (
											<div className="flex flex-row flex-wrap gap-1 text-muted-foreground">
												<span>{t("arrival")}</span>
												<span>{format(stop.arrivalTime, "HH:mm, dd/MM/yyyy")}</span>
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
					<div>
						{isTodayTrip(tripData) && (
							<>
								{/* Early start dialog: only before starting soon period */}
								{!isStartingSoon(tripData) && !isPastNow(tripData) && (
									<StartEarlyDialog
										tripId={tripData.id}
										isProcessing={isProcessing}
										setIsProcessing={setIsProcessing}
									/>
								)}

								{/* Start Trip button: only when starting soon or past departure */}
								{(isStartingSoon(tripData) || isPastNow(tripData)) && (
									<Button
										variant="default"
										className="w-full mt-4"
										disabled={isProcessing}
										onClick={async () => {
											if (tripId) {
												setIsProcessing(true);
												const status = await confirmStartTrip(tripId);
												if (status) {
													redirect(`/driver/trip?tripId=${tripId}`);
												} else {
													toast.error("Failed to start trip. Please try again.");
												}
											}
										}}
									>
										{isProcessing ? t("starting") : t("startTrip")}
									</Button>
								)}
							</>
						)}
						{tripData.status === "on_going" && (
							<Button
								variant="default"
								className="w-full mt-4"
								disabled={isProcessing}
								onClick={() => {
									if (tripId) {
										setIsProcessing(true);
										redirect(`/driver/trip?tripId=${tripId}`);
									}
								}}
							>
								{isProcessing ? t("redirecting") : t("goToTripPage")}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export function StopConnector({
	isFirst,
	isLast,
	addressIsClamped,
}: {
	isFirst: boolean;
	isLast: boolean;
	addressIsClamped?: boolean;
}) {
	const [lineHeight, setLineHeight] = useState(62);

	useEffect(() => {
		let baseHeight = 62; // Base height in pixels

		if (addressIsClamped) {
			baseHeight -= 20; // Reduce height for clamped address
		}

		setLineHeight(baseHeight);
	}, [addressIsClamped]);

	return (
		<div className="relative flex flex-col items-center flex-shrink-0 min-h-full">
			<div
				className={`size-4 mt-1 rounded-full relative z-10 ${
					isFirst ? "bg-blue-500" : isLast ? "bg-red-500" : "bg-blue-500"
				}`}
			/>
			{!isLast && <div className="w-0.5 bg-gray-300 mt-2" style={{ height: `${lineHeight}px` }} />}
		</div>
	);
}
