import { Service } from "typedi";
import { plainToInstance } from "class-transformer";
import Notification from "../database/entities/Notification";
import NotificationResponseDto from "../dtos/notification/notification-response.dto";
import { INotificationService } from "./interfaces/INotificationService";
import NotificationRepository from "../repositories/notification.repository";
import DriverRepository from "../repositories/driver.repository";
import UserRepository from "../repositories/user.repository";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";
import IdCounterService from "./id-counter.service";
import NotificationBody from "../dtos/notification/notification-body.dto";
import { EntityManager } from "typeorm";
import User from "../database/entities/User";
import Driver from "../database/entities/Driver";
import UnreadNotificationCountDto from "../dtos/notification/unread-notification.dto";
import AppDataSource from "../config/database";
import SettingService from "./setting.service";
import Setting from "../database/entities/Setting";
import SettingMap from "../constants/setting-map";

@Service()
class NotificationService implements INotificationService {
	constructor(
		private readonly idCountService: IdCounterService,
		private readonly notificationRepository: NotificationRepository,
		private readonly driverRepository: DriverRepository,
		private readonly userRepository: UserRepository,
		private readonly settingService: SettingService,
	) {}

	public async create(
		data: Notification,
		manager: EntityManager,
	): Promise<void> {
		const notificationEnabledSetting: Setting =
			await this.settingService.getSettingByKey(
				SettingMap.NOTIFICATION_ENABLED,
			);
		if (notificationEnabledSetting.value === "false") {
			return;
		}
		// Validate target existence (driver or user)
		await this.validateTargetExists(data.targetRole, data.targetId);

		// Save notification using transactional manager
		const saved = await this.notificationRepository.create(data, manager);

		if (!saved) {
			throw new ApiError("Failed to create notification.", 500);
		}
	}

	public async sendCoordinatorAndAdminNotification(
		data: NotificationBody,
		manager: EntityManager,
	): Promise<void> {
		const notificationEnabledSetting: Setting =
			await this.settingService.getSettingByKey(
				SettingMap.NOTIFICATION_ENABLED,
			);
		if (notificationEnabledSetting.value === "false") {
			return;
		}
		// Get both coordinators and admins
		const coordinators =
			await this.userRepository.findByRole("coordinator");
		const admins = await this.userRepository.findByRole("admin");

		// Combine both arrays
		const allTargetUsers = [...coordinators, ...admins];

		// Generate IDs for all users
		const ids = await this.idCountService.generateIds(
			"notification",
			allTargetUsers.length,
			manager,
		);

		await Promise.all(
			allTargetUsers.map(async (user, index) => {
				const notification = new Notification(
					ids[index],
					user.id,
					user.role.key,
					data.title,
					data.message,
					data.relatedId,
					data.priority,
				);

				await this.create(notification, manager);
			}),
		);
	}

	public async sendUserNotification(
		data: NotificationBody,
		targetUserId: string,
		targetRole: string,
		manager: EntityManager,
	): Promise<void> {
		const notificationEnabledSetting: Setting =
			await this.settingService.getSettingByKey(
				SettingMap.NOTIFICATION_ENABLED,
			);
		if (notificationEnabledSetting.value === "false") {
			return;
		}

		let user: User | Driver | null;

		if (targetRole !== "driver") {
			user = await this.userRepository.findOne(targetUserId);
		} else {
			user = await this.driverRepository.findOne(targetUserId);
		}

		if (!user) {
			throw new ApiError(
				`User with id '${targetUserId}' does not exist.`,
				404,
			);
		}

		const id = await this.idCountService.generateId(
			"notification",
			manager,
		);

		const notification = new Notification(
			id,
			user.id,
			user.role.key,
			data.title,
			data.message,
			data.relatedId,
			data.priority,
		);

		await this.create(notification, manager);
	}

	public async markAsRead(id: string): Promise<void> {
		await this.notificationRepository.markAsRead(id);
	}

	async markNotificationsAsRead(
		ids: string[],
	): Promise<NotificationResponseDto[]> {
		if (!ids?.length) return [];

		// Deduplicate while preserving input order
		const seen = new Set<string>();
		const uniqueIds = ids.filter((id) => {
			if (seen.has(id)) return false;
			seen.add(id);
			return true;
		});

		const updated = await AppDataSource.transaction(async (manager) => {
			// Mark each as read inside the same transaction (sequential for safety)
			for (const id of uniqueIds) {
				await this.notificationRepository.markAsRead(id, manager);
			}

			// Fetch updated notifications in the same order
			const rows: (Notification | null)[] = [];
			for (const id of uniqueIds) {
				rows.push(
					await this.notificationRepository.findById(id, manager),
				);
			}

			// Filter out any nulls (shouldn't happen because markAsRead would have thrown)
			return rows.filter((n): n is Notification => !!n);
		});

		return plainToInstance(NotificationResponseDto, updated, {
			excludeExtraneousValues: true,
		});
	}

	async getUnreadNotification(
		targetId: string,
		targetRole: string,
	): Promise<UnreadNotificationCountDto> {
		const unreadCount =
			await this.notificationRepository.countUnreadByTargetId(
				targetId,
				targetRole,
			);

		const dto = plainToInstance(
			UnreadNotificationCountDto,
			{
				targetId: targetId,
				unreadCount: unreadCount,
			},
			{
				excludeExtraneousValues: true,
			},
		);

		return dto;
	}

	public async getByUser(
		targetId: string,
		targetRole: string,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<NotificationResponseDto[]> {
		const notifications = await this.notificationRepository.find(
			pagination,
			targetId,
			targetRole,
			query,
		);

		return plainToInstance(NotificationResponseDto, notifications, {
			excludeExtraneousValues: true,
		});
	}

	private async validateTargetExists(
		role: string,
		id: string,
	): Promise<void> {
		if (role.toLowerCase() === "driver") {
			const driver = await this.driverRepository.findOneById(id);
			if (!driver) {
				throw new ApiError(
					`Driver with id '${id}' does not exist.`,
					404,
				);
			}
		} else {
			const user = await this.userRepository.findOne(id);
			if (!user) {
				throw new ApiError(`User with id '${id}' does not exist.`, 404);
			}
		}
	}
}

export default NotificationService;
