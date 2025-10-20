"use client";

import { useEffect, useState, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalconfig";
import Image from "next/image";
import { getRedirectPath, setTokenInCookie, setUserInCookie, mapRole } from "@/lib/utils";
import Spinner from "@/components/spinner";
import { useTranslations } from "next-intl";

export default function MicrosoftAuthentication() {
	const t = useTranslations("Msal.MicrosoftAuthentication");
	const { instance, accounts, inProgress } = useMsal();
	const [isReady, setIsReady] = useState(false);
	const hasProcessedAuth = useRef(false);

	// Wait for MSAL to be ready
	useEffect(() => {
		const checkInitialization = async () => {
			try {
				// Check if instance is initialized
				if (instance && typeof instance.handleRedirectPromise === "function") {
					setIsReady(true);
				}
			} catch (error) {
				console.error("MSAL not ready:", error);
			}
		};

		checkInitialization();
	}, [instance]);

	// Handle authentication (both redirect and existing login)
	useEffect(() => {
		if (!isReady || inProgress !== "none" || hasProcessedAuth.current) return;

		const handleAuthentication = async () => {
			try {
				// First check for redirect response
				const response = await instance.handleRedirectPromise();

				if (response && response.account) {
					// Handle redirect case
					hasProcessedAuth.current = true;
					const tokenResponse = await instance.acquireTokenSilent({
						...loginRequest,
						account: response.account,
					});
					await sendTokenToServer(tokenResponse.accessToken);
				} else if (accounts.length > 0) {
					// Handle existing login case
					hasProcessedAuth.current = true;
					const tokenResponse = await instance.acquireTokenSilent({
						...loginRequest,
						account: accounts[0],
					});
					await sendTokenToServer(tokenResponse.accessToken);
				}
			} catch (error) {
				console.error("Authentication failed:", error);
				hasProcessedAuth.current = false;
			}
		};

		handleAuthentication();
	}, [instance, isReady, inProgress, accounts]);

	const sendTokenToServer = async (accessToken: string) => {
		try {
			const response = await fetch("/api/auth/microsoft-token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					accessToken: accessToken,
				}),
			});

			if (response.ok) {
				const tokenData = await response.json();
				setTokenInCookie(tokenData.data.token.accessToken, tokenData.data.token.refreshToken);
				setUserInCookie(tokenData.data.user);

				// Redirect based on role
				const roleId = tokenData.data.user.roleId;
				const role = mapRole(roleId);
				const redirectPath = getRedirectPath(role);
				console.log("Redirecting to:", redirectPath);
				window.location.href = redirectPath;
			} else {
				console.error("Server authentication failed");
			}
		} catch (error) {
			console.error("Failed to send token to server:", error);
		}
	};

	if (!isReady) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-blue-100">
				<div className="flex flex-col items-center w-full max-w-md gap-4 p-8 bg-white shadow-lg rounded-xl">
					<h2 className="text-2xl font-bold text-blue-700">{t("title")}</h2>
					<p className="text-gray-600">{t("initilizing")}</p>
					<div className="flex items-center gap-2">
						<Spinner />
						<p className="text-blue-600">{t("pleaseWait")}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-blue-100">
			<div className="flex flex-col items-center w-full max-w-md gap-4 p-8 bg-white shadow-lg rounded-xl">
				<Image
					src="/images/deheus-logo.svg"
					alt="De Heus Logo"
					width="0"
					height="0"
					sizes="100vw"
					className="size-20"
					priority={false}
				/>
				<h2 className="text-2xl font-bold text-blue-700">{t("title")}</h2>
				{accounts.length > 0 && (
					<div className="flex flex-col items-center gap-1">
						<p className="font-medium text-gray-800">
							{t("loggedInAs")}: {accounts[0].name}
						</p>
						<p className="text-sm text-gray-500">
							{t("Email")}: {accounts[0].username}
						</p>
					</div>
				)}
				<div className="flex flex-row items-center justify-center gap-2 text-center">
					<Spinner />
					<p className="text-blue-600">{t("pleaseWaitDirecting")}</p>
				</div>
			</div>
		</div>
	);
}
