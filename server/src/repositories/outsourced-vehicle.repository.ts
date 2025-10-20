import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import OutsourcedVehicle from "../database/entities/OutsourcedVehicle";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class OutsourcedVehicleRepository {
	private readonly outSourceVehicleRepository: Repository<OutsourcedVehicle> =
		AppDataSource.getRepository(OutsourcedVehicle);

	private getRepository(
		manager?: EntityManager,
	): Repository<OutsourcedVehicle> {
		return manager
			? manager.getRepository(OutsourcedVehicle)
			: this.outSourceVehicleRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<OutsourcedVehicle[]> {
		// Get the repository
		const repository: Repository<OutsourcedVehicle> =
			this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<OutsourcedVehicle> = repository
			.createQueryBuilder("outsourcedVehicle")
			.leftJoinAndSelect("outsourcedVehicle.vendor", "vendor");

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
						"CAST(SUBSTRING(outsourcedVehicle.id, 5) AS INTEGER)",
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
	): Promise<OutsourcedVehicle | null> {
		// Get the repository
		const repository: Repository<OutsourcedVehicle> =
			this.getRepository(manager);

		// Find outsourced vehicle by ID
		const outsourcedVehicle: OutsourcedVehicle | null = await repository
			.createQueryBuilder("outsourcedVehicle")
			.where("outsourcedVehicle.id = :id", { id })
			.leftJoinAndSelect("outsourcedVehicle.vendor", "vendor")
			.getOne();

		return outsourcedVehicle;
	}

	public async create(
		outsourcedVehicle: OutsourcedVehicle,
		manager?: EntityManager,
	): Promise<OutsourcedVehicle> {
		// Get the repository
		const repository: Repository<OutsourcedVehicle> =
			this.getRepository(manager);

		// Check if the outsourced vehicle's ID already exists
		const existingVehicleWithId: OutsourcedVehicle | null = await repository
			.createQueryBuilder("outsourcedVehicle")
			.where("outsourcedVehicle.id = :id", { id: outsourcedVehicle.id })
			.getOne();
		if (existingVehicleWithId) {
			throw new ApiError(
				`Outsourced vehicle with ID '${outsourcedVehicle.id}' already exists.`,
				409,
			);
		}

		// Save the new outsourced vehicle
		return await repository.save(outsourcedVehicle);
	}

	public async update(
		outsourcedVehicle: OutsourcedVehicle,
		manager?: EntityManager,
	): Promise<OutsourcedVehicle> {
		// Get the repository
		const repository: Repository<OutsourcedVehicle> =
			this.getRepository(manager);

		// Check if the outsourced vehicle exists
		const existingVehicle: OutsourcedVehicle | null = await repository
			.createQueryBuilder("outsourcedVehicle")
			.where("outsourcedVehicle.id = :id", { id: outsourcedVehicle.id })
			.getOne();
		if (!existingVehicle) {
			throw new ApiError(
				`Outsourced vehicle with ID '${outsourcedVehicle.id}' not found.`,
				404,
			);
		}

		// Save the updated outsourced vehicle
		return await repository.save(outsourcedVehicle);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<OutsourcedVehicle>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for color if provided
		if (query.color) {
			const colorValue: string = query.color as string;
			if (colorValue.includes(",")) {
				const colorValues: string[] = colorValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"outsourcedVehicle.color IN (:...colorValues)",
					{
						colorValues,
					},
				);
			} else {
				queryBuilder.andWhere("outsourcedVehicle.color = :color", {
					color: colorValue,
				});
			}
		}

		// Apply filter for minCapacity if provided
		if (query.minCapacity) {
			queryBuilder.andWhere(
				"outsourcedVehicle.capacity >= :minCapacity",
				{
					minCapacity: query.minCapacity,
				},
			);
		}

		// Apply filter for maxCapacity if provided
		if (query.maxCapacity) {
			queryBuilder.andWhere(
				"outsourcedVehicle.capacity <= :maxCapacity",
				{
					maxCapacity: query.maxCapacity,
				},
			);
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<OutsourcedVehicle>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"driverName",
			"phoneNumber",
			"licensePlate",
			"model",
			"vendorName",
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
		if (searchField === "vendorName") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(vendor.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(outsourcedVehicle.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<OutsourcedVehicle>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"driverName",
			"phoneNumber",
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
					"CAST(SUBSTRING(outsourcedVehicle.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`outsourcedVehicle.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<OutsourcedVehicle>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default OutsourcedVehicleRepository;
