import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import Driver from "../database/entities/Driver";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class DriverRepository {
	private readonly driverRepository: Repository<Driver> =
		AppDataSource.getRepository(Driver);

	private getRepository(manager?: EntityManager): Repository<Driver> {
		return manager ? manager.getRepository(Driver) : this.driverRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Driver[]> {
		// Get the repository
		const repository: Repository<Driver> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Driver> = repository
			.createQueryBuilder("driver")
			.leftJoinAndSelect("driver.role", "role")
			.leftJoinAndSelect("driver.vehicle", "vehicle")
			.leftJoinAndSelect("vehicle.executive", "executive")
			.leftJoinAndSelect("driver.vendor", "vendor")
			.leftJoinAndSelect("driver.baseLocation", "base_location")
			.leftJoinAndSelect("driver.currentLocation", "current_location")
			.leftJoinAndSelect("driver.schedules", "schedules");

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
						"CAST(SUBSTRING(driver.id, 5) AS INTEGER)",
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

	public async findOne(
		id: string,
		manager?: EntityManager,
	): Promise<Driver | null> {
		// Get the repository
		const repository: Repository<Driver> = this.getRepository(manager);

		// Find driver by ID
		const driver: Driver | null = await repository
			.createQueryBuilder("driver")
			.leftJoinAndSelect("driver.role", "role")
			.leftJoinAndSelect("driver.vehicle", "vehicle")
			.leftJoinAndSelect("vehicle.executive", "executive")
			.leftJoinAndSelect("driver.vendor", "vendor")
			.leftJoinAndSelect("driver.baseLocation", "base_location")
			.leftJoinAndSelect("driver.currentLocation", "current_location")
			.leftJoinAndSelect("driver.schedules", "schedules")
			.where("driver.id = :id", { id })
			.getOne();

		return driver;
	}

	public async findOneById(
		id: string,
		manager?: EntityManager,
	): Promise<Driver | null> {
		// Get the repository
		const repository: Repository<Driver> = this.getRepository(manager);

		// Find driver by ID
		const driver: Driver | null = await repository
			.createQueryBuilder("driver")
			.leftJoinAndSelect("driver.role", "role")
			.where("driver.id = :id", { id })
			.getOne();

		return driver;
	}

	public async findOneByUsername(
		username: string,
		manager?: EntityManager,
	): Promise<Driver | null> {
		// Get the repository
		const repository: Repository<Driver> = this.getRepository(manager);

		// Find driver by username
		const driver: Driver | null = await repository
			.createQueryBuilder("driver")
			.where("driver.username = :username", { username })
			.leftJoinAndSelect("driver.role", "role")
			.leftJoinAndSelect("driver.vehicle", "vehicle")
			.leftJoinAndSelect("vehicle.executive", "executive")
			.leftJoinAndSelect("driver.vendor", "vendor")
			.leftJoinAndSelect("driver.baseLocation", "base_location")
			.leftJoinAndSelect("driver.currentLocation", "current_location")
			.getOne();

		return driver;
	}

	public async create(
		driver: Driver,
		manager?: EntityManager,
	): Promise<Driver> {
		// Get the repository
		const repository: Repository<Driver> = this.getRepository(manager);

		// Check if the driver's ID already exists
		const existingDriverWithId: Driver | null = await repository
			.createQueryBuilder("driver")
			.where("driver.id = :id", { id: driver.id })
			.getOne();
		if (existingDriverWithId) {
			throw new ApiError(
				`Driver with ID '${driver.id}' already exists.`,
				409,
			);
		}

		// Check if the driver's phone number already exists
		const existingDriverWithPhoneNumber: Driver | null = await repository
			.createQueryBuilder("driver")
			.where("driver.phoneNumber = :phoneNumber", {
				phoneNumber: driver.phoneNumber,
			})
			.getOne();
		if (existingDriverWithPhoneNumber) {
			throw new ApiError(
				`Driver with phone number '${driver.phoneNumber}' already exists.`,
				409,
			);
		}

		// Check if the driver's email already exists
		if (driver.email) {
			const existingDriverWithEmail: Driver | null = await repository
				.createQueryBuilder("driver")
				.where("driver.email = :email", { email: driver.email })
				.getOne();
			if (existingDriverWithEmail) {
				throw new ApiError(
					`Driver with email '${driver.email}' already exists.`,
					409,
				);
			}
		}

		// Check if the driver's username already exists
		const existingDriverWithUsername: Driver | null = await repository
			.createQueryBuilder("driver")
			.where("driver.username = :username", {
				username: driver.username,
			})
			.getOne();
		if (existingDriverWithUsername) {
			throw new ApiError(
				`Driver with username '${driver.username}' already exists.`,
				409,
			);
		}

		// Save the new driver
		return await repository.save(driver);
	}

	public async update(
		driver: Driver,
		manager?: EntityManager,
	): Promise<Driver> {
		// Get the repository
		const repository: Repository<Driver> = this.getRepository(manager);

		// Check if the driver exists
		const existingDriver: Driver | null = await repository
			.createQueryBuilder("driver")
			.where("driver.id = :id", { id: driver.id })
			.getOne();
		if (!existingDriver) {
			throw new ApiError(`Driver with ID '${driver.id}' not found.`, 404);
		}

		// Check if other drivers with the same phone number exist
		const existingDriverWithPhoneNumber: Driver | null = await repository
			.createQueryBuilder("driver")
			.where("driver.id != :id", { id: driver.id })
			.andWhere("driver.phoneNumber = :phoneNumber", {
				phoneNumber: driver.phoneNumber,
			})
			.getOne();
		if (existingDriverWithPhoneNumber) {
			throw new ApiError(
				`Driver with phone number '${driver.phoneNumber}' already exists.`,
				409,
			);
		}

		// Check if other drivers with the same email exist
		if (driver.email) {
			const existingDriverWithEmail: Driver | null = await repository
				.createQueryBuilder("driver")
				.where("driver.id != :id", { id: driver.id })
				.andWhere("driver.email = :email", { email: driver.email })
				.getOne();
			if (existingDriverWithEmail) {
				throw new ApiError(
					`Driver with email '${driver.email}' already exists.`,
					409,
				);
			}
		}

		// Check if other drivers with the same username exist
		const existingDriverWithUsername: Driver | null = await repository
			.createQueryBuilder("driver")
			.where("driver.id != :id", { id: driver.id })
			.andWhere("driver.username = :username", {
				username: driver.username,
			})
			.getOne();
		if (existingDriverWithUsername) {
			throw new ApiError(
				`Driver with username '${driver.username}' already exists.`,
				409,
			);
		}

		// Save the updated driver
		return await repository.save(driver);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<Driver>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for status if provided
		if (query.status) {
			const statusValue: string = query.status as string;
			if (statusValue.includes(",")) {
				// Handle comma-separated values
				const statusValues: string[] = statusValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere("driver.status IN (:...statusValues)", {
					statusValues: statusValues,
				});
			} else {
				// Handle single value
				queryBuilder.andWhere("driver.status = :status", {
					status: statusValue,
				});
			}
		}

		// Apply filter for availability if provided
		if (query.availability) {
			const availabilityValue: string = query.availability as string;
			if (availabilityValue.includes(",")) {
				// Handle comma-separated values
				const availabilityArray = availabilityValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"driver.availability IN (:...availabilities)",
					{
						availabilities: availabilityArray,
					},
				);
			} else {
				// Handle single value
				queryBuilder.andWhere("driver.availability = :availability", {
					availability: availabilityValue,
				});
			}
		}

		// Apply filter for ownership type if provided
		if (query.ownershipType) {
			const ownershipTypeValue: string = query.ownershipType as string;
			if (ownershipTypeValue.includes(",")) {
				// Handle comma-separated values
				const ownershipTypeArray = ownershipTypeValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"driver.ownershipType IN (:...ownershipTypes)",
					{
						ownershipTypes: ownershipTypeArray,
					},
				);
			} else {
				// Handle single value
				queryBuilder.andWhere("driver.ownershipType = :ownershipType", {
					ownershipType: ownershipTypeValue,
				});
			}
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Driver>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"name",
			"email",
			"phoneNumber",
			"username",
			"vehicleLicensePlate",
			"vendorName",
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
		if (searchField === "vehicleLicensePlate") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(vehicle.licensePlate, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
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
		} else if (searchField === "baseLocationName") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(base_location.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(driver.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Driver>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"name",
			"email",
			"phoneNumber",
			"username",
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
					"CAST(SUBSTRING(driver.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`driver.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Driver>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default DriverRepository;
