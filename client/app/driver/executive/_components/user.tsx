import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { UserPen, UserRoundCog, Car } from "lucide-react";
import { ExecutiveDailyActivityData } from "@/apis/executive";
import { Separator } from "@/components/ui/separator";

export default function UserField({ activityData, type }: { activityData: ExecutiveDailyActivityData; type?: string }) {
	const t = useTranslations("DriverLogActivity.activityDetails");

	return (
		<>
			<div className="flex justify-between p-1">
				<div className="flex flex-row items-center gap-2 text-subtitle-1">
					{type === "driver" ? (
						<>
							<UserRoundCog />
							{t("driver")}
						</>
					) : type === "executive" ? (
						<>
							<UserPen />
							{t("executive")}
						</>
					) : (
						<>
							<Car />
							{t("vehicle")}
						</>
					)}
				</div>
				<div>
					<Input
						type="text"
						disabled={true}
						className="p-0 border-none shadow-none cursor-not-allowed text-end focus-visible:ring-0 md:text-md opacity-60"
						value={
							type === "driver"
								? activityData.driver?.name || "N/A"
								: type === "executive"
									? activityData.executive?.name || "N/A"
									: activityData.vehicle?.licensePlate || "N/A"
						}
					/>
				</div>
			</div>
			{type !== "vehicle" && <Separator />}
		</>
	);
}
