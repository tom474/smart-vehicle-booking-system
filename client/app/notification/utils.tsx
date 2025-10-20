import { Clock } from "lucide-react";
import { NOTIFICATION_CONFIG } from "@/components/notification-config";
import { NotificationResponseData } from "@/apis/notification";

// Helper function to get notification config based on role and key
const getNotificationConfig = (userRole: string, notificationKey: string) => {
	const roleConfig = NOTIFICATION_CONFIG[userRole as keyof typeof NOTIFICATION_CONFIG];
	if (!roleConfig) {
		return {
			type: "general",
			icon: Clock,
			bgColor: "bg-gray-100",
			textColor: "text-gray-600",
			highlightWords: [],
			component: null,
		};
	}

	const config = roleConfig[notificationKey as keyof typeof roleConfig];
	if (!config) {
		return {
			type: "general",
			icon: Clock,
			bgColor: "bg-gray-100",
			textColor: "text-gray-600",
			highlightWords: [],
			component: null,
		};
	}

	return config;
};

const getNotificationTitle = (
	notification: NotificationResponseData,
	userRole: string,
	translations: (key: string, params?: Record<string, unknown>) => string,
): string => {
	const roleBasedKey = `${userRole}.${notification.message.key}.title`;
	return translations(roleBasedKey, notification.message.params);
};

// Helper function to format notification description with variables
const formatNotificationDescription = (
	translationKey: string,
	params: Record<string, unknown>,
	userRole: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	translations: any,
): string => {
	try {
		const roleBasedKey = `${userRole}.${translationKey}.message`;

		// Format the params first (especially dates)
		const formattedParams: Record<string, unknown> = {};
		Object.entries(params).forEach(([key, value]) => {
			let formattedValue = String(value);

			// Format dates if the value looks like a date
			if (key.toLowerCase().includes("date") || key.toLowerCase().includes("time")) {
				try {
					const date = new Date(formattedValue);
					if (!isNaN(date.getTime())) {
						// Format date based on the key type
						if (key.toLowerCase().includes("time")) {
							formattedValue = date.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							});
						} else {
							formattedValue = date.toLocaleDateString();
						}
					}
				} catch (e) {
					console.error("Error parsing date:", e);
				}
			}

			formattedParams[key] = formattedValue;
		});

		// Use the translation function with parameters
		return translations(roleBasedKey, formattedParams);
	} catch (error) {
		console.error("Error formatting notification description:", error, "Key:", translationKey, "Params:", params);

		// Fallback without role prefix
		try {
			const formattedParams: Record<string, unknown> = {};
			Object.entries(params).forEach(([key, value]) => {
				formattedParams[key] = String(value);
			});
			return translations(translationKey, formattedParams);
		} catch (fallbackError) {
			// Final fallback
			console.error("Error in fallback translation:", fallbackError);
			return `${translationKey} - ${JSON.stringify(params)}`;
		}
	}
};

// Helper function to highlight words in description as well
const highlightTextContent = (text: string, highlightWords: string[], colorClass: string): React.ReactNode => {
	if (!highlightWords || highlightWords.length === 0) return text;

	// Create a regex pattern that matches any of the highlight words
	const pattern = highlightWords.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
	const regex = new RegExp(`(${pattern})`, "gi");

	const parts = text.split(regex);

	return parts.map((part, index) => {
		// Check if this part matches any of the highlight words (case insensitive)
		const isHighlighted = highlightWords.some((word) => part.toLowerCase() === word.toLowerCase());

		return isHighlighted ? (
			<span key={index} className={colorClass}>
				{part}
			</span>
		) : (
			part
		);
	});
};

// Helper function to calculate time ago
const getTimeAgo = (date: Date, t: (key: string) => string): string => {
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInHours = diffInMs / (1000 * 60 * 60);
	const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

	if (diffInHours < 1) {
		return t("justNow");
	} else if (diffInHours < 24) {
		return `${Math.floor(diffInHours)} ${t("hour")}${Math.floor(diffInHours) > 1 ? t("s") : ""} ${t("ago")}`;
	} else if (diffInDays < 7) {
		return `${Math.floor(diffInDays)} ${t("day")}${Math.floor(diffInDays) > 1 ? t("s") : ""} ${t("ago")}`;
	} else {
		return date.toLocaleDateString();
	}
};

// Helper function to determine category
const getCategoryFromDate = (date: Date): "unread" | "today" | "older" => {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

	const diffInMs = today.getTime() - notificationDate.getTime();
	const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

	if (diffInDays === 0) {
		return "today";
	} else {
		return "older";
	}
};

const highlightTitle = (title: string, words: string[], colorClass: string) => {
	if (!words || words.length === 0) return title;

	// Create a regex pattern that matches any of the highlight words
	const pattern = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
	const regex = new RegExp(`(${pattern})`, "gi");

	const parts = title.split(regex);

	return parts.map((part, index) => {
		// Check if this part matches any of the highlight words (case insensitive)
		const isHighlighted = words.some((word) => part.toLowerCase() === word.toLowerCase());

		return isHighlighted ? (
			<span key={index} className={colorClass}>
				{part}
			</span>
		) : (
			part
		);
	});
};

export {
	getNotificationConfig,
	getNotificationTitle,
	formatNotificationDescription,
	highlightTextContent,
	getTimeAgo,
	getCategoryFromDate,
	highlightTitle,
};
