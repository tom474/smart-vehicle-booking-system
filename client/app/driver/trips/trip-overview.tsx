import { Car, UserRound, UsersRound, ChevronRight, MapPin, MapPinCheck, Dot } from "lucide-react";
import StatusBadge from "@/components/status-badge";
import { TripData } from "@/apis/trip";
import { format } from "date-fns";
import { shortenAddress } from "@/apis/location";
import { useTranslations } from "next-intl";
import TripDetails from "@/app/driver/trips/trip-details";
import { useState, useEffect } from "react";
import { getOutsourcePublicUrl, generateOutsourcePublicUrl } from "@/apis/vehicle";
import { toast } from "sonner";
import { capitalize } from "@/lib/string-utils";
import { useIsMobile } from "@/hooks/useIsMobile";
// import { Button } from "@/components/ui/button";
// import { redirect } from "next/navigation";

interface TripOverviewProps {
	trip: TripData;
	mobile?: boolean;
	onlyOverview?: boolean;
	coordinator?: boolean;
	onTripChange?: () => void | Promise<void>;
}

export default function TripOverview({
	trip,
	mobile = true,
	onlyOverview = false,
	coordinator = false,
	onTripChange,
}: TripOverviewProps) {
	const overviewContent = <OverviewDetails trip={trip} onlyOverview={onlyOverview} coordinator={coordinator} />;

	if (onlyOverview) {
		return overviewContent;
	}

	return (
		<TripDetails
			tripId={trip.id}
			trip={trip}
			trigger={overviewContent}
			coordinator={coordinator}
			mobile={mobile}
			onTripChange={onTripChange}
		/>
	);
}

function OverviewDetails({
	trip,
	onlyOverview = false,
	coordinator = false,
}: {
	trip: TripData;
	onlyOverview?: boolean;
	coordinator?: boolean;
}) {
	const t = useTranslations("RequesterBookings.bookingTripOverview");
	const [outsourcePublicUrl, setOutsourcePublicUrl] = useState<string | null>(null);
	const isMobile = useIsMobile();
	// const [isRedirecting, setIsRedirecting] = useState(false);

	useEffect(() => {
		const fetchPublicUrl = async () => {
			if (trip.outsourcedVehicle && trip.id) {
				try {
					const publicUrl = await getOutsourcePublicUrl(trip.id);
					setOutsourcePublicUrl(publicUrl);
				} catch {
					const newPublicUrl = await generateOutsourcePublicUrl(trip.id);
					setOutsourcePublicUrl(newPublicUrl);
				}
			}
		};
		fetchPublicUrl();
	}, [trip.outsourcedVehicle, trip.id]);

	const handleCopyUrl = async () => {
		if (outsourcePublicUrl) {
			try {
				await navigator.clipboard.writeText(outsourcePublicUrl);
				toast.success("Public URL copied to clipboard!");
			} catch (err) {
				console.error("Failed to copy URL:", err);
			}
		}
	};

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

	const getDestinationAddress = () => {
		if (!trip.stops?.length) return "";
		// Use last stop index instead of -1 which is invalid in JavaScript
		return shortenAddress(trip.stops[trip.stops.length - 1].location.address!);
	};

	const renderDriverAndVehicleInfo = () => {
		const passengers = (
			<div className="flex flex-row items-center gap-2">
				<UsersRound />
				<div>
					<span className="text-subtitle-2">{t("passengers")}: </span>
					<span className="text-body-2 text-muted-foreground">{trip.numberOfPassengers}</span>
				</div>
			</div>
		);

		if (trip.status === "cancelled") {
			return passengers;
		}

		return (
			<>
				{trip.vehicle && trip.driver ? (
					<div
						className={
							isMobile ? "flex flex-col gap-2 text-start" : "flex flex-row items-center gap-4 text-start"
						}
					>
						{coordinator && (
							<>
								<div className="flex flex-row items-center gap-2">
									<UserRound className="flex-shrink-0" />
									<div className="flex flex-col items-start min-w-0">
										<span className="text-subtitle-2">{trip.driver.name}</span>
										<span className="text-body-2 text-muted-foreground">
											{trip.driver.phoneNumber}
										</span>
									</div>
								</div>
								{isMobile ? null : <div className="w-px h-6 bg-border" />}
							</>
						)}
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
							{coordinator && (
								<>
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
								</>
							)}
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
				{passengers}
			</>
		);
	};

	const renderLocationInfo = () => (
		<div className="flex flex-col items-start min-w-0 gap-2 text-body-2">
			<span className="flex flex-row items-center w-full gap-2 truncate">
				<MapPin className="flex-shrink-0" />
				<span className="min-w-0 truncate">
					<span className="text-subtitle-2">{t("from")} </span>
					<span className="truncate text-muted-foreground">
						{shortenAddress(trip.stops![0].location.address!)}
					</span>
				</span>
			</span>
			<span className="flex flex-row items-center w-full gap-2 truncate">
				<MapPinCheck className="flex-shrink-0" />
				<span className="min-w-0 truncate">
					<span className="text-subtitle-2">{t("to")} </span>
					<span className="truncate text-muted-foreground">{getDestinationAddress()}</span>
				</span>
			</span>
		</div>
	);

	const renderRightSection = () => {
		const showChevron = !coordinator && !onlyOverview;

		return (
			<div className="flex flex-row items-center justify-center flex-shrink-0 h-full">
				{showChevron && <ChevronRight />}
			</div>
		);
	};

	return (
		<div key={trip.id} className="flex flex-row gap-4">
			<div className={`w-1.5 flex-shrink-0 rounded-tr-md rounded-br-md ${getStatusBackgroundClass()}`} />
			<div className="flex-1 min-w-0 space-y-2">
				{coordinator && outsourcePublicUrl && (
					<div onClick={handleCopyUrl} className="text-start text-caption">
						<span className="text-muted-foreground">Public URL: </span>
						<span className="underline text-primary hover:text-primary/80">{outsourcePublicUrl}</span>
					</div>
				)}
				<p className="text-start text-caption text-muted-foreground">
					{t("trip")} #{trip.id}
				</p>
				<div className="flex flex-row items-center gap-2 text-subtitle-1">
					{t("departOn")} {format(trip.departureTime, "HH:mm, dd/MM/yyyy")}
				</div>
				{renderDriverAndVehicleInfo()}
				{renderLocationInfo()}
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
			{renderRightSection()}
		</div>
	);
}
