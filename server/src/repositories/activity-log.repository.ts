import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import ActivityLog from "../database/entities/ActivityLog";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class ActivityLogRepository {
	private readonly activityLogRepository: Repository<ActivityLog> =
		AppDataSource.getRepository(ActivityLog);

	private getRepository(manager?: EntityManager): Repository<ActivityLog> {
		return manager
			? manager.getRepository(ActivityLog)
			: this.activityLogRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<ActivityLog[]> {
		// Get the repository
		const repository: Repository<ActivityLog> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<ActivityLog> =
			repository.createQueryBuilder("activity_log");

		if (query) {
			// Apply filters if provided
			await this.applyFilters(queryBuilder, query);

			// Apply search if provided
			if (query.searchField && query.searchValue) {
				await this.applySearch(queryBuilder, query);
			}

			// Apply order by if provided
			if (query.orderField && query.orderDirection) {
				await this.applyOrderBy(queryBuilder, query);
			} else {
				queryBuilder.orderBy("activity_log.timestamp", "DESC");
			}
		}

		// Apply pagination if provided
		if (pagination) {
			await this.applyPagination(queryBuilder, pagination);
		}

		return await queryBuilder.getMany();
	}

	public async findOne(
		id: string,
		manager?: EntityManager,
	): Promise<ActivityLog | null> {
		// Get the repository
		const repository: Repository<ActivityLog> = this.getRepository(manager);

		// Find activity log by ID
		const activityLog: ActivityLog | null = await repository
			.createQueryBuilder("activity_log")
			.where("activity_log.id = :id", { id })
			.getOne();

		return activityLog;
	}

	public async create(
		activityLog: ActivityLog,
		manager?: EntityManager,
	): Promise<ActivityLog> {
		// Get the repository
		const repository: Repository<ActivityLog> = this.getRepository(manager);

		// Check if the activity log's ID already exists
		const existingActivityLogWithId: ActivityLog | null = await repository
			.createQueryBuilder("activity_log")
			.where("activity_log.id = :id", { id: activityLog.id })
			.getOne();
		if (existingActivityLogWithId) {
			throw new ApiError(
				`Activity log with ID '${activityLog.id}' already exists.`,
				409,
			);
		}

		// Save the new activity log
		return await repository.save(activityLog);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<ActivityLog>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for actionType
		if (query.actionType) {
			const actionTypeValue: string = query.actionType as string;
			if (actionTypeValue.includes(",")) {
				const actionTypeValues: string[] = actionTypeValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"activity_log.actionType IN (:...actionTypeValues)",
					{
						actionTypeValues: actionTypeValues,
					},
				);
			} else {
				queryBuilder.andWhere("activity_log.actionType = :actionType", {
					actionType: actionTypeValue,
				});
			}
		}

		// Apply filter for timestamp range
		if (query.from) {
			const from: Date = new Date(query.from as string);
			queryBuilder.andWhere("activity_log.timestamp >= :from", {
				from: from,
			});
		}
		if (query.to) {
			const to: Date = new Date(query.to as string);
			queryBuilder.andWhere("activity_log.timestamp <= :to", {
				to: to,
			});
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<ActivityLog>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"actorRole",
			"actorId",
			"entityName",
			"entityId",
			"actionType",
			"actionDetails",
		];

		// Validate search field
		const searchField: string = query.searchField as string;
		if (!allowedSearchFields.includes(searchField)) {
			throw new ApiError(
				`Search field must be one of the following: ${allowedSearchFields.join(", ")}.`,
				400,
			);
		}

		// Normalize search value
		const searchValue: string = query.searchValue as string;
		const normalizedSearchValue: string = searchValue
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "");

		// Apply search to the query builder
		queryBuilder.andWhere(
			`LOWER(REGEXP_REPLACE(activity_log.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
			{
				searchPattern: `%${normalizedSearchValue}%`,
			},
		);
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<ActivityLog>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"actorRole",
			"actorId",
			"entityName",
			"entityId",
			"actionType",
			"actionDetails",
			"timestamp",
		];
		const allowedOrderDirections: string[] = ["ASC", "DESC"];

		// Validate order field
		const orderField: string = query.orderField as string;
		if (!allowedOrderFields.includes(orderField)) {
			throw new ApiError(
				`Order field must be one of the following: ${allowedOrderFields.join(", ")}.`,
				400,
			);
		}

		// Validate order direction
		const orderDirection: string = query.orderDirection as string;
		if (!allowedOrderDirections.includes(orderDirection)) {
			throw new ApiError(
				`Order direction must be one of the following: ${allowedOrderDirections.join(", ")}.`,
				400,
			);
		}

		// Apply order by to the query builder
		if (orderField === "id") {
			queryBuilder
				.addSelect(
					"CAST(SUBSTRING(activity_log.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`activity_log.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<ActivityLog>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default ActivityLogRepository;
