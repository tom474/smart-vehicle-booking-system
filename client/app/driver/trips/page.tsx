"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getTrips, TripData } from "@/apis/trip";
import TripOverview from "@/app/driver/trips/trip-overview";
import { getUserFromToken } from "@/lib/utils";
import { useTranslations } from "next-intl";
import ViewItemsTab from "@/components/view-items-tab";

export default function Trips() {
	const t = useTranslations("DriverTrips");
	const isMobile = useIsMobile();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [startingSoonTrips, setStartingSoonTrips] = useState<TripData[]>([]);
	const [todayTrips, setTodayTrips] = useState<TripData[]>([]);
	const [upcomingTrips, setUpcomingTrips] = useState<TripData[]>([]);
	const [pastTrips, setPastTrips] = useState<TripData[]>([]);

	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	const fetchTrips = async (pageNumber: number, all?: boolean) => {
		setIsLoading(true);
		let limit = 30;
		if (all) {
			limit = pageNumber * 30;
			pageNumber = 1;
		}

		try {
			const driver = getUserFromToken();
			if (!driver) {
				console.error("No driver found in token");
				return;
			}

			// get all trips
			const trips = await getTrips({
				driverId: driver.id,
				page: pageNumber,
				limit: limit,
			});

			const sortedTrips = trips.sort(
				(a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
			);

			// Get current date info for filtering
			const today = new Date();
			const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

			// Filter scheduled trips only
			const scheduledTrips = sortedTrips.filter(
				(trip) => trip.status === "scheduled" || trip.status === "on_going",
			);

			// Get current time for starting soon filter
			const now = new Date();
			const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

			// Filter starting soon trips (within 60 minutes and today)
			const startingSoonData = scheduledTrips.filter((trip) => {
				const tripDate = new Date(trip.departureTime);
				return tripDate >= now && tripDate <= oneHourFromNow;
			});
			setStartingSoonTrips(startingSoonData);

			// Get starting soon trip IDs to exclude from other arrays
			const startingSoonIds = new Set(startingSoonData.map((trip) => trip.id));

			// Filter today's trips (scheduled trips happening today, excluding starting soon)
			const todayData = scheduledTrips.filter((trip) => {
				const tripDate = new Date(trip.departureTime);
				return tripDate >= todayStart && tripDate <= todayEnd && !startingSoonIds.has(trip.id);
			});
			setTodayTrips(todayData);

			// Filter upcoming trips (scheduled trips after today)
			const upcomingData = scheduledTrips.filter((trip) => {
				const tripDate = new Date(trip.departureTime);
				return tripDate > todayEnd;
			});
			setUpcomingTrips(upcomingData);

			const sortByDepartureTimeDesc = (arr: TripData[]) =>
				arr.slice().sort((a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime());

			// Filter and sort past trips
			const cancelledData = sortByDepartureTimeDesc(sortedTrips.filter((trip) => trip.status === "cancelled"));
			const completedData = sortByDepartureTimeDesc(sortedTrips.filter((trip) => trip.status === "completed"));
			const pastScheduledData = sortByDepartureTimeDesc(
				sortedTrips.filter((trip) => {
					const tripDate = new Date(trip.departureTime);
					return trip.status === "scheduled" && tripDate < todayStart;
				}),
			);

			setPastTrips([...cancelledData, ...completedData, ...pastScheduledData]);

			// Check if there are more trips to load
			if (trips.length === 0) {
				setHasMore(false);
			}
		} catch (error) {
			console.error("Failed to fetch trips:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTrips(page, false);
	}, [page]);

	// Infinite scroll handler
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleScroll = (e: any) => {
		const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
		if (bottom) {
			if (hasMore && !isLoading) {
				// setPage((prevPage) => prevPage + 1);
				setPage(1);
			}
		}
	};

	const tabs = [
		{
			value: "today",
			label: t("tabs.todaysTrips"),
			items: todayTrips,
			renderItem: (trip: TripData) => <TripOverview trip={trip} mobile={isMobile} />,
		},
		{
			value: "upcoming",
			label: t("tabs.upcomingTrips"),
			items: upcomingTrips,
			renderItem: (trip: TripData) => <TripOverview trip={trip} mobile={isMobile} />,
		},
		{
			value: "past",
			label: t("tabs.pastTrips"),
			items: pastTrips,
			renderItem: (trip: TripData) => <TripOverview trip={trip} mobile={isMobile} />,
		},
	];

	return (
		<ViewItemsTab
			title={t("title")}
			tabs={tabs}
			defaultTab="today"
			userRole="Driver"
			ongoingSection={
				startingSoonTrips.length > 0
					? {
							title: t("startingSoon"),
							content: <TripOverview trip={startingSoonTrips[0]} mobile={isMobile} />,
						}
					: undefined
			}
			isLoading={isLoading}
			noItemsMessage={t("noTrips")}
			scrollEvent={handleScroll}
		/>
	);
}
