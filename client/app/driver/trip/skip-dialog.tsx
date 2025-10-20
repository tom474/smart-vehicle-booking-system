import { useState } from "react";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserGroupData } from "@/apis/stop";
import { useTranslations } from "next-intl";

interface SkipDialogProps {
	userGroup?: UserGroupData;
	allGroups?: UserGroupData[];
	onSkip: (reason: string, userGroup?: UserGroupData) => void;
	isSkipAll?: boolean;
	disabled?: boolean;
}

export default function SkipDialog({
	userGroup,
	allGroups,
	onSkip,
	isSkipAll = false,
	disabled = false,
}: SkipDialogProps) {
	const t = useTranslations("DriverTripDay.skipDialog");

	const [isOpen, setIsOpen] = useState(false);
	const [reason, setReason] = useState("");

	const isReasonValid = reason.trim().length >= 8 && reason.trim().length <= 500;

	const handleSkip = () => {
		if (!isReasonValid) return;

		onSkip(reason.trim(), userGroup);
		setReason("");
		setIsOpen(false);
	};

	const handleCancel = () => {
		setReason("");
		setIsOpen(false);
	};

	const getTitle = () => {
		if (isSkipAll) {
			return t("skipAllPassengers");
		}
		return userGroup ? `${t("skipGroup")} ${userGroup.bookingRequestId}` : t("skipPassenger");
	};

	const getDescription = () => {
		if (isSkipAll && allGroups) {
			const totalPassengers = allGroups.reduce((sum, group) => sum + group.users.length, 0);
			return t("description.skipAll", {
				groupCount: allGroups.length,
				passengerCount: totalPassengers,
			});
		}
		if (userGroup) {
			return t("description.skipGroup", {
				bookingId: userGroup.bookingRequestId,
				passengerCount: userGroup.users.length,
			});
		}
		return t("description.skipPassenger");
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant={isSkipAll ? "outline" : "ghost"}
					size={isSkipAll ? undefined : "sm"}
					className="text-destructive hover:text-destructive hover:bg-destructive/10"
					disabled={disabled}
				>
					{isSkipAll ? t("skipAll") : <UserX className="size-4" />}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] z-200">
				<DialogHeader>
					<DialogTitle>{getTitle()}</DialogTitle>
					<DialogDescription className="text-left">{getDescription()}</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="reason">{t("reasonForSkipping")}</Label>
						<Textarea
							id="reason"
							placeholder={t("enterReason")}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
						/>
						<div className="text-xs text-muted-foreground">
							{reason.trim().length}/500 {t("characters")}
							{reason.trim().length > 0 && reason.trim().length < 8 && (
								<span className="ml-2 text-destructive">{t("minimum")}</span>
							)}
							{reason.trim().length > 500 && (
								<span className="ml-2 text-destructive">{t("maximum")}</span>
							)}
						</div>
					</div>
				</div>
				<DialogFooter className="flex flex-row">
					<Button className="flex-1" variant="outline" onClick={handleCancel}>
						{t("cancelBtn")}
					</Button>
					<Button className="flex-1" variant="destructive" onClick={handleSkip} disabled={!isReasonValid}>
						{isSkipAll ? t("skipAllBtn") : t("skipGroupBtn")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
