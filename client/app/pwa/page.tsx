"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import LocaleSwitcher from "@/components/locale-switcher";
import InstallPrompt from "@/app/pwa/install-prompt";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export default function PWAPage() {
	useInstallPrompt();
	const t = useTranslations("PWA");

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-blue-100">
			<div className="absolute top-4 right-4">
				<LocaleSwitcher />
			</div>
			<div className="max-w-2xl mx-auto space-y-6">
				<div className="flex flex-col items-center gap-2 mb-8 text-center">
					<Image
						src="/images/svb-logo-var2.svg"
						alt="De Heus Logo"
						width="0"
						height="0"
						sizes="100vw"
						className="w-80 h-full mb-2"
						priority={false}
					/>
					{/* <div className="mb-2 font-bold text-gray-900 text-headline-1">{t("title")}</div> */}
					<div className="text-gray-600">{t("description")}</div>
				</div>
				<InstallPrompt />
			</div>
		</div>
	);
}
