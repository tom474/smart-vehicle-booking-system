"use client";

import { useEffect, useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import PWAPage from "@/app/pwa/page";
import { useTranslations } from "next-intl";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function PWAButton({ ghost = true }: { ghost?: boolean }) {
	useInstallPrompt();
	const t = useTranslations("PWA.PWAButton");
	const isMobile = useIsMobile();
	const [isStandalone, setIsStandalone] = useState(false);

	useEffect(() => {
		setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
	}, []);

	if (isStandalone) {
		return;
	}

	return (
		<Sheet>
			<SheetTrigger asChild>
				{ghost ? (
					<Button variant="ghost">{t("install")}</Button>
				) : (
					<Button
						variant="default"
						className={`flex-1 h-full text-lg rounded-md hover:bg-secondary ${isMobile && "w-full"}`}
					>
						{t("installApp")}
					</Button>
				)}
			</SheetTrigger>
			<SheetContent
				className={`[&>button]:hidden ${
					isMobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl"
				}`}
			>
				<SheetHeader className="hidden">
					<SheetTitle>PWA</SheetTitle>
					<SheetDescription>Install PWA</SheetDescription>
				</SheetHeader>
				<div className="absolute top-4 left-4">
					<SheetClose asChild>
						<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
							<ChevronLeft className="size-6" />
						</Button>
					</SheetClose>
				</div>
				<PWAPage />
			</SheetContent>
		</Sheet>
	);
}
