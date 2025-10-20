"use client";

import { useState, useEffect } from "react";
import BookingOverview from "@/app/requester/bookings/booking-overview";
import CreateBooking from "@/app/requester/create-booking/create-form";
import { getBookingRequests, BookingRequestData } from "@/apis/booking-request";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTranslations } from "next-intl";
import { getUserFromCookie } from "@/lib/utils";
import ViewItemsTab from "@/components/view-items-tab";

export default function Bookings() {
	const t = useTranslations("RequesterBookings.listBookings");
	const isMobile = useIsMobile();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [upcomingBookingRequests, setUpcomingBookingRequests] = useState<BookingRequestData[]>([]);
	const [pendingBookingRequests, setPendingBookingRequests] = useState<BookingRequestData[]>([]);
	const [pastBookingRequests, setPastBookingRequests] = useState<BookingRequestData[]>([]);

	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	const fetchBookingRequests = async (pageNumber: number, all?: boolean) => {
		setIsLoading(true);
		let limit = 10;
		let shortLimit = 5;
		if (all) {
			limit = pageNumber * 10;
			shortLimit = pageNumber * 5;
			pageNumber = 1;
		}

		try {
			const user = getUserFromCookie();
			if (!user) {
				console.error("User not found");
				return;
			}

			// Fetch approved booking requests
			const approvedRequests = await getBookingRequests({
				requesterId: user.id,
				page: pageNumber,
				limit: limit,
				status: "approved",
			});

			if (all) {
				// Replace entire state when refetching all data
				setUpcomingBookingRequests(approvedRequests);
			} else {
				// Only merge when loading more pages
				setUpcomingBookingRequests((prev) => [
					...prev.filter((request) => !approvedRequests.some((newReq) => newReq.id === request.id)),
					...approvedRequests,
				]);
			}

			// Fetch pending booking requests
			const pendingRequests = await getBookingRequests({
				requesterId: user.id,
				page: pageNumber,
				limit: limit,
				status: "pending",
			});

			if (all) {
				setPendingBookingRequests(pendingRequests);
			} else {
				setPendingBookingRequests((prev) => [
					...prev.filter((request) => !pendingRequests.some((newReq) => newReq.id === request.id)),
					...pendingRequests,
				]);
			}

			// Fetch cancelled booking requests
			const cancelledRequests = await getBookingRequests({
				requesterId: user.id,
				page: pageNumber,
				limit: shortLimit,
				status: "cancelled",
				orderDirection: "DESC",
			});
			// Fetch completed booking requests
			const completedRequests = await getBookingRequests({
				requesterId: user.id,
				page: pageNumber,
				limit: shortLimit,
				status: "completed",
				orderDirection: "DESC",
			});
			const pastData = [...cancelledRequests, ...completedRequests];

			if (all) {
				setPastBookingRequests(pastData);
			} else {
				setPastBookingRequests((prev) => [
					...prev.filter((request) => !pastData.some((newReq) => newReq.id === request.id)),
					...pastData,
				]);
			}

			// Check if there are no more results for all categories
			if (
				approvedRequests.length === 0 &&
				pendingRequests.length === 0 &&
				cancelledRequests.length === 0 &&
				completedRequests.length === 0
			) {
				setHasMore(false);
			}
		} catch (error) {
			console.error("Failed to fetch booking requests:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch the first page on component mount
	useEffect(() => {
		fetchBookingRequests(page, false);
	}, [page]);

	// Infinite scroll handler
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleScroll = (e: any) => {
		const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
		if (bottom) {
			if (hasMore && !isLoading) {
				setPage((prevPage) => prevPage + 1);
			}
		}
	};

	const tabs = [
		{
			value: "upcoming",
			label: t("upcoming"),
			items: upcomingBookingRequests,
			renderItem: (booking: BookingRequestData) => (
				<BookingOverview
					booking={booking}
					bookingId={booking.id ?? 0}
					mobile={isMobile}
					onBookingChange={() => fetchBookingRequests(page, true)}
				/>
			),
		},
		{
			value: "pending",
			label: t("pending"),
			items: pendingBookingRequests,
			renderItem: (booking: BookingRequestData) => (
				<BookingOverview
					booking={booking}
					bookingId={booking.id ?? 0}
					mobile={isMobile}
					onBookingChange={() => fetchBookingRequests(page, true)}
				/>
			),
		},
		{
			value: "past",
			label: t("past"),
			items: pastBookingRequests,
			renderItem: (booking: BookingRequestData) => (
				<BookingOverview
					booking={booking}
					bookingId={booking.id ?? 0}
					mobile={isMobile}
					onBookingChange={() => fetchBookingRequests(page, true)}
				/>
			),
		},
	];

	return (
		<ViewItemsTab
			title={t("title")}
			tabs={tabs}
			defaultTab="upcoming"
			userRole="Employee"
			customActionComponent={
				<CreateBooking mobile={true} button={false} onBookingChange={() => fetchBookingRequests(page, true)} />
			}
			isLoading={isLoading}
			noItemsMessage={t("noBooking")}
			scrollEvent={handleScroll}
		/>
	);
}
