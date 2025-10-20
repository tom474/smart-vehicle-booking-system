import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelBookingRequest } from "@/apis/booking-request";
import { TripTicketData } from "@/apis/trip-ticket";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CancelDialog({ tripData, onCancel }: { tripData: TripTicketData; onCancel: () => void }) {
	const t = useTranslations("RequesterTripDay.cancelDialog");

	const [reason, setReason] = useState("");
	const [open, setOpen] = useState(false);

	const isReasonValid = reason.trim().length >= 8 && reason.trim().length <= 500;

	const handleCancel = async () => {
		if (!isReasonValid) return;

		try {
			await cancelBookingRequest(tripData.bookingRequestId, reason);
			onCancel();
			setOpen(false);
		} catch (error) {
			console.error("Error cancelling trip:", error);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="flex-1 text-destructive border-destructive hover:bg-destructive/100 hover:text-background"
				>
					{t("cancelTrip")}
				</Button>
			</DialogTrigger>
			<DialogContent className="p-4 z-100">
				<DialogHeader>
					<DialogTitle>{t("reason")}</DialogTitle>
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
				<DialogFooter className="flex flex-row gap-2">
					<Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
						{t("cancelBtn")}
					</Button>
					<Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={!isReasonValid}>
						{t("confirmBtn")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
