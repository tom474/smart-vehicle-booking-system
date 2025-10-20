import { Service } from "typedi";
import {
	DeleteResult,
	EntityManager,
	Repository,
	SelectQueryBuilder,
} from "typeorm";
import AppDataSource from "../config/database";
import LeaveRequest from "../database/entities/LeaveRequest";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class LeaveRequestRepository {
	private readonly leaveRequestRepository: Repository<LeaveRequest> =
		AppDataSource.getRepository(LeaveRequest);

	private getRepository(manager?: EntityManager): Repository<LeaveRequest> {
		return manager
			? manager.getRepository(LeaveRequest)
			: this.leaveRequestRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<LeaveRequest[]> {
		// Get the repository
		const repository: Repository<LeaveRequest> =
			this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<LeaveRequest> = repository
			.createQueryBuilder("leaveRequest")
			.leftJoinAndSelect("leaveRequest.driver", "driver")
			.leftJoinAndSelect("leaveRequest.schedule", "schedule");

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
				queryBuilder.orderBy("leaveRequest.updatedAt", "DESC");
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
	): Promise<LeaveRequest | null> {
		// Get the repository
		const repository: Repository<LeaveRequest> =
			this.getRepository(manager);

		// Find the leave request by ID
		const leaveRequest: LeaveRequest | null = await repository
			.createQueryBuilder("leaveRequest")
			.leftJoinAndSelect("leaveRequest.driver", "driver")
			.leftJoinAndSelect("leaveRequest.schedule", "schedule")
			.where("leaveRequest.id = :id", { id })
			.getOne();

		return leaveRequest;
	}

	public async create(
		leaveRequest: LeaveRequest,
		manager?: EntityManager,
	): Promise<LeaveRequest> {
		// Get the repository
		const repository: Repository<LeaveRequest> =
			this.getRepository(manager);

		// Check if the leave request's ID already exists
		const existingLeaveRequestWithId: LeaveRequest | null = await repository
			.createQueryBuilder("leaveRequest")
			.where("leaveRequest.id = :id", { id: leaveRequest.id })
			.getOne();
		if (existingLeaveRequestWithId) {
			throw new ApiError(
				`Leave request with ID ${leaveRequest.id} already exists.`,
				409,
			);
		}

		// Save the new leave request
		return await repository.save(leaveRequest);
	}

	public async update(
		leaveRequest: LeaveRequest,
		manager?: EntityManager,
	): Promise<LeaveRequest> {
		// Get the repository
		const repository: Repository<LeaveRequest> =
			this.getRepository(manager);

		// Check if the leave request exists
		const existingLeaveRequest: LeaveRequest | null = await repository
			.createQueryBuilder("leaveRequest")
			.where("leaveRequest.id = :id", { id: leaveRequest.id })
			.getOne();
		if (!existingLeaveRequest) {
			throw new ApiError(
				`Leave request with ID ${leaveRequest.id} not found.`,
				404,
			);
		}

		// Save the updated leave request
		return await repository.save(leaveRequest);
	}

	public async delete(
		id: string,
		manager?: EntityManager,
	): Promise<DeleteResult> {
		// Get the repository
		const repository: Repository<LeaveRequest> =
			this.getRepository(manager);

		// Check if the leave request exists
		const existingLeaveRequest: LeaveRequest | null = await repository
			.createQueryBuilder("leaveRequest")
			.where("leaveRequest.id = :id", { id })
			.getOne();
		if (!existingLeaveRequest) {
			throw new ApiError(`Leave request with ID ${id} not found.`, 404);
		}

		// Delete the leave request
		return await repository.delete(id);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<LeaveRequest>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for status if provided
		if (query.status) {
			const statusValue: string = query.status as string;
			if (statusValue.includes(",")) {
				const statusValues: string[] = statusValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"leaveRequest.status IN (:...statusValues)",
					{
						statusValues,
					},
				);
			} else {
				queryBuilder.andWhere("leaveRequest.status = :status", {
					status: statusValue,
				});
			}
		}

		// Apply filter for startTimeFrom if provided
		if (query.startTimeFrom) {
			const startTimeFrom: Date = new Date(query.startTimeFrom as string);
			queryBuilder.andWhere("leaveRequest.startTime >= :startTimeFrom", {
				startTimeFrom,
			});
		}

		// Apply filter for startTimeTo if provided
		if (query.startTimeTo) {
			const startTimeTo: Date = new Date(query.startTimeTo as string);
			queryBuilder.andWhere("leaveRequest.startTime <= :startTimeTo", {
				startTimeTo,
			});
		}

		// Apply filter for endTimeFrom if provided
		if (query.endTimeFrom) {
			const endTimeFrom: Date = new Date(query.endTimeFrom as string);
			queryBuilder.andWhere("leaveRequest.endTime >= :endTimeFrom", {
				endTimeFrom,
			});
		}

		// Apply filter for endTimeTo if provided
		if (query.endTimeTo) {
			const endTimeTo: Date = new Date(query.endTimeTo as string);
			queryBuilder.andWhere("leaveRequest.endTime <= :endTimeTo", {
				endTimeTo,
			});
		}

		// Apply filter for driverId if provided
		if (query.driverId) {
			queryBuilder.andWhere("driver.id = :driverId", {
				driverId: query.driverId,
			});
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<LeaveRequest>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"reason",
			"notes",
			"driverName",
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
		if (searchField === "driverName") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(driver.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(leaveRequest.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<LeaveRequest>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"reason",
			"notes",
			"startTime",
			"endTime",
			"createdAt",
			"updatedAt",
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
					"CAST(SUBSTRING(leaveRequest.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`leaveRequest.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<LeaveRequest>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default LeaveRequestRepository;
