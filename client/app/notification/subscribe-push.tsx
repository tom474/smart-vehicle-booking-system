import { useState, useEffect } from "react";
import { TriangleAlert, CircleCheck, CircleX } from "lucide-react";
import { subscribeUser, unsubscribeUser } from "@/app/actions";
import { getUserFromToken } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export default function PushNotificationManager() {
	const t = useTranslations("Notification.pushNotification");
	const [isSupported, setIsSupported] = useState(false);
	const [subscription, setSubscription] = useState<PushSubscription | null>(null);
	const [isHidden, setIsHidden] = useState(false);
	const userId = getUserFromToken()?.id || "";

	useEffect(() => {
		if ("serviceWorker" in navigator && "PushManager" in window) {
			setIsSupported(true);
			registerServiceWorker();
		}

		// Check if user has chosen to hide the notification prompt
		const hideNotificationPrompt = localStorage.getItem("hideNotificationPrompt");
		if (hideNotificationPrompt === "true") {
			setIsHidden(true);
		}
	}, []);

	async function registerServiceWorker() {
		const registration = await navigator.serviceWorker.register("/sw.js", {
			scope: "/",
			updateViaCache: "none",
		});
		const sub = await registration.pushManager.getSubscription();
		setSubscription(sub);
	}

	async function subscribeToPush() {
		const registration = await navigator.serviceWorker.ready;
		const sub = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
		});
		setSubscription(sub);
		const serializedSub = JSON.parse(JSON.stringify(sub));
		await subscribeUser(userId, serializedSub);
	}

	async function unsubscribeFromPush() {
		await subscription?.unsubscribe();
		setSubscription(null);
		await unsubscribeUser(userId);
	}

	if (isHidden || subscription) {
		return subscription ? (
			<div className="p-2 space-y-2">
				<div className="flex items-center p-2 px-4 border border-green-200 rounded-md bg-green-50">
					<div className="mr-3 text-green-600">
						<CircleCheck size="15" />
					</div>
					<p className="font-medium text-green-800">{t("subscribed")}</p>
				</div>
				<Button
					variant="destructive"
					onClick={unsubscribeFromPush}
					className="w-full p-4 font-medium transition-colors rounded-lg text-md"
				>
					{t("unSubscribe")}
				</Button>
			</div>
		) : null;
	}

	if (!isSupported) {
		return (
			<div className="border border-red-200 rounded-lg bg-red-50">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 px-4">
						<div className="text-red-600">
							<CircleX size="15" />
						</div>
						<p className="font-medium text-red-800">{t("notSupported")}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-2 space-y-2">
			<div className="flex items-center p-2 px-4 mr-2 border border-yellow-200 rounded-lg bg-yellow-50">
				<div className="mr-3 text-yellow-600">
					<TriangleAlert size="15" />
				</div>
				<p className="font-medium text-yellow-800">{t("notSubscribed")}</p>
			</div>

			<Button
				variant="default"
				onClick={subscribeToPush}
				disabled={!userId.trim()}
				className="w-full p-4 font-medium transition-colors rounded-lg text-md"
			>
				{t("subscribe")}
			</Button>
		</div>
	);
}
