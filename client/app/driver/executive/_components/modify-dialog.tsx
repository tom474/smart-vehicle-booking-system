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
import { ExecutiveDailyActivityData, updateExecutiveDailyActivity } from "@/apis/executive";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

interface ModifyDialogProps {
	form: UseFormReturn<ExecutiveDailyActivityData>;
	setActivityData: (data: ExecutiveDailyActivityData) => void;
	activityData: ExecutiveDailyActivityData;
	coordinator?: boolean;
	onActivityChange?: () => void | Promise<void>;
	setIsSheetOpen?: (open: boolean) => void;
	isProcessing?: boolean;
	setIsProcessing?: (processing: boolean) => void;
}

export default function ModifyDialog({
	form,
	setActivityData,
	activityData,
	onActivityChange,
	setIsSheetOpen,
	isProcessing,
	setIsProcessing,
}: ModifyDialogProps) {
	const t = useTranslations("DriverLogActivity.modifyDialog");

	const onRequestModify = async () => {
		if (!activityData) return;
		try {
			if (isProcessing || (setIsProcessing && isProcessing)) return;
			if (setIsProcessing) setIsProcessing(true);
			const updatedData = form.getValues();
			if (!activityData.id) throw new Error("Activity ID is missing.");
			const updatedBooking = await updateExecutiveDailyActivity(activityData.id, updatedData);
			if (!updatedBooking) return;
			setActivityData(updatedBooking);
			form.reset(updatedBooking);
			toast(t("toast.title"), {
				description: t("toast.description"),
			});
			setIsSheetOpen?.(false);
			if (onActivityChange) {
				await onActivityChange();
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

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="default"
					className="flex-1"
					type="button"
					disabled={activityData.status !== "pending" || isProcessing}
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
					<DialogDescription>{t("description")}</DialogDescription>
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
