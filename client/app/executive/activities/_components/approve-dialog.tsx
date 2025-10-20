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
import { ExecutiveDailyActivityData, approveExecutiveDailyActivity } from "@/apis/executive";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";

interface ApproveDialogProps {
	form: UseFormReturn<ExecutiveDailyActivityData>;
	setActivityData: (data: ExecutiveDailyActivityData) => void;
	activityData: ExecutiveDailyActivityData;
	coordinator?: boolean;
	onActivityChange?: () => void | Promise<void>;
	setIsSheetOpen?: (open: boolean) => void;
	isProcessing?: boolean;
	setIsProcessing?: (processing: boolean) => void;
}

export default function ApproveDialog({
	form,
	setActivityData,
	activityData,
	onActivityChange,
	setIsSheetOpen,
	isProcessing,
	setIsProcessing,
}: ApproveDialogProps) {
	const t = useTranslations("ExecutiveActivities.approveDialog");

	const onRequestModify = async () => {
		if (!activityData) return;
		try {
			if (isProcessing) return;
			setIsProcessing?.(true);
			if (!activityData.id) throw new Error("Activity ID is missing.");
			const updatedBooking = await approveExecutiveDailyActivity(activityData.id);
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
			console.error("Failed to modify expense:", error);
			toast.error(t("toast.error"), {
				description: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsProcessing?.(false);
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
					{isProcessing ? t("approving") : t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("confirmApproval.normal")}{" "}
						<span className="text-primary">{t("confirmApproval.destructive")}</span>
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
