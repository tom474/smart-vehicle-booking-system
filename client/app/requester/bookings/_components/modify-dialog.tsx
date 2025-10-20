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
import { BookingRequestData } from "@/apis/booking-request";
import { updateBookingRequest } from "@/apis/booking-request";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { apiErrHandler } from "@/lib/error-handling";

interface ModifyDialogProps {
	form: UseFormReturn<BookingRequestData>;
	setBookingData: (data: BookingRequestData) => void;
	bookingData: BookingRequestData;
	onBookingChange?: () => void | Promise<void>;
	setIsSheetOpen?: (open: boolean) => void;
	isProcessing?: boolean;
	setIsProcessing?: (processing: boolean) => void;
	disabled?: boolean;
}

export default function ModifyDialog({
	form,
	setBookingData,
	bookingData,
	onBookingChange,
	setIsSheetOpen,
	isProcessing = false,
	setIsProcessing,
	disabled = false,
}: ModifyDialogProps) {
	const t = useTranslations("RequesterBookings.modifyDialog");
	const router = useRouter();

	const onRequestModify = async () => {
		if (!bookingData) return;
		try {
			setIsProcessing?.(true);
			const updatedData = form.getValues();
			const updatedBooking = await updateBookingRequest(bookingData.id, updatedData);
			setBookingData(updatedBooking);
			form.reset(updatedBooking);
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
			<DialogTrigger asChild>
				<Button
					variant="default"
					className="flex-1"
					type="button"
					disabled={bookingData.status !== "pending" || isProcessing || disabled}
				>
					{t("button")}
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
