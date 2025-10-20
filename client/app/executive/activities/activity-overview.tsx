"use client";

import { ChevronRight, UserRoundCog, Car, Dot } from "lucide-react";
import StatusBadge from "@/components/status-badge";
import { ExecutiveDailyActivityData } from "@/apis/executive";
import { format } from "date-fns";
import ActivityDetails from "@/app/executive/activities/activity-details";
import { useTranslations } from "next-intl";
import { capitalize } from "@/lib/string-utils";

interface ActivityOverviewProps {
	activity: ExecutiveDailyActivityData;
	mobile?: boolean;
	onlyOverview?: boolean;
	openInitially?: boolean;
	onActivityChange?: () => void | Promise<void>;
}

export default function ActivityOverview({
	activity,
	mobile = true,
	onlyOverview = false,
	openInitially = false,
	onActivityChange,
}: ActivityOverviewProps) {
	if (onlyOverview) {
		return <OverviewDetails activity={activity} />;
	}

	return (
		<ActivityDetails
			activityId={activity.id ?? ""}
			data={activity}
			trigger={<OverviewDetails activity={activity} />}
			mobile={mobile}
			openInitially={openInitially}
			onActivityChange={onActivityChange}
		/>
	);
}

function OverviewDetails({ activity }: { activity: ExecutiveDailyActivityData }) {
	const t = useTranslations("DriverLogActivity.activityDetails");

	// const duration = (() => {
	// 	const workedMinutes = activity.workedMinutes ?? 0;
	// 	const hours = Math.floor(workedMinutes / 60);
	// 	const minutes = workedMinutes % 60;
	// 	if (hours > 0 && minutes > 0) {
	// 		return `${hours} ${t("hours")} ${minutes} ${t("minutes")}`;
	// 	} else if (hours > 0) {
	// 		return `${hours} ${t("hours")}`;
	// 	} else {
	// 		return `${minutes} ${t("minutes")}`;
	// 	}
	// })();

	return (
		<div className="flex flex-row gap-4">
			<div
				className={
					`w-1.5 flex-shrink-0 rounded-tr-md rounded-br-md ` +
					`${
						activity.status === "approved"
							? "bg-success"
							: activity.status === "pending"
								? "bg-warning"
								: activity.status === "rejected"
									? "bg-destructive"
									: "bg-info"
					} `
				}
			></div>
			<div className="flex-1 min-w-0 space-y-2">
				<div className="flex flex-row gap-2 text-start">
					<div className="space-y-1">
						<div className="text-subtitle-1">
							{format(activity.startTime, "HH:mm")} - {format(activity.endTime, "HH:mm")}
						</div>
						<div className="text-body-2 text-muted-foreground">
							{format(activity.startTime, "dd/MM/yyyy")}
							{activity.startTime.toDateString() !== activity.endTime.toDateString() &&
								` - ${format(activity.endTime, "dd/MM/yyyy")}`}
						</div>
					</div>
				</div>

				{/* {duration && (
					<div className="flex flex-row items-center gap-2 text-start">
						<Clock />
						<div>
							<span className="text-subtitle-2">{t("duration")}: </span>
							<span className="text-body-2 text-muted-foreground">{duration}</span>
						</div>
					</div>
				)} */}

				{activity.driver && (
					<div className="flex flex-row items-center gap-2">
						<UserRoundCog className="flex-shrink-0" />
						<div className="flex flex-col items-start min-w-0">
							<span className="text-subtitle-2">
								{t("driver")}: {activity.driver.name}
							</span>
							<span className="text-body-2 text-muted-foreground">{activity.driver.phoneNumber}</span>
						</div>
					</div>
				)}

				{activity.vehicle && (
					<div className="flex flex-row items-center gap-2">
						<Car className="flex-shrink-0" />
						<div className="flex flex-col items-start min-w-0">
							<span className="text-subtitle-2">{activity.vehicle.licensePlate}</span>
							<span className="flex flex-row items-center text-body-2 text-muted-foreground">
								{activity.vehicle.model} <Dot /> {capitalize(activity.vehicle.color)}
							</span>
						</div>
					</div>
				)}

				{/* <div className="flex flex-row items-center gap-2 text-start">
					<Text />
					<div>
						<span className="text-subtitle-2">{t("notes")}: </span>
						<span className="text-body-2 text-muted-foreground">{activity.notes || t("noNotes")}</span>
					</div>
				</div> */}
				<StatusBadge status={activity.status!} />
			</div>
			<div className="flex flex-row items-center justify-center flex-shrink-0 h-full">
				<ChevronRight />
			</div>
		</div>
	);
}
