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

export default function ArriveDialog({
	setCompleted,
	setIsOnBoard,
}: {
	setCompleted?: () => void;
	setIsOnBoard?: () => void;
}) {
	const t = useTranslations("RequesterTripDay");

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="default" className="w-full bg-success hover:bg-success/90">
					{t("arriveDialog.title")}
				</Button>
			</DialogTrigger>
			<DialogContent className="p-4 z-100">
				<DialogHeader>
					<DialogTitle>{t("arriveDialog.header")}</DialogTitle>
					<DialogDescription>{t("arriveDialog.description")}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="default"
						className="w-full bg-success hover:bg-success/90"
						onClick={() => {
							if (setCompleted) setCompleted();
							if (setIsOnBoard) setIsOnBoard();
						}}
					>
						{t("arriveDialog.arrivedButton")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
