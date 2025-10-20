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
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getSupportContact, SupportContactSettingSchema } from "@/apis/settings";
import { z } from "zod/v4";

export default function Emergency() {
	const t = useTranslations("RequesterTripDay.emergencyDialog");
	const [supportContact, setSupportContact] = useState<z.infer<typeof SupportContactSettingSchema> | null>(null);

	useEffect(() => {
		const fetchSupportContact = async () => {
			try {
				const settings = await getSupportContact();
				setSupportContact(settings);
			} catch (error) {
				console.error(error);
			}
		};

		fetchSupportContact();
	}, []);

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
					<DialogTitle>{t("header")}</DialogTitle>
					<DialogDescription>
						{supportContact?.name} / {supportContact?.phone}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="destructive"
						className="w-full"
						onClick={() => {
							window.location.href = `tel:${supportContact?.phone}`;
						}}
					>
						{t("callNow")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
