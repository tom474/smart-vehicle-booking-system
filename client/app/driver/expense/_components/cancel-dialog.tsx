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
import { ExpenseData, deleteExpense } from "@/apis/expense";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

interface CancelDialogProps {
	expenseData: ExpenseData;
	onExpenseChange?: () => void | Promise<void>;
	setIsSheetOpen?: (open: boolean) => void;
	isProcessing?: boolean;
	setIsProcessing?: (processing: boolean) => void;
}

export default function CancelDialog({
	expenseData,
	onExpenseChange,
	setIsSheetOpen,
	isProcessing,
	setIsProcessing,
}: CancelDialogProps) {
	const t = useTranslations("DriverExpenses.cancelDialog");

	const onRequestCancel = async () => {
		if (!expenseData) return;
		try {
			if (isProcessing || (setIsProcessing && isProcessing)) return;
			if (setIsProcessing) setIsProcessing(true);
			if (!expenseData.id) throw new Error("Expense ID is missing.");
			await deleteExpense(expenseData.id);
			toast(t("toast.title"), {
				description: t("toast.description"),
			});
			setIsSheetOpen?.(false);
			if (onExpenseChange) {
				await onExpenseChange();
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
					variant="destructive"
					className="flex-1"
					type="button"
					disabled={expenseData.status !== "pending" || isProcessing}
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
