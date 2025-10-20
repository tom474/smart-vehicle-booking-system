import { useState, useEffect } from "react";
import { Text, ChevronRight, Lightbulb } from "lucide-react";
import StatusBadge from "@/components/status-badge";
import { format } from "date-fns";
import { LeaveScheduleData } from "@/apis/leave-schedule";
import RequestDetails from "@/app/driver/request-absence/request-details";
import { useTranslations } from "next-intl";

export default function LeaveOverview({
	leave,
	mobile = true,
	onlyOverview = false,
	onLeaveChange,
}: {
	leave: LeaveScheduleData;
	mobile?: boolean;
	onlyOverview?: boolean;
	onLeaveChange?: () => void | Promise<void>;
}) {
	if (onlyOverview) {
		return <OverviewDetails leave={leave} />;
	}

	return (
		<RequestDetails
			requestId={leave.id}
			requestType="leave-schedule"
			data={leave}
			trigger={<OverviewDetails leave={leave} />}
			mobile={mobile}
			onRequestChange={onLeaveChange}
		/>
	);
}

function OverviewDetails({ leave }: { leave: LeaveScheduleData }) {
	const t = useTranslations("DriverLeave");

	const [status, setStatus] = useState<
		"approved" | "pending" | "rejected" | "cancelled" | "completed" | "on_going"
	>();

	useEffect(() => {
		if (leave.status === "approved") {
			const now = new Date();
			const startTime = new Date(leave.startTime);
			const endTime = new Date(leave.endTime);

			if (now >= startTime && now <= endTime) {
				setStatus("on_going");
			} else {
				setStatus("approved");
			}
		} else {
			setStatus(leave.status);
		}
	}, [leave]);

	return (
		<div key={leave.id} className="flex flex-row gap-4">
			<div
				className={
					`w-1.5 flex-shrink-0 rounded-tr-md rounded-br-md ` +
					`${
						status === "approved"
							? "bg-success"
							: status === "pending"
								? "bg-warning"
								: status === "rejected"
									? "bg-destructive"
									: status === "completed"
										? "bg-info"
										: "bg-info"
					} `
				}
			></div>
			<div className="flex-1 min-w-0 space-y-2">
				<div className="flex flex-row items-center gap-2">
					<span className="text-subtitle-1">
						{format(leave.startTime, "dd/MM/yyyy")} - {format(leave.endTime, "dd/MM/yyyy")}
					</span>
				</div>
				<div className="flex flex-row items-center gap-2 text-start">
					<Lightbulb />
					<div>
						<span className="text-subtitle-2">{t("reason")}: </span>
						<span className="text-body-2 text-muted-foreground">
							{leave.reason || "No reason provided"}
						</span>
					</div>
				</div>
				<div className="flex flex-row items-center gap-2 text-start">
					<Text />
					<div>
						<span className="text-subtitle-2">{t("notes")}: </span>
						<span className="text-body-2 text-muted-foreground">{leave.notes || t("noNotes")}</span>
					</div>
				</div>
				<StatusBadge status={status!} />
			</div>
			<div className="flex flex-row items-center justify-center flex-shrink-0 h-full">
				<ChevronRight />
			</div>
		</div>
	);
}
