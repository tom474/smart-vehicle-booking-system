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
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { confirmStartTrip } from "@/apis/trip";

interface StartEarlyDialogProps {
	tripId: string;
	isProcessing: boolean;
	setIsProcessing: (loading: boolean) => void;
}

export default function StartEarlyDialog({ tripId, isProcessing, setIsProcessing }: StartEarlyDialogProps) {
	const t = useTranslations("DriverTrips");

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="destructive" className="w-full" type="button" disabled={isProcessing}>
					{t("startTripEarly")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("startEarlyTitle")}</DialogTitle>
					<DialogDescription>{t("startEarlyDescription")}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" type="button" className="flex-1" disabled={isProcessing}>
							{t("cancel")}
						</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button
							variant="default"
							className="flex-1"
							disabled={isProcessing}
							onClick={async () => {
								if (tripId) {
									setIsProcessing(true);
									const status = await confirmStartTrip(tripId);
									if (status) {
										redirect(`/driver/trip?tripId=${tripId}`);
									} else {
										toast.error("Failed to start trip. Please try again.");
									}
								}
							}}
						>
							{isProcessing ? t("starting") : t("startTrip")}
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
