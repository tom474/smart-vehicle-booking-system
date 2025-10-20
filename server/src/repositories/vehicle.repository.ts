import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import Vehicle from "../database/entities/Vehicle";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";
import DriverAvailability from "../database/enums/DriverAvailability";

@Service()
class VehicleRepository {
	private readonly vehicleRepository: Repository<Vehicle> =
		AppDataSource.getRepository(Vehicle);

	private getRepository(manager?: EntityManager): Repository<Vehicle> {
		return manager
			? manager.getRepository(Vehicle)
			: this.vehicleRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Vehicle[]> {
		// Get the repository
		const repository: Repository<Vehicle> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Vehicle> = repository
			.createQueryBuilder("vehicle")
			.leftJoinAndSelect("vehicle.driver", "driver")
			.leftJoinAndSelect("vehicle.vendor", "vendor")
			.leftJoinAndSelect("vehicle.executive", "executive")
			.leftJoinAndSelect("vehicle.baseLocation", "base_location")
			.leftJoinAndSelect("vehicle.currentLocation", "current_location")
			.leftJoinAndSelect("vehicle.schedules", "schedules");

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
				queryBuilder
					.addSelect(
						"CAST(SUBSTRING(vehicle.id, 5) AS INTEGER)",
						"numeric_id",
					)
					.orderBy("numeric_id", "ASC");
			}
		}

		// Apply pagination if provided
		if (pagination) {
			await this.applyPagination(queryBuilder, pagination);
		}

