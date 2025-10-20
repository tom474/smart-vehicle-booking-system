import { EntityManager } from "typeorm";
import Notification from "../../database/entities/Notification";
import NotificationResponseDto from "../../dtos/notification/notification-response.dto";
import Pagination from "../../templates/pagination";
import UnreadNotificationCountDto from "../../dtos/notification/unread-notification.dto";

export interface INotificationService {
	/**
	 * Creates and saves a new notification using the provided transaction manager.
	 * @param data - The Notification entity to be saved.
	 * @param manager - The EntityManager used for transactional operations.
	 */
	create(data: Notification, manager: EntityManager): Promise<void>;

	/**
	 * Marks the specified notification as read.
	 * @param id - The ID of the notification to be marked as read.
	 */
	markAsRead(id: string): Promise<void>;

	markNotificationsAsRead(ids: string[]): Promise<NotificationResponseDto[]>;

	/**
	 * Retrieves a paginated list of notifications for a specific user.
	 * @param targetId - The ID of the target user.
	 * @param pagination - Pagination options including page and limit.
	 * @param query - Optional filters (e.g., createdAt).
	 */
	getByUser(
		targetId: string,
		targetRole: string,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<NotificationResponseDto[]>;

	/**
	 * Returns the number of unread notifications for the specified user.
	 * @param targetId - The ID of the target user.
	 */
	getUnreadNotification(
		targetId: string,
		targetRole: string,
	): Promise<UnreadNotificationCountDto>;
}
