import { Service } from "typedi";
import {
	DeleteResult,
	EntityManager,
	Repository,
	SelectQueryBuilder,
} from "typeorm";
import AppDataSource from "../config/database";
import VehicleService from "../database/entities/VehicleService";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class VehicleServiceRepository {
	private readonly vehicleServiceRepository: Repository<VehicleService> =
		AppDataSource.getRepository(VehicleService);

	private getRepository(manager?: EntityManager): Repository<VehicleService> {
		return manager
			? manager.getRepository(VehicleService)
			: this.vehicleServiceRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<VehicleService[]> {
		// Get the repository
		const repository: Repository<VehicleService> =
			this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<VehicleService> = repository
			.createQueryBuilder("vehicleService")
			.leftJoinAndSelect("vehicleService.driver", "driver")
			.leftJoinAndSelect("vehicleService.vehicle", "vehicle")
			.leftJoinAndSelect("vehicleService.schedule", "schedule")
			.leftJoinAndSelect("vehicleService.expenses", "expenses");

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
				queryBuilder.orderBy("vehicleService.updatedAt", "DESC");
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
	): Promise<VehicleService | null> {
		// Get the repository
		const repository: Repository<VehicleService> =
			this.getRepository(manager);

		// Find the vehicle service by ID
		const vehicleService: VehicleService | null = await repository
			.createQueryBuilder("vehicleService")
			.leftJoinAndSelect("vehicleService.driver", "driver")
			.leftJoinAndSelect("vehicleService.vehicle", "vehicle")
			.leftJoinAndSelect("vehicleService.schedule", "schedule")
			.leftJoinAndSelect("vehicleService.expenses", "expenses")
			.where("vehicleService.id = :id", { id })
			.getOne();

		return vehicleService;
	}

	public async create(
		vehicleService: VehicleService,
		manager?: EntityManager,
	): Promise<VehicleService> {
		// Get the repository
		const repository: Repository<VehicleService> =
			this.getRepository(manager);

		// Check if the vehicle service's ID already exists
		const existingVehicleServiceWithId: VehicleService | null =
			await repository
				.createQueryBuilder("vehicleService")
				.where("vehicleService.id = :id", { id: vehicleService.id })
				.getOne();
		if (existingVehicleServiceWithId) {
			throw new ApiError(
				`Vehicle service with ID ${vehicleService.id} already exists.`,
				409,
			);
		}

		// Save the new vehicle service
		return await repository.save(vehicleService);
	}

	public async update(
		vehicleService: VehicleService,
		manager?: EntityManager,
	): Promise<VehicleService> {
		// Get the repository
		const repository: Repository<VehicleService> =
			this.getRepository(manager);

		// Check if the vehicle service exists
		const existingVehicleService: VehicleService | null = await repository
			.createQueryBuilder("vehicleService")
			.where("vehicleService.id = :id", { id: vehicleService.id })
			.getOne();
		if (!existingVehicleService) {
			throw new ApiError(
				`Vehicle service with ID ${vehicleService.id} not found.`,
				404,
			);
		}

		// Save the updated vehicle service
		return await repository.save(vehicleService);
	}

	public async delete(
		id: string,
		manager?: EntityManager,
	): Promise<DeleteResult> {
		// Get the repository
		const repository: Repository<VehicleService> =
			this.getRepository(manager);

		// Check if the vehicle service exists
		const existingVehicleService: VehicleService | null = await repository
			.createQueryBuilder("vehicleService")
			.where("vehicleService.id = :id", { id })
			.getOne();
		if (!existingVehicleService) {
			throw new ApiError(`Vehicle service with ID ${id} not found.`, 404);
		}

		// Delete the vehicle service
		return await repository.delete(id);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<VehicleService>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for service type if provided
		if (query.serviceType) {
			const serviceTypeValue: string = query.serviceType as string;
			if (serviceTypeValue.includes(",")) {
				const serviceTypeValues: string[] = serviceTypeValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"vehicleService.serviceType IN (:...serviceTypeValues)",
					{
						serviceTypeValues,
					},
				);
			} else {
				queryBuilder.andWhere(
					"vehicleService.serviceType = :serviceType",
					{
						serviceType: serviceTypeValue,
					},
				);
			}
		}

		// Apply filter for status if provided
		if (query.status) {
			const statusValue: string = query.status as string;
			if (statusValue.includes(",")) {
				const statusValues: string[] = statusValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"vehicleService.status IN (:...statusValues)",
					{
						statusValues,
					},
				);
			} else {
				queryBuilder.andWhere("vehicleService.status = :status", {
					status: statusValue,
				});
			}
		}

		// Apply filter for startTimeFrom if provided
		if (query.startTimeFrom) {
			const startTimeFrom: Date = new Date(query.startTimeFrom as string);
			queryBuilder.andWhere(
				"vehicleService.startTime >= :startTimeFrom",
				{
					startTimeFrom,
				},
			);
		}

		// Apply filter for startTimeTo if provided
		if (query.startTimeTo) {
			const startTimeTo: Date = new Date(query.startTimeTo as string);
			queryBuilder.andWhere("vehicleService.startTime <= :startTimeTo", {
				startTimeTo,
			});
		}

		// Apply filter for endTimeFrom if provided
		if (query.endTimeFrom) {
			const endTimeFrom: Date = new Date(query.endTimeFrom as string);
			queryBuilder.andWhere("vehicleService.endTime >= :endTimeFrom", {
				endTimeFrom,
			});
		}

		// Apply filter for endTimeTo if provided
		if (query.endTimeTo) {
			const endTimeTo: Date = new Date(query.endTimeTo as string);
			queryBuilder.andWhere("vehicleService.endTime <= :endTimeTo", {
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
		queryBuilder: SelectQueryBuilder<VehicleService>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"reason",
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
				`LOWER(REGEXP_REPLACE(vehicleService.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<VehicleService>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"reason",
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
					"CAST(SUBSTRING(vehicleService.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`vehicleService.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<VehicleService>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default VehicleServiceRepository;
