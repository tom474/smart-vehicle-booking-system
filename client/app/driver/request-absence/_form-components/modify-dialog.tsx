import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LeaveScheduleData, updateLeaveSchedule } from "@/apis/leave-schedule";
import { VehicleServiceData, updateVehicleService } from "@/apis/vehicle-service";
import { ScheduleData, checkConflictSchedule, getSchedule } from "@/apis/schedule";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

type RequestType = "leave-schedule" | "vehicle-service";

interface ModifyDialogProps {
	form: UseFormReturn<LeaveScheduleData | VehicleServiceData>;
	setRequestData: (data: LeaveScheduleData | VehicleServiceData) => void;
	requestData: LeaveScheduleData | VehicleServiceData;
	requestType: RequestType;
	onRequestChange?: () => void | Promise<void>;
	setIsSheetOpen?: (open: boolean) => void;
	setConflictingSchedules?: (schedules: ScheduleData[]) => void;
	isProcessing?: boolean;
	setIsProcessing?: (processing: boolean) => void;
}

export default function ModifyDialog({
	form,
	setRequestData,
	requestData,
	requestType,
	onRequestChange,
	setIsSheetOpen,
	setConflictingSchedules,
	isProcessing = false,
	setIsProcessing,
}: ModifyDialogProps) {
	const t = useTranslations("DriverRequest.modifyDialog");

	const onRequestModify = async () => {
		if (!requestData) return;
		const updatedData = form.getValues();
		try {
			if (setIsProcessing) setIsProcessing(true);
			if (setConflictingSchedules) {
				const checkConflict = await checkConflictSchedule(
					updatedData.id,
					updatedData.driverId!,
					updatedData.startTime!,
					updatedData.endTime!,
				);
				if (checkConflict.isConflicted) {
					toast.error(t("toast.conflict"));
					const conflictingScheduleIds = checkConflict.conflictingScheduleIds;
					setConflictingSchedules(
						await Promise.all(
							conflictingScheduleIds.map(async (id: string | number) => await getSchedule(id)),
						),
					);
					return;
				}
			}

			let result: LeaveScheduleData | VehicleServiceData;
			if (requestType === "leave-schedule") {
				result = await updateLeaveSchedule(requestData.id, updatedData as LeaveScheduleData);
			} else {
				result = await updateVehicleService(requestData.id, updatedData as VehicleServiceData);
			}
			setRequestData(result);
			toast(t("toast.title"), {
				description: t("toast.description"),
			});
			setIsSheetOpen?.(false);
			if (onRequestChange) {
				await onRequestChange();
			}
		} catch (error) {
			const apiErr = apiErrHandler(error);
			if (apiErr) {
				toast.error(apiErr);
			} else {
				toast.error(t("toast.error"));
			}
		} finally {
			if (setIsProcessing) setIsProcessing(false);
		}
	};

	const isLeaveRequest = requestType === "leave-schedule";

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="default"
					className="flex-1"
					type="button"
					disabled={requestData.status !== "pending" || isProcessing}
				>
					{isProcessing ? t("modifying") : t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("confirmModification.normal")}{" "}
						<span className="text-primary">{t("confirmModification.destructive")}</span>
					</DialogTitle>
					<DialogDescription>
						{isLeaveRequest ? t("description.leave") : t("description.service")}
					</DialogDescription>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline" type="button">
								{t("cancel")}
							</Button>
						</DialogClose>
						<DialogClose asChild>
							<Button
								variant="default"
								type="button"
								onClick={async () => {
									await onRequestModify();
								}}
							>
								{t("confirm")}
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
