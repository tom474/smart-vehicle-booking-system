import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export const truncateAddress = (address: string | undefined, locationAddress: string): string => {
	const maxLength = 25;
	if (!address) return locationAddress;
	return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address;
};

export default function LocationButton({
	icon: Icon,
	label,
	address,
	onClick,
	disabled = false,
	coordinator = false,
}: {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	address?: string;
	onClick: () => void;
	disabled?: boolean;
	coordinator?: boolean;
}) {
	const t = useTranslations("RequesterBookings.bookingForm.form");
	return (
		<>
			<div className="flex justify-between p-1">
				<div className="flex flex-row items-center gap-2 text-subtitle-1">
					<Icon />
					{label}
				</div>
				<Button
					type="button"
					variant="ghost"
					className={`font-normal text-md text-muted-foreground hover:bg-background hover:underline hover:text-foreground ${
						disabled && !coordinator ? "opacity-60 cursor-not-allowed hover:no-underline" : ""
					}`}
					onClick={disabled && !coordinator ? undefined : onClick}
					disabled={disabled && !coordinator}
				>
					{truncateAddress(address, t("locationAddress"))}{" "}
					{(!disabled || coordinator) && <ChevronRight className="text-black" />}
				</Button>
			</div>
			{label !== t("destination") && <Separator />}
		</>
	);
}
