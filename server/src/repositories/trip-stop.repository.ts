import { Service } from "typedi";
import {
	DeleteResult,
	EntityManager,
	Repository,
	SelectQueryBuilder,
} from "typeorm";
import AppDataSource from "../config/database";
import TripStop from "../database/entities/TripStop";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class TripStopRepository {
	private readonly tripStopRepository: Repository<TripStop> =
		AppDataSource.getRepository(TripStop);

	private getRepository(manager?: EntityManager): Repository<TripStop> {
		return manager
			? manager.getRepository(TripStop)
			: this.tripStopRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<TripStop[]> {
		// Get the repository
		const repository: Repository<TripStop> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<TripStop> = repository
			.createQueryBuilder("tripStop")
			.leftJoinAndSelect("tripStop.trip", "trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("tripStop.location", "location");

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
				queryBuilder.orderBy("trip.updatedAt", "DESC");
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
	): Promise<TripStop | null> {
		// Get the repository
		const repository: Repository<TripStop> = this.getRepository(manager);

		// Create query builder
		const tripStop: TripStop | null = await repository
			.createQueryBuilder("tripStop")
			.leftJoinAndSelect("tripStop.trip", "trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("tripStop.location", "location")
			.where("tripStop.id = :id", { id })
			.getOne();

		return tripStop;
	}

	public async create(
		tripStop: TripStop,
		manager?: EntityManager,
	): Promise<TripStop> {
		// Get the repository
		const repository: Repository<TripStop> = this.getRepository(manager);

		// Check if the trip stop's ID already exists
		const existingTripStop = await repository
			.createQueryBuilder("tripStop")
			.where("tripStop.id = :id", { id: tripStop.id })
			.getOne();
		if (existingTripStop) {
			throw new ApiError(
				`Trip stop with ID '${tripStop.id}' already exists.`,
				409,
			);
		}

		// Save the new trip stop
		return await repository.save(tripStop);
	}

	public async update(
		tripStop: TripStop,
		manager?: EntityManager,
	): Promise<TripStop> {
		// Get the repository
		const repository: Repository<TripStop> = this.getRepository(manager);

		// Check if the trip stop exists
		const existingTripStop = await repository
			.createQueryBuilder("tripStop")
			.where("tripStop.id = :id", { id: tripStop.id })
			.getOne();
		if (!existingTripStop) {
			throw new ApiError(
				`Trip stop with ID '${tripStop.id}' not found.`,
				404,
			);
		}

		// Save the updated trip stop
		return await repository.save(tripStop);
	}

	public async delete(
		id: string,
		manager: EntityManager,
	): Promise<DeleteResult> {
		// Get the repository
		const repository: Repository<TripStop> = this.getRepository(manager);

		// Check if the trip stop exists
		const existingTripStop = await repository
			.createQueryBuilder("tripStop")
			.where("tripStop.id = :id", { id })
			.getOne();
		if (!existingTripStop) {
			throw new ApiError(`Trip stop with ID '${id}' not found.`, 404);
		}

		// Delete the trip stop
		return await repository.delete(id);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<TripStop>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for type if provided
		if (query.type) {
			const typeValue: string = query.type as string;
			if (typeValue.includes(",")) {
				const typeValues: string[] = typeValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere("tripStop.type IN (:...typeValues)", {
					typeValues,
				});
			} else {
				queryBuilder.andWhere("tripStop.type = :type", {
					type: typeValue,
				});
			}
		}

		// Apply filter for tripId if provided
		if (query.tripId) {
			queryBuilder.andWhere("trip.id = :tripId", {
				tripId: query.tripId,
			});
		}

		// Apply filter for locationId if provided
		if (query.locationId) {
			queryBuilder.andWhere("location.id = :locationId", {
				locationId: query.locationId,
			});
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<TripStop>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = ["id"];

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
			`LOWER(REGEXP_REPLACE(tripStop.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
			{
				searchPattern: `%${normalizedSearchValue}%`,
			},
		);
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<TripStop>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = ["id", "arrivalTime"];
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
					"CAST(SUBSTRING(tripStop.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`tripStop.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<TripStop>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default TripStopRepository;
