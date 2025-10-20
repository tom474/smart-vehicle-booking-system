import { ChevronRight, MapPin, MapPinCheck } from "lucide-react";
import BookingDetails from "@/app/requester/bookings/booking-details";
import StatusBadge from "@/components/status-badge";
import { BookingRequestData } from "@/apis/booking-request";
import { format } from "date-fns";
import { shortenAddress } from "@/apis/location";
import { useTranslations } from "next-intl";

interface BookingOverviewProps {
	booking: BookingRequestData;
	bookingId: number | string;
	mobile?: boolean;
	onBookingChange?: () => void | Promise<void>;
}

export default function BookingOverview({ booking, bookingId, mobile = true, onBookingChange }: BookingOverviewProps) {
	return (
		<BookingDetails
			mobile={mobile}
			booking={booking}
			bookingId={bookingId}
			trigger={<OverviewDetails booking={booking} />}
			onBookingChange={onBookingChange}
		/>
	);
}

function OverviewDetails({ booking }: { booking: BookingRequestData }) {
	const t = useTranslations("RequesterBookings.bookingTripOverview");

	return (
		<div key={booking.id} className="flex flex-row gap-4">
			<div
				className={
					`w-1.5 flex-shrink-0 rounded-tr-md rounded-br-md ` +
					`${
						booking.status === "approved"
							? "bg-success"
							: booking.status === "pending"
								? "bg-warning"
								: booking.status === "cancelled"
									? "bg-destructive"
									: booking.status === "completed"
										? "bg-info"
										: `bg-${booking.status}`
					}`
				}
			></div>
			<div className="flex-1 min-w-0 space-y-2">
				<div className="flex flex-row items-center gap-2 text-subtitle-1 text-start">
					{t("departOn")} {format(booking.departureTime, "HH:mm, dd/MM/yyyy")}
				</div>
				<div className="flex flex-col items-start min-w-0 gap-2 text-body-2">
					<span className="flex flex-row items-center w-full gap-2 truncate">
						<MapPin className="flex-shrink-0" />
						<span className="min-w-0 truncate">
							<span className="text-subtitle-2">{t("from")} </span>
							<span className="truncate text-muted-foreground">
								{shortenAddress(booking.departureLocation.name!)}
							</span>
						</span>
					</span>
					<span className="flex flex-row items-center w-full gap-2 truncate">
						<MapPinCheck className="flex-shrink-0" />
						<span className="min-w-0 truncate">
							<span className="text-subtitle-2">{t("to")} </span>
							<span className="truncate text-muted-foreground">
								{shortenAddress(booking.arrivalLocation.address!)}
							</span>
						</span>
					</span>
				</div>
				<StatusBadge status={booking.status} />
			</div>
			<div className="flex flex-row items-center justify-center flex-shrink-0 h-full gap-1">
				<div className="text-caption">
					{booking.type === "one_way" ? t("tripType.oneWay") : t("tripType.roundTrip")}
				</div>{" "}
				<ChevronRight />
			</div>
		</div>
	);
}
