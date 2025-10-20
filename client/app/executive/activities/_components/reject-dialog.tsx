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
import { ExecutiveDailyActivityData, rejectExecutiveDailyActivity } from "@/apis/executive";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface RejectDialogProps {
	activityData: ExecutiveDailyActivityData;
	onActivityChange?: () => void | Promise<void>;
	setIsSheetOpen?: (open: boolean) => void;
	isProcessing?: boolean;
	setIsProcessing?: (processing: boolean) => void;
}

export default function RejectDialog({
	activityData,
	onActivityChange,
	setIsSheetOpen,
	isProcessing,
	setIsProcessing,
}: RejectDialogProps) {
	const t = useTranslations("ExecutiveActivities.rejectDialog");

	const onRequestCancel = async () => {
		if (!activityData) return;
		try {
			if (isProcessing) return;
			setIsProcessing?.(true);
			if (!activityData.id) throw new Error("Activity ID is missing.");
			await rejectExecutiveDailyActivity(activityData.id);
			toast(t("toast.title"), {
				description: t("toast.description"),
			});
			setIsSheetOpen?.(false);
			if (onActivityChange) {
				await onActivityChange();
			}
		} catch (error) {
			console.error("Failed to cancel expense:", error);
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
					variant="destructive"
					className="flex-1"
					type="button"
					disabled={activityData.status !== "pending" || isProcessing}
				>
					{isProcessing ? t("rejecting") : t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("confirmRejection.normal")}{" "}
						<span className="text-destructive">{t("confirmRejection.destructive")}</span>
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
