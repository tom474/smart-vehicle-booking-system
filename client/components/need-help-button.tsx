import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getSupportContact, SupportContactSettingSchema } from "@/apis/settings";
import { z } from "zod/v4";

export default function NeedHelpButton() {
	const t = useTranslations("NeedHelpButton");
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
			<DialogTrigger className="fixed z-20 mr-auto bottom-20 left-4" asChild>
				<Button className="rounded-full bg-success">{t("button")}</Button>
			</DialogTrigger>
			<DialogContent className="p-4">
				<DialogHeader>
					<DialogTitle>{t("title")}:</DialogTitle>
					<DialogDescription>
						{supportContact?.name} / {supportContact?.phone}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="default"
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
