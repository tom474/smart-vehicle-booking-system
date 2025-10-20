"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export default function InstallPrompt() {
	const t = useTranslations("PWA.installPrompt");
	const [isIOS, setIsIOS] = useState(false);
	const { installApp, canInstall } = useInstallPrompt();

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
	}, []);

	const handleInstallClick = async () => {
		console.log("Install prompt clicked");
		const result = await installApp();

		if (!result.success) {
			console.log("Installation failed or was cancelled");
		}
	};

	return (
		<div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
			<div className="flex items-center mb-6">
				<div className="p-2 mr-3 rounded-lg bg-primary/20">
					<FileDown className="size-6 text-primary" />
				</div>
				<div className="font-semibold text-gray-900 text-headline-2">{t("installApp")}</div>
			</div>

			<div className="space-y-4">
				<Button
					variant="default"
					className="w-full p-6 text-lg font-medium transition-colors rounded-lg bg-primary text-background hover:bg-primary/80"
					onClick={handleInstallClick}
					disabled={!canInstall}
				>
					{t("addToHomeScreen")}
				</Button>

				{isIOS && (
					<div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
						<p className="text-subtitle-2">{t("ios.description1")}</p>
						<p className="mt-1 text-sm leading-relaxed text-blue-800">
							{t("ios.description2")}
							<span className="inline-flex items-center px-2 py-1 mx-1 font-mono text-xs bg-blue-100 rounded">
								⎋
							</span>
							{t("ios.description3")}
							<span className="inline-flex items-center px-2 py-1 mx-1 font-mono text-xs bg-blue-100 rounded">
								➕
							</span>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
