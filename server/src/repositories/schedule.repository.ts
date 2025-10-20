import { Service } from "typedi";
import {
	DeleteResult,
	EntityManager,
	Repository,
	SelectQueryBuilder,
} from "typeorm";
import AppDataSource from "../config/database";
import Schedule from "../database/entities/Schedule";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class ScheduleRepository {
	private readonly scheduleRepository: Repository<Schedule> =
		AppDataSource.getRepository(Schedule);

	private getRepository(manager?: EntityManager): Repository<Schedule> {
		return manager
			? manager.getRepository(Schedule)
			: this.scheduleRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Schedule[]> {
		// Get the repository
		const repository: Repository<Schedule> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Schedule> = repository
			.createQueryBuilder("schedule")
			.leftJoinAndSelect("schedule.driver", "driver")
			.leftJoinAndSelect("schedule.vehicle", "vehicle")
			.leftJoinAndSelect("schedule.trip", "trip")
			.leftJoinAndSelect("schedule.leaveRequest", "leave_request")
			.leftJoinAndSelect("schedule.vehicleService", "vehicle_service");

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
				queryBuilder.orderBy("schedule.updatedAt", "DESC");
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
	): Promise<Schedule | null> {
		// Get the repository
		const repository: Repository<Schedule> = this.getRepository(manager);

		// Find the schedule by ID
		const schedule: Schedule | null = await repository
			.createQueryBuilder("schedule")
			.leftJoinAndSelect("schedule.driver", "driver")
			.leftJoinAndSelect("schedule.vehicle", "vehicle")
			.leftJoinAndSelect("schedule.trip", "trip")
			.leftJoinAndSelect("schedule.leaveRequest", "leave_request")
			.leftJoinAndSelect("schedule.vehicleService", "vehicle_service")
			.where("schedule.id = :id", { id })
			.getOne();

		return schedule;
	}

	public async create(
		schedule: Schedule,
		manager?: EntityManager,
	): Promise<Schedule> {
		// Get the repository
		const repository: Repository<Schedule> = this.getRepository(manager);

		// Check if the schedule's ID already exists
		const existingScheduleWithId: Schedule | null = await repository
			.createQueryBuilder("schedule")
			.where("schedule.id = :id", { id: schedule.id })
			.getOne();
		if (existingScheduleWithId) {
			throw new ApiError(
				`Schedule with ID ${schedule.id} already exists.`,
				409,
			);
		}

		// Save the new schedule
		return await repository.save(schedule);
	}

	public async update(
		schedule: Schedule,
		manager?: EntityManager,
	): Promise<Schedule> {
		// Get the repository
		const repository: Repository<Schedule> = this.getRepository(manager);

		// Check if the schedule exists
		const existingSchedule: Schedule | null = await repository
			.createQueryBuilder("schedule")
			.where("schedule.id = :id", { id: schedule.id })
			.getOne();
		if (!existingSchedule) {
			throw new ApiError(
				`Schedule with ID ${schedule.id} not found.`,
				404,
			);
		}

		// Save the updated schedule
		return await repository.save(schedule);
	}

	public async delete(
		id: string,
		manager?: EntityManager,
	): Promise<DeleteResult> {
		// Get the repository
		const repository: Repository<Schedule> = this.getRepository(manager);

		// Check if the schedule exists
		const existingSchedule: Schedule | null = await repository
			.createQueryBuilder("schedule")
			.where("schedule.id = :id", { id })
			.getOne();
		if (!existingSchedule) {
			throw new ApiError(`Schedule with ID ${id} not found.`, 404);
		}

		// Delete the schedule by id
		return await repository.delete(id);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<Schedule>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for startTimeFrom if provided
		if (query.startTimeFrom) {
			const startTimeFrom: Date = new Date(query.startTimeFrom as string);
			queryBuilder.andWhere("schedule.startTime >= :startTimeFrom", {
				startTimeFrom,
			});
		}

		// Apply filter for startTimeTo if provided
		if (query.startTimeTo) {
			const startTimeTo: Date = new Date(query.startTimeTo as string);
			queryBuilder.andWhere("schedule.startTime <= :startTimeTo", {
				startTimeTo,
			});
		}

		// Apply filter for endTimeFrom if provided
		if (query.endTimeFrom) {
			const endTimeFrom: Date = new Date(query.endTimeFrom as string);
			queryBuilder.andWhere("schedule.endTime >= :endTimeFrom", {
				endTimeFrom,
			});
		}

		// Apply filter for endTimeTo if provided
		if (query.endTimeTo) {
			const endTimeTo: Date = new Date(query.endTimeTo as string);
			queryBuilder.andWhere("schedule.endTime <= :endTimeTo", {
				endTimeTo,
			});
		}

		// Apply filter for driverId if provided
		if (query.driverId) {
			queryBuilder.andWhere("driver.id = :driverId", {
				driverId: query.driverId,
			});
		}

		// Apply filter for vehicleId if provided
		if (query.vehicleId) {
			queryBuilder.andWhere("vehicle.id = :vehicleId", {
				vehicleId: query.vehicleId,
			});
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Schedule>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"title",
			"description",
			"driverName",
			"vehicleLicensePlate",
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
		} else if (searchField === "vehicleLicensePlate") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(vehicle.licensePlate, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(schedule.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Schedule>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"title",
			"description",
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
					"CAST(SUBSTRING(schedule.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`schedule.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Schedule>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default ScheduleRepository;
