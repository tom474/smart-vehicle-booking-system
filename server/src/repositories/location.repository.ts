import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import Location from "../database/entities/Location";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class LocationRepository {
	private readonly locationRepository: Repository<Location> =
		AppDataSource.getRepository(Location);

	private getRepository(manager?: EntityManager): Repository<Location> {
		return manager
			? manager.getRepository(Location)
			: this.locationRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Location[]> {
		// Get the repository
		const repository: Repository<Location> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Location> =
			repository.createQueryBuilder("location");

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
						"CAST(SUBSTRING(location.id, 5) AS INTEGER)",
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
	): Promise<Location | null> {
		// Get the repository
		const repository: Repository<Location> = this.getRepository(manager);

		// Find location by ID
		const location: Location | null = await repository
			.createQueryBuilder("location")
			.where("location.id = :id", { id })
			.getOne();

		return location;
	}

	public async findOneByCoordinates(
		latitude: number,
		longitude: number,
		manager?: EntityManager,
	): Promise<Location | null> {
		// Get the repository
		const repository: Repository<Location> = this.getRepository(manager);

		// Find location by latitude and longitude
		const location: Location | null = await repository
			.createQueryBuilder("location")
			.where("location.latitude = :latitude", { latitude })
			.andWhere("location.longitude = :longitude", { longitude })
			.getOne();

		return location;
	}

	public async create(
		location: Location,
		manager?: EntityManager,
	): Promise<Location> {
		// Get the repository
		const repository: Repository<Location> = this.getRepository(manager);

		// Check if the location's ID already exists
		const existingLocationWithId: Location | null = await repository
			.createQueryBuilder("location")
			.where("location.id = :id", { id: location.id })
			.getOne();
		if (existingLocationWithId) {
			throw new ApiError(
				`Location with ID '${location.id}' already exists.`,
				409,
			);
		}

		// Save the new location
		return await repository.save(location);
	}

	public async update(
		location: Location,
		manager?: EntityManager,
	): Promise<Location> {
		// Get the repository
		const repository: Repository<Location> = this.getRepository(manager);

		// Check if the location exists
		const existingLocation: Location | null = await repository
			.createQueryBuilder("location")
			.where("location.id = :id", { id: location.id })
			.getOne();
		if (!existingLocation) {
			throw new ApiError(
				`Location with ID '${location.id}' not found.`,
				404,
			);
		}

		// Save the updated location
		return await repository.save(location);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<Location>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for type if provided
		if (query.type) {
			const typeValue: string = query.type as string;
			if (typeValue.includes(",")) {
				// Handle comma-separated values
				const typeValues: string[] = typeValue
					.split(",")
					.map((s) => s.trim());
				queryBuilder.andWhere("location.type IN (:...typeValues)", {
					typeValues: typeValues,
				});
			} else {
				queryBuilder.andWhere("location.type = :type", {
					type: typeValue,
				});
			}
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Location>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"name",
			"address",
			"latitude",
			"longitude",
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
			`LOWER(REGEXP_REPLACE(location.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
			{
				searchPattern: `%${normalizedSearchValue}%`,
			},
		);
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Location>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = ["id", "name", "address"];
		const allowedOrderDirections: string[] = ["ASC", "DESC"];

		// Validate order field
		const orderField: string = query.orderField as string;
		if (!allowedOrderFields.includes(orderField)) {
			throw new ApiError(
				`Order field must be one of the following: ${allowedOrderFields.join(", ")}`,
				400,
			);
		}

		// Validate order direction
		const orderDirection: string = query.orderDirection as string;
		if (!allowedOrderDirections.includes(orderDirection)) {
			throw new ApiError(
				`Order direction must be one of the following: ${allowedOrderDirections.join(", ")}`,
				400,
			);
		}

		// Apply order by to the query builder
		if (orderField === "id") {
			queryBuilder
				.addSelect(
					"CAST(SUBSTRING(location.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`location.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Location>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default LocationRepository;
