import { useState } from "react";
import { Car, UserRound, ChevronRight, MapPin, MapPinCheck, ArrowRight, Dot } from "lucide-react";
import BookingDetails from "@/app/requester/bookings/booking-details";
import StatusBadge from "@/components/status-badge";
import { TripTicketData } from "@/apis/trip-ticket";
import { format } from "date-fns";
import { shortenAddress } from "@/apis/location";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { capitalize } from "@/lib/string-utils";

interface TicketOverviewProps {
	trip: TripTicketData;
	mobile?: boolean;
	home?: boolean;
	onBookingChange?: () => void | Promise<void>;
}

export default function TicketOverview({ trip, mobile = true, home = false, onBookingChange }: TicketOverviewProps) {
	const overviewContent = <OverviewDetails trip={trip} home={home} />;

	if (!home) {
		return overviewContent;
	}

	return (
		<BookingDetails
			mobile={mobile}
			bookingId={trip.bookingRequestId}
			trigger={overviewContent}
			onBookingChange={onBookingChange}
		/>
	);
}

function OverviewDetails({ trip, home }: { trip: TripTicketData; home?: boolean; coordinator?: boolean }) {
	const t = useTranslations("RequesterBookings.bookingTripOverview");
	const isMobile = useIsMobile();
	const [isRedirecting, setIsRedirecting] = useState(false);

	const getStatusBackgroundClass = () => {
		const statusMap = {
			scheduled: "bg-success",
			scheduling: "bg-warning",
			on_going: "bg-info",
			cancelled: "bg-destructive",
			completed: "bg-info",
		} as const;

		return statusMap[trip.status as keyof typeof statusMap] || `bg-${trip.status}`;
	};

	const renderDriverAndVehicleInfo = () => {
		if (trip.status === "scheduling" || trip.status === "cancelled") {
			return null;
		}

		if (home && isMobile) {
			return null;
		}

		return (
			<>
				{trip.vehicle && trip.driver ? (
					<div
						className={
							isMobile ? "flex flex-col gap-2 text-start" : "flex flex-row items-center gap-4 text-start"
						}
					>
						<div className="flex flex-row items-center gap-2">
							<UserRound className="flex-shrink-0" />
							<div className="flex flex-col items-start min-w-0">
								<span className="text-subtitle-2">{trip.driver.name}</span>
								<span className="text-body-2 text-muted-foreground">{trip.driver.phoneNumber}</span>
							</div>
						</div>
						{isMobile ? null : <div className="w-px h-6 bg-border" />}
						<div className="flex flex-row items-center gap-2">
							<Car className="flex-shrink-0" />
							<div className="flex flex-col items-start min-w-0">
								<span className="text-subtitle-2">{trip.vehicle.licensePlate}</span>
								<span className="flex flex-row items-center text-body-2 text-muted-foreground">
									{trip.vehicle.model} <Dot /> {capitalize(trip.vehicle.color)}
								</span>
							</div>
						</div>
					</div>
				) : (
					trip.outsourcedVehicle && (
						<div
							className={
								isMobile
									? "flex flex-col gap-2 text-start"
									: "flex flex-row items-center gap-4 text-start"
							}
						>
							<div className="flex flex-row items-center gap-2">
								<UserRound className="flex-shrink-0" />
								<div className="flex flex-col items-start min-w-0">
									<span className="text-subtitle-2">{trip.outsourcedVehicle.driverName}</span>
									<span className="text-body-2 text-muted-foreground">
										{trip.outsourcedVehicle.phoneNumber}
									</span>
								</div>
							</div>
							{isMobile ? null : <div className="w-px h-6 bg-border" />}
							<div className="flex flex-row items-center gap-2">
								<Car className="flex-shrink-0" />
								<div className="flex flex-col items-start min-w-0">
									<span className="text-subtitle-2">{trip.outsourcedVehicle.licensePlate}</span>
									<span className="flex flex-row items-center text-body-2 text-muted-foreground">
										{trip.outsourcedVehicle.model} <Dot />{" "}
										{trip.outsourcedVehicle.color
											? capitalize(trip.outsourcedVehicle.color)
											: "N/A"}
									</span>
								</div>
							</div>
						</div>
					)
				)}
			</>
		);
	};

	const renderLocationInfo = () => (
		<div className="flex flex-col items-start min-w-0 gap-2 text-body-2">
			<span className="flex flex-row items-center w-full gap-2 truncate">
				{(!home || !isMobile) && <MapPin className="flex-shrink-0" />}
				<span className="min-w-0 truncate">
					<span className="text-subtitle-2">{t("from")} </span>
					<span className="truncate text-muted-foreground">
						{shortenAddress(trip.departureLocation.address!)}
					</span>
				</span>
			</span>
			<span className="flex flex-row items-center w-full gap-2 truncate">
				{(!home || !isMobile) && <MapPinCheck className="flex-shrink-0" />}
				<span className="min-w-0 truncate">
					<span className="text-subtitle-2">{t("to")} </span>
					<span className="truncate text-muted-foreground">
						{shortenAddress(trip.arrivalLocation.address!)}
					</span>
				</span>
			</span>
		</div>
	);

	const renderBottomSection = () => {
		if (home) {
			return !isMobile ? (
				<div>
					<StatusBadge status={trip.status} />

					{/* {trip.status === "on_going" && (
						<Button
							variant="default"
							className="w-full mt-2"
							onClick={(e) => {
								if (trip.id) {
									e.preventDefault();
									setIsRedirecting(true);
									redirect(`/requester/trip?tripId=${trip.id}`);
								}
							}}
							disabled={isRedirecting}
						>
							{isRedirecting ? t("redirecting") : t("goToTripPage")}
						</Button>
					)} */}
				</div>
			) : (
				<div className="flex items-start">
					<div className="flex flex-row items-center gap-2 text-primary text-btn">
						{t("seeDetails")} <ArrowRight className="flex-shrink-0 size-4" />
					</div>
				</div>
			);
		}

		return (
			<div>
				<StatusBadge status={trip.status} />

				{trip.status === "on_going" && (
					<Button
						variant="default"
						className="w-full mt-2"
						onClick={() => {
							if (trip.id) {
								setIsRedirecting(true);
								redirect(`/requester/trip?tripId=${trip.id}`);
							}
						}}
						disabled={isRedirecting}
					>
						{isRedirecting ? t("redirecting") : t("goToTripPage")}
					</Button>
				)}
			</div>
		);
	};

	const renderRightSection = () => {
		const showChevron = home && !isMobile;
		const showStatusBadge = home && isMobile;

		return (
			<div className="flex flex-row items-center justify-center flex-shrink-0 h-full">
				{showChevron && <ChevronRight />}
				{showStatusBadge && <StatusBadge status={trip.status} />}
			</div>
		);
	};

	return (
		<div key={trip.id} className="flex flex-row gap-4">
			<div className={`w-1.5 flex-shrink-0 rounded-tr-md rounded-br-md ${getStatusBackgroundClass()}`} />
			<div className="flex-1 min-w-0 space-y-2">
				<p className="text-start text-caption text-muted-foreground">
					{t("trip")} #{trip.id}
				</p>
				<div className="flex flex-row items-center gap-2 text-subtitle-1 text-start">
					{t("departOn")} {format(trip.departureTime, "HH:mm, dd/MM/yyyy")}
				</div>
				{renderDriverAndVehicleInfo()}
				{renderLocationInfo()}
				{renderBottomSection()}
			</div>
			{renderRightSection()}
		</div>
	);
}
