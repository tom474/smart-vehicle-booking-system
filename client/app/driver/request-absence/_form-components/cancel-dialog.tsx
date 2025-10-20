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
import { LeaveScheduleData, cancelLeaveSchedule } from "@/apis/leave-schedule";
import { VehicleServiceData, cancelVehicleService } from "@/apis/vehicle-service";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

type RequestType = "leave-schedule" | "vehicle-service";

interface CancelDialogProps {
	requestData: LeaveScheduleData | VehicleServiceData;
	requestType: RequestType;
	onRequestChange?: () => void | Promise<void>;
	setIsSheetOpen?: (open: boolean) => void;
	disabled?: boolean;
	isProcessing?: boolean;
	setIsProcessing?: (processing: boolean) => void;
}

export default function CancelDialog({
	requestData,
	requestType,
	onRequestChange,
	setIsSheetOpen,
	disabled = false,
	isProcessing = false,
	setIsProcessing,
}: CancelDialogProps) {
	const t = useTranslations("DriverRequest.cancelDialog");

	const onRequestCancel = async () => {
		if (!requestData) return;
		try {
			if (setIsProcessing) setIsProcessing(true);
			if (requestType === "leave-schedule") {
				await cancelLeaveSchedule(requestData.id);
			} else {
				await cancelVehicleService(requestData.id);
			}
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
					variant="destructive"
					className="flex-1"
					type="button"
					disabled={requestData.status !== "pending" || disabled || isProcessing}
				>
					{isProcessing ? t("cancelling") : t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("confirmCancellation.normal")}{" "}
						<span className="text-destructive">{t("confirmCancellation.destructive")}</span>
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
								variant="destructive"
								type="button"
								onClick={async () => {
									await onRequestCancel();
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
