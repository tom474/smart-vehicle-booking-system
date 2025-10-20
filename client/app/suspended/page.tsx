"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { logoutUser } from "@/lib/utils";
import Image from "next/image";
import { getSupportContact, SupportContactSettingSchema } from "@/apis/settings";
import { z } from "zod/v4";

export default function SuspendedPage() {
	const t = useTranslations("Suspended");
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

	// Prevent back navigation to authenticated routes
	useEffect(() => {
		// Clear any existing session data except the suspended status
		const currentUrl = window.location.href;
		window.history.replaceState(null, "", currentUrl);

		// Disable back button functionality
		const handlePopState = () => {
			window.history.pushState(null, "", currentUrl);
		};

		window.addEventListener("popstate", handlePopState);
		window.history.pushState(null, "", currentUrl);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, []);

	const handleContactCoordinator = () => {
		window.location.href = `tel:${supportContact?.phone}`;
	};

	const handleLogout = () => {
		logoutUser();
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-red-50 to-red-100">
			<div className="w-full max-w-md p-8 bg-white border border-red-200 rounded-lg shadow-lg">
				{/* Logo */}
				<div className="flex justify-center mb-6">
					<Image
						src="/images/deheus-logo.svg"
						alt="De Heus Logo"
						width="0"
						height="0"
						sizes="100vw"
						className="size-20"
					/>
				</div>

				{/* Title and Message */}
				<div className="mb-6 text-center">
					<h1 className="mb-2 text-2xl font-bold text-red-600">{t("title")}</h1>
					<p className="mb-4 text-gray-600">{t("description")}</p>
					<div className="p-3 border border-red-200 rounded-lg bg-red-50">
						<p className="text-sm text-red-700">
							<strong>{t("coordinator")}:</strong> {supportContact?.name}
						</p>
						<p className="text-sm text-red-700">
							<strong>{t("phoneNumber")}:</strong> {supportContact?.phone}
						</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="space-y-3">
					<Button
						onClick={handleContactCoordinator}
						className="w-full text-white bg-red-600 hover:bg-red-700"
						size="lg"
					>
						<Phone className="w-4 h-4 mr-2" />
						{t("contactCoordinator")}
					</Button>

					<Button
						onClick={handleLogout}
						variant="outline"
						className="w-full border-gray-300 hover:bg-gray-100 hover:text-gray-700"
						size="lg"
					>
						<LogOut className="w-4 h-4 mr-2" />
						{t("logout")}
					</Button>
				</div>

				{/* Additional Info */}
				<div className="p-3 mt-6 bg-gray-100 rounded-lg">
					<p className="text-xs text-center text-gray-500">
						{t("ifYouBelieveError")}
						<br />
						{t("accessRestored")}
					</p>
				</div>
			</div>
		</div>
	);
}
