import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import { Service } from "typedi";
import AppDataSource from "../config/database";
import Notification from "../database/entities/Notification";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class NotificationRepository {
	private readonly notificationRepository: Repository<Notification> =
		AppDataSource.getRepository(Notification);

	private getRepository(manager?: EntityManager): Repository<Notification> {
		return manager
			? manager.getRepository(Notification)
			: this.notificationRepository;
	}

	public async countUnreadByTargetId(
		targetId: string,
		targetRole: string,
		manager?: EntityManager,
	): Promise<number> {
		const repository = this.getRepository(manager);

		const count = await repository.count({
			where: {
				targetId,
				targetRole,
				isRead: false,
			},
		});

		return count;
	}

	public async find(
		pagination: Pagination,
		targetId: string,
		targetRole: string,
		query: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Notification[]> {
		const repository = this.getRepository(manager);

		const queryBuilder: SelectQueryBuilder<Notification> = repository
			.createQueryBuilder("notification")
			.where("notification.targetId = :targetId", { targetId })
			.andWhere("notification.targetRole = :targetRole", { targetRole });

		let baseDate = new Date();
		if (query.createdAt && typeof query.createdAt === "string") {
			const parsed = new Date(query.createdAt);
			if (!isNaN(parsed.getTime())) {
				baseDate = parsed;
			}
		}

		const toDate = new Date(baseDate);
		toDate.setHours(23, 59, 59, 999);

		const fromDate = new Date(baseDate);
		fromDate.setDate(fromDate.getDate() - 30);
		fromDate.setHours(0, 0, 0, 0);

		queryBuilder.andWhere(
			"notification.createdAt BETWEEN :fromDate AND :toDate",
			{
				fromDate,
				toDate,
			},
		);

		queryBuilder.orderBy("notification.createdAt", "DESC");

		await this.applyPagination(queryBuilder, pagination);

		return await queryBuilder.getMany();
	}
	public async findById(
		id: string,
		manager?: EntityManager,
	): Promise<Notification | null> {
		const repository = this.getRepository(manager);

		return await repository
			.createQueryBuilder("notification")
			.where("notification.id = :id", { id })
			.getOne();
	}

	public async create(
		notification: Notification,
		manager?: EntityManager,
	): Promise<boolean> {
		const repository = this.getRepository(manager);
		const data = await repository.save(notification);
		return data ? true : false;
	}

	public async markAsRead(
		id: string,
		manager?: EntityManager,
	): Promise<void> {
		const repository = this.getRepository(manager);
		const notification = await repository.findOneBy({ id });

		if (!notification) {
			throw new ApiError(`Notification with id '${id}' not found.`, 404);
		}

		if (!notification.isRead) {
			notification.isRead = true;
			await repository.save(notification);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Notification>,
		pagination: Pagination,
	): Promise<void> {
		const skip: number = (pagination.page - 1) * pagination.limit;
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default NotificationRepository;
