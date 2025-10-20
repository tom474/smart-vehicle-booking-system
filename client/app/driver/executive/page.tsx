"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ExecutiveDailyActivityData, getExecutiveDailyActivities } from "@/apis/executive";
import ActivityOverview from "@/app/driver/executive/activity-overview";
import LogActivity from "@/app/driver/executive/log-activity";
import { useTranslations } from "next-intl";
import { getUserFromToken } from "@/lib/utils";
import ViewItems from "@/components/view-items";

export default function ExecutiveDailyActivityPage() {
	const t = useTranslations("DriverLogActivity");
	const isMobile = useIsMobile();
	const searchParams = useSearchParams();
	const activityId = searchParams.get("activityId");
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [dailyActivities, setdailyActivities] = useState<ExecutiveDailyActivityData[]>([]);
	const [openActivityId, setOpenActivityId] = useState<number | string | null | undefined>(null);

	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	const fetchActivities = async (pageNumber: number, all?: boolean) => {
		setIsLoading(true);
		let limit = 10;
		if (all) {
			limit = pageNumber * 10;
			pageNumber = 1;
		}

		try {
			const driver = getUserFromToken();
			if (!driver?.id) {
				setdailyActivities([]);
				setIsLoading(false);
				return;
			}
			const _dailyActivities = await getExecutiveDailyActivities({
				id: driver.id,
				driver: true,
				page: pageNumber,
				limit: limit,
			});
			if (all) {
				setdailyActivities(_dailyActivities);
			} else {
				setdailyActivities((prev) => [
					...prev.filter((request) => !_dailyActivities.some((newReq) => newReq.id === request.id)),
					..._dailyActivities,
				]);
			}
			if (activityId) {
				const activity = _dailyActivities.find((a) => a.id === activityId);
				if (activity) {
					setOpenActivityId(activity.id);
				}
			}
			if (_dailyActivities.length === 0) {
				setHasMore(false);
			}
		} catch (error) {
			console.error("Failed to fetch daily activities:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchActivities(page, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
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

	return (
		<ViewItems
			title={t("title")}
			items={dailyActivities}
			renderItem={(activity) => (
				<ActivityOverview
					activity={activity}
					mobile={isMobile}
					openInitially={openActivityId === activity.id}
					onActivityChange={() => fetchActivities(page, true)}
				/>
			)}
			isLoading={isLoading}
			noItemsMessage={t("noActivities")}
			userRole="Driver"
			headerAction={<LogActivity mobile={isMobile} onActivityChange={() => fetchActivities(page, true)} />}
			scrollEvent={handleScroll}
		/>
	);
}
