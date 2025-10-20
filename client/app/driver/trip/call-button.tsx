import { Phone } from "lucide-react";
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
import { useTranslations } from "next-intl";

export default function CallButton({ name, phoneNumber }: { name: string; phoneNumber: string }) {
	const t = useTranslations("DriverTripDay.callDialog");

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="rounded-full size-8">
					<Phone className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="p-4 z-100">
				<DialogHeader>
					<DialogTitle>{t("contactPassengerAt")}:</DialogTitle>
					<DialogDescription>
						{name} / {phoneNumber}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="default"
						className="w-full"
						onClick={() => {
							window.location.href = `tel:${phoneNumber}`;
						}}
					>
						{t("callNow")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