		return await queryBuilder.getMany();
	}

	public async findVehiclesForTripOptimizer(
		manager?: EntityManager,
	): Promise<Vehicle[]> {
		// Get the repository
		const repository: Repository<Vehicle> = this.getRepository(manager);

		// Calculate tomorrow's start in JavaScript (more reliable)
		const tomorrow: Date = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Vehicle> = repository
			.createQueryBuilder("vehicle")
			.leftJoinAndSelect("vehicle.driver", "driver")
			.leftJoinAndSelect("vehicle.baseLocation", "base_location")
			.leftJoinAndSelect(
				"driver.schedules",
				"schedule",
				"schedule.endTime >= :tomorrow",
				{ tomorrow },
			)
			.where("vehicle.driver IS NOT NULL")
			.andWhere("driver.availability = :availability", {
				availability: DriverAvailability.AVAILABLE,
			})
			.orderBy("vehicle.id", "ASC")
			.addOrderBy("schedule.startTime", "ASC");

		return await queryBuilder.getMany();
	}

	public async findOne(
		id: string,
		manager?: EntityManager,
	): Promise<Vehicle | null> {
		// Get the repository
		const repository: Repository<Vehicle> = this.getRepository(manager);

		// Find vehice by ID
		const vehicle: Vehicle | null = await repository
			.createQueryBuilder("vehicle")
			.leftJoinAndSelect("vehicle.driver", "driver")
			.leftJoinAndSelect("vehicle.vendor", "vendor")
			.leftJoinAndSelect("vehicle.executive", "executive")
			.leftJoinAndSelect("vehicle.baseLocation", "base_location")
			.leftJoinAndSelect("vehicle.currentLocation", "current_location")
			.leftJoinAndSelect("vehicle.schedules", "schedules")
			.where("vehicle.id = :id", { id })
			.getOne();

		return vehicle;
	}

	public async create(
		vehicle: Vehicle,
		manager?: EntityManager,
	): Promise<Vehicle> {
		// Get the repository
		const repository: Repository<Vehicle> = this.getRepository(manager);

		// Check if the vehicle's ID already exists
		const existingVehicleWithId: Vehicle | null = await repository
			.createQueryBuilder("vehicle")
			.where("vehicle.id = :id", { id: vehicle.id })
			.getOne();
		if (existingVehicleWithId) {
			throw new ApiError(
				`Vehicle with ID '${vehicle.id}' already exists.`,
				409,
			);
		}

		// Check if the vehicle's license plate already exists
		const existingVehicleWithLicensePlate: Vehicle | null = await repository
			.createQueryBuilder("vehicle")
			.where("vehicle.licensePlate = :licensePlate", {
				licensePlate: vehicle.licensePlate,
			})
			.getOne();
		if (existingVehicleWithLicensePlate) {
			throw new ApiError(
				`Vehicle with license plate '${vehicle.licensePlate}' already exists.`,
				409,
			);
		}

		// Save the new vehicle
		return await repository.save(vehicle);
	}

	public async update(
		vehicle: Vehicle,
		manager?: EntityManager,
	): Promise<Vehicle> {
		// Get the repository
		const repository: Repository<Vehicle> = this.getRepository(manager);

		// Check if the vehicle exists
		const existingVehicle: Vehicle | null = await repository
			.createQueryBuilder("vehicle")
			.where("vehicle.id = :id", { id: vehicle.id })
			.getOne();
		if (!existingVehicle) {
			throw new ApiError(
				`Vehicle with ID '${vehicle.id}' not found.`,
				404,
			);
		}

		// Check if other vehicles with the same license plate exist
		const existingVehicleWithLicensePlate: Vehicle | null = await repository
			.createQueryBuilder("vehicle")
			.where("vehicle.id != :id", { id: vehicle.id })
			.andWhere("vehicle.licensePlate = :licensePlate", {
				licensePlate: vehicle.licensePlate,
			})
			.getOne();
		if (existingVehicleWithLicensePlate) {
			throw new ApiError(
				`Vehicle with license plate '${vehicle.licensePlate}' already exists.`,
				409,
			);
		}

		// Save the updated vehicle
		return await repository.save(vehicle);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<Vehicle>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for color if provided
		if (query.color) {
			const colorValue: string = query.color as string;
			if (colorValue.includes(",")) {
				const colorValues: string[] = colorValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere("vehicle.color IN (:...colorValues)", {
					colorValues,
				});
			} else {
				queryBuilder.andWhere("vehicle.color = :color", {
					color: colorValue,
				});
			}
		}

		// Apply filter for minCapacity if provided
		if (query.minCapacity) {
			queryBuilder.andWhere("vehicle.capacity >= :minCapacity", {
				minCapacity: query.minCapacity,
			});
		}

		// Apply filter for maxCapacity if provided
		if (query.maxCapacity) {
			queryBuilder.andWhere("vehicle.capacity <= :maxCapacity", {
				maxCapacity: query.maxCapacity,
			});
		}

		// Apply filter for availability if provided
		if (query.availability) {
			const availabilityValue: string = query.availability as string;
			if (availabilityValue.includes(",")) {
				const availabilityValues: string[] = availabilityValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"vehicle.availability IN (:...availabilityValues)",
					{
						availabilityValues,
					},
				);
			} else {
				queryBuilder.andWhere("vehicle.availability = :availability", {
					availability: availabilityValue,
				});
			}
		}

		// Apply filter for ownership type if provided
		if (query.ownershipType) {
			const ownershipTypeValue: string = query.ownershipType as string;
			if (ownershipTypeValue.includes(",")) {
				const ownershipTypeValues: string[] = ownershipTypeValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"vehicle.ownershipType IN (:...ownershipTypeValues)",
					{
						ownershipTypeValues,
					},
				);
			} else {
				queryBuilder.andWhere(
					"vehicle.ownershipType = :ownershipType",
					{
						ownershipType: ownershipTypeValue,
					},
				);
			}
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Vehicle>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"licensePlate",
			"model",
			"driverName",
			"vendorName",
			"executiveName",
			"baseLocationName",
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
		} else if (searchField === "vendorName") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(vendor.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else if (searchField === "executiveName") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(executive.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else if (searchField === "baseLocationName") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(base_location.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(vehicle.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Vehicle>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"licensePlate",
			"model",
			"color",
			"capacity",
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
					"CAST(SUBSTRING(vehicle.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`vehicle.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Vehicle>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default VehicleRepository;
