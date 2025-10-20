import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import Vendor from "../database/entities/Vendor";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class VendorRepository {
	private readonly vendorRepository: Repository<Vendor> =
		AppDataSource.getRepository(Vendor);

	private getRepository(manager?: EntityManager): Repository<Vendor> {
		return manager ? manager.getRepository(Vendor) : this.vendorRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Vendor[]> {
		// Get the repository
		const repository: Repository<Vendor> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Vendor> = repository
			.createQueryBuilder("vendor")
			.leftJoinAndSelect("vendor.drivers", "drivers")
			.leftJoinAndSelect("vendor.vehicles", "vehicles")
			.leftJoinAndSelect(
				"vendor.outsourcedVehicles",
				"outsourced_vehicles",
			);

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
						"CAST(SUBSTRING(vendor.id, 5) AS INTEGER)",
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
	): Promise<Vendor | null> {
		// Get the repository
		const repository: Repository<Vendor> = this.getRepository(manager);

		// Find vendor by ID
		const vendor: Vendor | null = await repository
			.createQueryBuilder("vendor")
			.leftJoinAndSelect("vendor.drivers", "drivers")
			.leftJoinAndSelect("vendor.vehicles", "vehicles")
			.leftJoinAndSelect(
				"vendor.outsourcedVehicles",
				"outsourced_vehicles",
			)
			.where("vendor.id = :id", { id })
			.getOne();

		return vendor;
	}

	public async create(
		vendor: Vendor,
		manager?: EntityManager,
	): Promise<Vendor> {
		// Get the repository
		const repository: Repository<Vendor> = this.getRepository(manager);

		// Check if the vendor's ID already exists
		const existingVendorWithId: Vendor | null = await repository
			.createQueryBuilder("vendor")
			.where("vendor.id = :id", { id: vendor.id })
			.getOne();
		if (existingVendorWithId) {
			throw new ApiError(
				`Vendor with ID '${vendor.id}' already exists.`,
				409,
			);
		}

		// Check if the vendor's email already exists
		const existingVendorWithEmail: Vendor | null = await repository
			.createQueryBuilder("vendor")
			.where("vendor.email = :email", { email: vendor.email })
			.getOne();
		if (existingVendorWithEmail) {
			throw new ApiError(
				`Vendor with email '${vendor.email}' already exists.`,
				409,
			);
		}

		// Check if the vendor's phone number already exists
		const existingVendorWithPhoneNumber: Vendor | null = await repository
			.createQueryBuilder("vendor")
			.where("vendor.phoneNumber = :phoneNumber", {
				phoneNumber: vendor.phoneNumber,
			})
			.getOne();
		if (existingVendorWithPhoneNumber) {
			throw new ApiError(
				`Vendor with phone number '${vendor.phoneNumber}' already exists.`,
				409,
			);
		}

		// Save the new vendor
		return await repository.save(vendor);
	}

	public async update(
		vendor: Vendor,
		manager?: EntityManager,
	): Promise<Vendor> {
		// Get the repository
		const repository: Repository<Vendor> = this.getRepository(manager);

		// Check if the vendor exists
		const existingVendor: Vendor | null = await repository
			.createQueryBuilder("vendor")
			.where("vendor.id = :id", { id: vendor.id })
			.getOne();
		if (!existingVendor) {
			throw new ApiError(`Vendor with ID '${vendor.id}' not found.`, 404);
		}

		// Check if other vendors with the same email exist
		const existingVendorWithEmail: Vendor | null = await repository
			.createQueryBuilder("vendor")
			.where("vendor.id != :id", { id: vendor.id })
			.andWhere("vendor.email = :email", { email: vendor.email })
			.getOne();
		if (existingVendorWithEmail) {
			throw new ApiError(
				`Vendor with email '${vendor.email}' already exists.`,
				409,
			);
		}

		// Check if other vendors with the same phone number exist
		const existingVendorWithPhoneNumber: Vendor | null = await repository
			.createQueryBuilder("vendor")
			.where("vendor.id != :id", { id: vendor.id })
			.andWhere("vendor.phoneNumber = :phoneNumber", {
				phoneNumber: vendor.phoneNumber,
			})
			.getOne();
		if (existingVendorWithPhoneNumber) {
			throw new ApiError(
				`Vendor with phone number '${vendor.phoneNumber}' already exists.`,
				409,
			);
		}

		// Save the updated vendor
		return await repository.save(vendor);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<Vendor>,
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
				queryBuilder.andWhere("vendor.status IN (:...statusValues)", {
					statusValues: statusValues,
				});
			} else {
				// Handle single value
				queryBuilder.andWhere("vendor.status = :status", {
					status: statusValue,
				});
			}
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Vendor>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"name",
			"address",
			"contactPerson",
			"email",
			"phoneNumber",
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
				`LOWER(REGEXP_REPLACE(drivers.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else if (searchField === "vehicleLicensePlate") {
			queryBuilder.andWhere(
				`(LOWER(REGEXP_REPLACE(vehicles.licensePlate, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern 
				OR LOWER(REGEXP_REPLACE(outsourced_vehicles.licensePlate, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern)`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(vendor.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Vendor>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"name",
			"address",
			"contactPerson",
			"email",
			"phoneNumber",
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
					"CAST(SUBSTRING(vendor.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`vendor.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Vendor>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default VendorRepository;
