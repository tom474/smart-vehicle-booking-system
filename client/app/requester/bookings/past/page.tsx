"use client";

import { useState, useEffect } from "react";
import DesktopBooking from "@/app/requester/bookings/desktop-bookings";
import { useFetchData } from "@/components/data-context";
import { BookingRequestSchema, getBookingRequest, getBookingRequests } from "@/apis/booking-request";
import TableView, { visibilityState } from "@/components/dashboard-table/table-view";
import { bookingRequestColumns } from "@/app/dashboard/bookings/_columns/requests";
import { BookingDetailsSheet } from "@/app/requester/bookings/booking-details";
import { useViewContext } from "@/components/view-context";
import { getUserFromCookie } from "@/lib/utils";

export default function Booking() {
	const dataContext = useFetchData();
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const { isListView, setIsListView } = useViewContext();
	const fetchData = dataContext?.fetchData;
	const isBookingRoute = dataContext?.isBookingRoute;

	useEffect(() => {
		// get isListView from localStorage or default to true
		const storedView = localStorage.getItem("isListView");
		if (storedView !== null) {
			setIsListView(storedView === "true");
		}
	}, [setIsListView]);

	useEffect(() => {
		if (fetchData && isBookingRoute) {
			fetchData(["cancelled", "completed"], page, setHasMore, false);
		}
	}, [fetchData, isBookingRoute, page]);

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

	if (!dataContext) {
		return <div>Loading...</div>;
	}

	const { bookingData } = dataContext;
	const { bookings, isLoading } = bookingData;

	if (isListView) {
		return (
			<DesktopBooking
				bookingRequests={bookings}
				fetchBookingRequests={
					fetchData ? () => fetchData(["cancelled", "completed"], page, setHasMore, true) : undefined
				}
				isLoading={isLoading}
				scrollEvent={handleScroll}
			/>
		);
	}

	const stylesheet = `
	#row-action-button {
		display: none;
	}`;

	return (
		<>
			<style>{stylesheet}</style>
			<div className="p-4 rounded-md bg-card">
				<TableView
					tableConfig={{
						columnVisibility: visibilityState(BookingRequestSchema.shape, false, {
							id: true,
							status: true,
							requesterId: true,
							type: true,
							isReserved: true,
							priority: true,
							tripPurpose: true,
							numberOfPassengers: true,
							departureLocation: true,
							arrivalLocation: true,
							departureTime: true,
						}),
					}}
					columns={bookingRequestColumns}
					fetcher={(_s, _f, p) => {
						const user = getUserFromCookie();
						const completed = getBookingRequests({
							status: "completed",
							requesterId: user?.id,
							page: p.pageIndex,
							limit: p.pageSize,
						});
						const cancelled = getBookingRequests({
							status: "cancelled",
							requesterId: user?.id,
							page: p.pageIndex,
							limit: p.pageSize,
						});
						return Promise.all([completed, cancelled]).then(([completedData, cancelledData]) => [
							...completedData,
							...cancelledData,
						]);
					}}
					renderView={{
						fetcher: (id) => getBookingRequest(id),
						render: (data) => (
							<BookingDetailsSheet
								className="h-full p-0"
								bookingId={data.id}
								booking={data}
								mobile={false}
								modify={false}
							/>
						),
					}}
					renderEdit={{
						fetcher: (id) => getBookingRequest(id),
						render: (data) => (
							<BookingDetailsSheet
								className="h-full p-0"
								bookingId={data.id}
								booking={data}
								mobile={false}
								modify={true}
							/>
						),
					}}
					hideHeader
					preventClickOutside
				/>
			</div>
		</>
	);
}
