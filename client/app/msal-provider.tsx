"use client";

import { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/lib/msalconfig";
import Spinner from "@/components/spinner";
import { useTranslations } from "next-intl";

interface MsalProviderWrapperProps {
	children: React.ReactNode;
}

export function MsalProviderWrapper({ children }: MsalProviderWrapperProps) {
	const t = useTranslations("Msal.MsalProvider");
	const [isInitialized, setIsInitialized] = useState(false);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		const initializeMsal = async () => {
			setIsClient(true);

			try {
				await msalInstance.initialize();
				setIsInitialized(true);
			} catch (error) {
				console.error("MSAL initialization failed:", error);
			}
		};

		initializeMsal();
	}, []);

	if (!isClient) {
		return null;
	}

	if (isClient && !isInitialized) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-blue-100">
				<div className="flex flex-col items-center w-full max-w-md gap-4 p-8 bg-white shadow-lg rounded-xl">
					<h2 className="text-2xl font-bold text-blue-700">{t("initilizing")}</h2>
					<p className="text-gray-600">{t("settingUp")}</p>
					<div className="flex items-center gap-2">
						<Spinner />
						<p className="text-blue-600">{t("pleaseWait")}</p>
					</div>
				</div>
			</div>
		);
	}

	return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
