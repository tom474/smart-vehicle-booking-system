"use client";

import BookingOverview from "@/app/requester/bookings/booking-overview";
import { BookingRequestData } from "@/apis/booking-request";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTranslations } from "next-intl";
import ViewItems from "@/components/view-items";

export default function DesktopBooking({
	bookingRequests,
	fetchBookingRequests,
	isLoading,
	scrollEvent,
}: {
	bookingRequests: BookingRequestData[];
	fetchBookingRequests?: () => void | Promise<void>;
	isLoading: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	scrollEvent?: (e: any) => void;
}) {
	const t = useTranslations("RequesterBookings.listBookings");
	const isMobile = useIsMobile();

	return (
		<ViewItems
			items={bookingRequests}
			renderItem={(booking) => (
				<BookingOverview
					booking={booking}
					bookingId={booking.id ?? 0}
					mobile={isMobile}
					onBookingChange={fetchBookingRequests}
				/>
			)}
			isLoading={isLoading}
			noItemsMessage={t("noBooking")}
			userRole="Employee"
			className={isMobile ? "w-full" : ""}
			scrollEvent={scrollEvent}
			whiteBg={true}
		/>
	);
}
