import { CircleAlert } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

export default function ReportIncident() {
	const t = useTranslations("DriverTripDay.reportIncident");

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="py-5 has-[>svg]:px-2 rounded-full hover:bg-background">
					<CircleAlert className="size-6" />
					<span className="sr-only">{t("title")}</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="p-4 z-100">
				<DialogHeader>
					<DialogTitle>{t("reason")}</DialogTitle>
					<DialogDescription>
						{t("description")}
						<Input type="text" placeholder="Enter your reason here..." className="mt-2" required />
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="destructive" className="w-full">
						{t("reportBtn")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
