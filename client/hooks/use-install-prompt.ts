/* eslint-disable */
import { useEffect, useState } from "react";

export function useInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

	useEffect(() => {
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e);
			// Store globally as backup
			(window as any).__deferredPrompt = e;
		};

		// Check if event was already captured globally
		if (typeof window !== "undefined" && (window as any).__deferredPrompt) {
			setDeferredPrompt((window as any).__deferredPrompt);
		}

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		};
	}, []);

	const installApp = async () => {
		const prompt = deferredPrompt || (window as any).__deferredPrompt;

		if (!prompt) {
			console.log("No deferred prompt available");
			return { success: false, outcome: null };
		}

		try {
			// Show the install prompt
			await prompt.prompt();

			// Wait for the user to respond to the prompt
			const { outcome } = await prompt.userChoice;

			// Clear the deferredPrompt so it can only be used once
			setDeferredPrompt(null);
			(window as any).__deferredPrompt = null;

			return { success: true, outcome };
		} catch (error) {
			console.error("Error showing install prompt:", error);
			return { success: false, outcome: null };
		}
	};

	return {
		deferredPrompt,
		installApp,
		canInstall: !!deferredPrompt,
	};
}
