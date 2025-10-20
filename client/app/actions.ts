"use server";

import webpush from "web-push";
import { apiURL, customFetch } from "@/lib/utils";

webpush.setVapidDetails(
	"mailto:khoi8164@gmail.com",
	process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
	process.env.VAPID_PRIVATE_KEY!,
);

export async function subscribeUser(userId: string, sub: PushSubscription) {
	const url = `${apiURL}/notifications/${userId}/subscribe`;

	try {
		const response = await customFetch(url, {
			method: "POST",
			body: {
				userId,
				subscription: sub,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to subscribe user: ${response}`);
		}

		const jsonResponse = await response.json();
		console.log("Subscription response:", jsonResponse);
		return true;
	} catch (error) {
		console.error("Failed to sync subscription with external server:", error);
	}

	return { success: true };
}

export async function unsubscribeUser(userId: string) {
	const url = `${apiURL}/notifications/${userId}/unsubscribe`;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to unsubscribe user: ${response}`);
		}

		const jsonResponse = await response.json();
		console.log("Unsubscription response:", jsonResponse);
		return true;
	} catch (error) {
		console.error("Failed to sync unsubscribe with external server:", error);
	}

	return { success: true };
}
