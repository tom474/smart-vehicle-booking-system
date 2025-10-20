"use client";

import { useState, useEffect } from "react";
import RequestForm from "@/app/driver/request-absence/request-form";
import { VehicleServiceData, getVehicleServices } from "@/apis/vehicle-service";
import { useIsMobile } from "@/hooks/useIsMobile";
import ServiceOverview from "@/app/driver/services/service-overview";
import { useTranslations } from "next-intl";
import ViewItemsTab from "@/components/view-items-tab";
import { getUserFromToken } from "@/lib/utils";

export default function ServicesPage() {
	const t = useTranslations("DriverServices");
	const isMobile = useIsMobile();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [ongoingService, setOngoingService] = useState<VehicleServiceData | null>(null);
	const [upcomingServices, setUpcomingServices] = useState<VehicleServiceData[]>([]);
	const [pendingServices, setPendingServices] = useState<VehicleServiceData[]>([]);
	const [pastServices, setPastServices] = useState<VehicleServiceData[]>([]);

	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	const fetchVehicleServices = async (pageNumber: number, all?: boolean) => {
		setIsLoading(true);
		let limit = 10;
		let shortLimit = 5;
		if (all) {
			limit = pageNumber * 10;
			shortLimit = pageNumber * 5;
			pageNumber = 1;
		}

		try {
			const driver = getUserFromToken();
			if (!driver) {
				console.error("No driver found in token");
				return;
			}

			const currentDate = new Date();

			// Fetch approved vehicle services
			const approvedServices = await getVehicleServices({
				driverId: driver.id,
				status: "approved",
				page: pageNumber,
				limit: limit,
			});
			// Sort by start date
			const approvedData = approvedServices.sort(
				(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
			);
			// Find ongoing service (approved and currently active)
			const ongoing = approvedData.find((service) => {
				const startTime = new Date(service.startTime);
				const endTime = new Date(service.endTime);
				return currentDate >= startTime && currentDate <= endTime;
			});
			setOngoingService(ongoing || null);

			// Filter upcoming approved services (future dates and not ongoing)
			const upcomingData = approvedData.filter((service) => {
				const startTime = new Date(service.startTime);
				return startTime > currentDate;
			});

			if (all) {
				// Replace entire state when refetching all data
				setUpcomingServices(upcomingData);
			} else {
				// Only merge when loading more pages
				setUpcomingServices((prev) => [
					...prev.filter((request) => !upcomingData.some((newReq) => newReq.id === request.id)),
					...upcomingData,
				]);
			}

			// Filter pending services
			const pendingServices = await getVehicleServices({
				driverId: driver.id,
				status: "pending",
				page: pageNumber,
				limit: limit,
			});

			if (all) {
				setPendingServices(pendingServices);
			} else {
				setPendingServices((prev) => [
					...prev.filter((request) => !pendingServices.some((newReq) => newReq.id === request.id)),
					...pendingServices,
				]);
			}

			// Filter past services (rejected, completed, or past approved - excluding ongoing)
			const rejectedLeaveSchedules = await getVehicleServices({
				driverId: driver.id,
				status: "rejected",
				page: pageNumber,
				limit: shortLimit,
				orderDirection: "DESC",
			});
			const completedLeaveSchedules = await getVehicleServices({
				driverId: driver.id,
				status: "completed",
				page: pageNumber,
				limit: shortLimit,
				orderDirection: "DESC",
			});
			const pastData = [...rejectedLeaveSchedules, ...completedLeaveSchedules];

			if (all) {
				setPastServices(pastData);
			} else {
				setPastServices((prev) => [
					...prev.filter((request) => !pastData.some((newReq) => newReq.id === request.id)),
					...pastData,
				]);
			}

			// Check if there are more items to load
			if (upcomingData.length === 0 && pendingServices.length === 0 && pastData.length === 0) {
				setHasMore(false);
			}
		} catch (error) {
			console.error("Failed to fetch vehicle services:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchVehicleServices(page, false);
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
			label: t("upcomingServices"),
			items: upcomingServices,
			renderItem: (service: VehicleServiceData) => (
				<ServiceOverview
					service={service}
					mobile={isMobile}
					onServiceChange={() => fetchVehicleServices(page, true)}
				/>
			),
		},
		{
			value: "pending",
			label: t("pendingRequests"),
			items: pendingServices,
			renderItem: (service: VehicleServiceData) => (
				<ServiceOverview
					service={service}
					mobile={isMobile}
					onServiceChange={() => fetchVehicleServices(page, true)}
				/>
			),
		},
		{
			value: "past",
			label: t("pastRequests"),
			items: pastServices,
			renderItem: (service: VehicleServiceData) => (
				<ServiceOverview
					service={service}
					mobile={isMobile}
					onServiceChange={() => fetchVehicleServices(page, true)}
				/>
			),
		},
	];

	return (
		<ViewItemsTab
			title={t("title")}
			tabs={tabs}
			defaultTab="upcoming"
			userRole="Driver"
			ongoingSection={
				ongoingService
					? {
							title: t("onGoingService"),
							content: <ServiceOverview service={ongoingService} mobile={isMobile} />,
						}
					: undefined
			}
			actionButton={
				<RequestForm
					requestType="vehicle-service"
					mobile={isMobile}
					onRequestChange={() => fetchVehicleServices(page, true)}
				/>
			}
			isLoading={isLoading}
			noItemsMessage={t("noServices")}
			scrollEvent={handleScroll}
		/>
	);
}
