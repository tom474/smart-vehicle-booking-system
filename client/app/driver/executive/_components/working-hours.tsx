import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { ExecutiveDailyActivityData } from "@/apis/executive";
import { Separator } from "@/components/ui/separator";

export default function WorkingHoursField({ activityData }: { activityData: ExecutiveDailyActivityData }) {
	const t = useTranslations("DriverLogActivity.activityDetails");

	return (
		<>
			<div className="flex justify-between p-1">
				<div className="flex flex-row items-center gap-2 text-subtitle-1">
					<Clock />
					{t("duration")}
				</div>
				<div>
					<Input
						type="text"
						disabled={true}
						className="p-0 border-none shadow-none cursor-not-allowed text-end focus-visible:ring-0 md:text-md opacity-60"
						value={
							activityData.workedMinutes
								? (() => {
										const hours = Math.floor(activityData.workedMinutes / 60);
										const minutes = activityData.workedMinutes % 60;
										if (hours > 0 && minutes > 0) {
											return `${hours} ${t("hours")} ${minutes} ${t("minutes")}`;
										} else if (hours > 0) {
											return `${hours} ${t("hours")}`;
										} else {
											return `${minutes} ${t("minutes")}`;
										}
									})()
								: "N/A"
						}
					/>
				</div>
			</div>
			<Separator />
		</>
	);
}
