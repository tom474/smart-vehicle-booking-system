import { useState } from "react";
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
import { BookingRequestData, cancelBookingRequest } from "@/apis/booking-request";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { apiErrHandler } from "@/lib/error-handling";

interface CancelDialogProps {
	setBookingData: (data: BookingRequestData) => void;
	bookingData: BookingRequestData;
	onBookingChange?: () => void | Promise<void>;
	setIsSheetOpen?: (open: boolean) => void;
	onPropCancel?: () => void;
	isProcessing?: boolean;
	setIsProcessing?: (processing: boolean) => void;
	disabled?: boolean;
}

export default function CancelDialog({
	setBookingData,
	bookingData,
	onBookingChange,
	setIsSheetOpen,
	onPropCancel,
	isProcessing = false,
	setIsProcessing,
	disabled = false,
}: CancelDialogProps) {
	const t = useTranslations("RequesterBookings.cancelDialog");
	const router = useRouter();

	const [reason, setReason] = useState("");

	const isReasonValid = reason.trim().length >= 8 && reason.trim().length <= 500;

	const onRequestCancel = async () => {
		if (!isReasonValid) return;
		if (!bookingData) return;
		try {
			setIsProcessing?.(true);
			const updatedBooking = await cancelBookingRequest(bookingData.id, reason);
			setBookingData(updatedBooking);
			toast(t("toast.title"), {
				description: t("toast.description"),
			});
			setIsSheetOpen?.(false);
			setIsProcessing?.(false);
			if (onBookingChange) {
				await onBookingChange();
			}
			router.refresh();
		} catch (error) {
			const apiErr = apiErrHandler(error);
			if (apiErr) {
				toast.error(apiErr);
			} else {
				toast.error(t("toast.error"), {
					description: error instanceof Error ? error.message : String(error),
				});
			}
			setIsProcessing?.(false);
		}
	};

	return (
		<Dialog>
			{onPropCancel ? (
				<Button
					onClick={() => onPropCancel()}
					variant="destructive"
					className="flex-1"
					type="button"
					disabled={
						(bookingData.status !== "pending" && bookingData.status !== "approved") ||
						isProcessing ||
						disabled
					}
				>
					{t("button")}
				</Button>
			) : (
				<DialogTrigger asChild>
					<Button
						variant="destructive"
						className="flex-1"
						type="button"
						disabled={
							(bookingData.status !== "pending" && bookingData.status !== "approved") ||
							isProcessing ||
							disabled
						}
					>
						{t("button")}
					</Button>
				</DialogTrigger>
			)}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("confirmCancellation.normal")}{" "}
						<span className="text-destructive">{t("confirmCancellation.destructive")} </span>
					</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Textarea
						id="reason"
						className="text-foreground"
						placeholder="Enter the reason for cancelling..."
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={3}
					/>
					<div className="ml-1 text-xs text-muted-foreground">
						{reason.trim().length}/500 {t("characters")}
						{reason.trim().length > 0 && reason.trim().length < 8 && (
							<span className="ml-2 text-destructive">{t("minimum")}</span>
						)}
						{reason.trim().length > 500 && <span className="ml-2 text-destructive">{t("maximum")}</span>}
					</div>
				</div>
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
							disabled={!isReasonValid}
						>
							{t("confirm")}
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
