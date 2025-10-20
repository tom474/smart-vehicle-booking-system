import { buildQueryParams } from "@/lib/build-query-param";
import { apiURL } from "@/lib/utils";
import { UrlCommonParams } from "@/types/api-params";
import { z } from "zod/v4";
import { customFetch } from "@/lib/utils";

export const NotificationMessageSchema = z.object({
	key: z.string(),
	params: z.record(z.string(), z.unknown()),
});

export const NotificationResponseSchema = z.object({
	id: z.string(),
	targetId: z.string(),
	targetRole: z.string(),
	title: z.string(),
	message: NotificationMessageSchema,
	priority: z.enum(["normal", "high", "urgent"]),
	isRead: z.boolean(),
	relatedId: z.string().optional().nullable(),
	createdAt: z.string().transform((s) => new Date(s)),
});

export type NotificationMessageData = z.infer<typeof NotificationMessageSchema>;
export type NotificationResponseData = z.infer<typeof NotificationResponseSchema>;

export async function getNotifications({
	userId,
	...params
}: UrlCommonParams & { userId: string }): Promise<NotificationResponseData[]> {
	const query = buildQueryParams(params);

	try {
		const response = await customFetch(`${apiURL}/notifications/${userId}?${query.toString()}`);

		if (!response.ok) {
			throw new Error(`Failed to fetch notifications: ${response}`);
		}

		const data = await response.json();
		return NotificationResponseSchema.array().parse(data.data);
	} catch (error) {
		console.error("Error fetching notifications:", error);
		throw error;
	}
}

export async function readNotification(notificationId: string): Promise<boolean> {
	const url = `${apiURL}/notifications/${notificationId}/read`;

	try {
		const response = await customFetch(url, {
			method: "PUT",
		});

		if (!response.ok) {
			throw new Error(`Failed to read notification: ${response}`);
		}

		return true;
	} catch (error) {
		console.error("Error reading notification:", error);
		throw error;
	}
}

export async function readAllNotification(notificationsId: string[]): Promise<boolean> {
	const url = `${apiURL}/notifications/read`;

	try {
		const response = await customFetch(url, {
			method: "PUT",
			body: { notificationsId: notificationsId },
		});

		if (!response.ok) {
			throw new Error(`Failed to read notification: ${response}`);
		}

		return true;
	} catch (error) {
		console.error("Error reading notification:", error);
		throw error;
	}
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
	const url = `${apiURL}/notifications/${userId}/unread`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch unread notification count: ${response}`);
		}

		const data = await response.json();
		return data.data.unreadCount;
	} catch (error) {
		console.error("Error fetching unread notification count:", error);
		throw error;
	}
}
