"use client";

import { useState, useEffect } from "react";
import RequestForm from "@/app/driver/request-absence/request-form";
import { LeaveScheduleData, getLeaveSchedules } from "@/apis/leave-schedule";
import { useIsMobile } from "@/hooks/useIsMobile";
import LeaveOverview from "@/app/driver/leave/leave-overview";
import { useTranslations } from "next-intl";
import ViewItemsTab from "@/components/view-items-tab";
import { getUserFromToken } from "@/lib/utils";

export default function LeavePage() {
	const t = useTranslations("DriverLeave");
	const isMobile = useIsMobile();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [ongoingLeave, setOngoingLeave] = useState<LeaveScheduleData | null>(null);
	const [upcomingLeaveSchedules, setUpcomingLeaveSchedules] = useState<LeaveScheduleData[]>([]);
	const [pendingLeaveSchedules, setPendingLeaveSchedules] = useState<LeaveScheduleData[]>([]);
	const [pastLeaveSchedules, setPastLeaveSchedules] = useState<LeaveScheduleData[]>([]);

	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	const fetchLeaveSchedules = async (pageNumber: number, all?: boolean) => {
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

			// Fetch approved leave schedules
			const approvedLeaveSchedules = await getLeaveSchedules({
				driverId: driver.id,
				status: "approved",
				page: pageNumber,
				limit: limit,
			});
			// Sort by start date
			const approvedData = approvedLeaveSchedules.sort(
				(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
			);
			// Find ongoing leave (approved and currently active)
			const ongoing = approvedData.find((leave) => {
				const startTime = new Date(leave.startTime);
				const endTime = new Date(leave.endTime);
				return currentDate >= startTime && currentDate <= endTime;
			});
			setOngoingLeave(ongoing || null);

			// Filter upcoming approved leave schedules (future dates and not ongoing)
			const upcomingData = approvedData.filter((leave) => {
				if (ongoing && leave.id === ongoing.id) return false; // Exclude ongoing leave
				const startTime = new Date(leave.startTime);
				return startTime > currentDate;
			});

			if (all) {
				// Replace entire state when refetching all data
				setUpcomingLeaveSchedules(upcomingData);
			} else {
				// Only merge when loading more pages
				setUpcomingLeaveSchedules((prev) => [
					...prev.filter((request) => !upcomingData.some((newReq) => newReq.id === request.id)),
					...upcomingData,
				]);
			}

			// Fetch pending leave schedules
			const pendingLeaveSchedules = await getLeaveSchedules({
				driverId: driver.id,
				status: "pending",
				page: pageNumber,
				limit: limit,
			});

			if (all) {
				setPendingLeaveSchedules(pendingLeaveSchedules);
			} else {
				setPendingLeaveSchedules((prev) => [
					...prev.filter((request) => !pendingLeaveSchedules.some((newReq) => newReq.id === request.id)),
					...pendingLeaveSchedules,
				]);
			}

			// Fetch past leave schedules (rejected, completed)
			const rejectedLeaveSchedules = await getLeaveSchedules({
				driverId: driver.id,
				status: "rejected",
				page: pageNumber,
				limit: shortLimit,
				orderDirection: "DESC",
			});
			const completedLeaveSchedules = await getLeaveSchedules({
				driverId: driver.id,
				status: "completed",
				page: pageNumber,
				limit: shortLimit,
				orderDirection: "DESC",
			});
			const pastData = [...rejectedLeaveSchedules, ...completedLeaveSchedules];

			if (all) {
				setPastLeaveSchedules(pastData);
			} else {
				setPastLeaveSchedules((prev) => [
					...prev.filter((request) => !pastData.some((newReq) => newReq.id === request.id)),
					...pastData,
				]);
			}

			// Check if there are more items to load
			if (upcomingData.length === 0 && pendingLeaveSchedules.length === 0 && pastData.length === 0) {
				setHasMore(false);
			}
		} catch (error) {
			console.error("Failed to fetch leave schedules:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchLeaveSchedules(page, false);
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
			label: t("upcomingLeave"),
			items: upcomingLeaveSchedules,
			renderItem: (leave: LeaveScheduleData) => (
				<LeaveOverview leave={leave} mobile={isMobile} onLeaveChange={() => fetchLeaveSchedules(page, true)} />
			),
		},
		{
			value: "pending",
			label: t("pendingRequests"),
			items: pendingLeaveSchedules,
			renderItem: (leave: LeaveScheduleData) => (
				<LeaveOverview leave={leave} mobile={isMobile} onLeaveChange={() => fetchLeaveSchedules(page, true)} />
			),
		},
		{
			value: "past",
			label: t("pastRequests"),
			items: pastLeaveSchedules,
			renderItem: (leave: LeaveScheduleData) => (
				<LeaveOverview leave={leave} mobile={isMobile} onLeaveChange={() => fetchLeaveSchedules(page, true)} />
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
				ongoingLeave
					? {
							title: t("onGoingLeave"),
							content: <LeaveOverview leave={ongoingLeave} mobile={isMobile} />,
						}
					: undefined
			}
			actionButton={
				<RequestForm
					requestType="leave-schedule"
					mobile={isMobile}
					onRequestChange={() => fetchLeaveSchedules(page, true)}
				/>
			}
			isLoading={isLoading}
			noItemsMessage={t("noLeaves")}
			scrollEvent={handleScroll}
		/>
	);
}
