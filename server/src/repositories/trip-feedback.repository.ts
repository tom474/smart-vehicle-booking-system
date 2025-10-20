import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import { Service } from "typedi";
import AppDataSource from "../config/database";
import TripFeedback from "../database/entities/TripFeedback";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class TripFeedbackRepository {
	private readonly tripFeedbackRepository: Repository<TripFeedback> =
		AppDataSource.getRepository(TripFeedback);

	private getRepository(manager?: EntityManager): Repository<TripFeedback> {
		return manager
			? manager.getRepository(TripFeedback)
			: this.tripFeedbackRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<TripFeedback[]> {
		// Get the repository
		const repository: Repository<TripFeedback> =
			this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<TripFeedback> = repository
			.createQueryBuilder("tripFeedback")
			.leftJoinAndSelect("tripFeedback.user", "user")
			.leftJoinAndSelect("tripFeedback.trip", "trip")
			.leftJoinAndSelect("trip.driver", "driver");

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
				queryBuilder.orderBy("tripFeedback.updatedAt", "DESC");
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
	): Promise<TripFeedback | null> {
		// Get the repository
		const repository: Repository<TripFeedback> =
			this.getRepository(manager);

		// Find trip feedback by ID
		const tripFeedback: TripFeedback | null = await repository
			.createQueryBuilder("tripFeedback")
			.leftJoinAndSelect("tripFeedback.user", "user")
			.leftJoinAndSelect("tripFeedback.trip", "trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.where("tripFeedback.id = :id", { id })
			.getOne();

		return tripFeedback;
	}

	public async findByTripIdAndUserId(
		tripId: string,
		userId: string,
		manager?: EntityManager,
	): Promise<TripFeedback | null> {
		// Get the repository
		const repository: Repository<TripFeedback> =
			this.getRepository(manager);

		// Find trip feedback by trip ID and user ID
		const tripFeedback: TripFeedback | null = await repository
			.createQueryBuilder("tripFeedback")
			.leftJoinAndSelect("tripFeedback.user", "user")
			.leftJoinAndSelect("tripFeedback.trip", "trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.where("trip.id = :tripId", { tripId })
			.andWhere("user.id = :userId", { userId })
			.getOne();

		return tripFeedback;
	}

	public async create(
		feedback: TripFeedback,
		manager?: EntityManager,
	): Promise<TripFeedback> {
		// Get the repository
		const repository: Repository<TripFeedback> =
			this.getRepository(manager);

		// Check if the trip feedback's ID already exists
		const existingTripFeedback = await repository
			.createQueryBuilder("tripFeedback")
			.where("tripFeedback.id = :id", { id: feedback.id })
			.getOne();
		if (existingTripFeedback) {
			throw new ApiError(
				`Trip feedback with ID '${feedback.id}' already exists.`,
				409,
			);
		}

		// Prevent duplicate feedback per trip/user if necessary
		const existingTripFeedbackWithTripAndUser: TripFeedback | null =
			await repository
				.createQueryBuilder("tripFeedback")
				.where("tripFeedback.trip = :tripId", {
					tripId: feedback.trip.id,
				})
				.andWhere("tripFeedback.user = :userId", {
					userId: feedback.user.id,
				})
				.getOne();
		if (existingTripFeedbackWithTripAndUser) {
			throw new ApiError(
				`Trip feedback for trip with ID '${feedback.trip.id}' from user with ID '${feedback.user.id}' already exists.`,
				409,
			);
		}

		// Save the new trip feedback
		return await repository.save(feedback);
	}

	public async update(
		feedback: TripFeedback,
		manager?: EntityManager,
	): Promise<TripFeedback> {
		// Get the repository
		const repository: Repository<TripFeedback> =
			this.getRepository(manager);

		// Check if the trip feedback exists
		const existingTripFeedback = await repository
			.createQueryBuilder("tripFeedback")
			.where("tripFeedback.id = :id", { id: feedback.id })
			.getOne();
		if (!existingTripFeedback) {
			throw new ApiError(
				`Trip feedback with ID '${feedback.id}' not found.`,
				404,
			);
		}

		// Save the updated trip feedback
		return await repository.save(feedback);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<TripFeedback>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for rating if provided
		if (query.rating) {
			const ratingValue: string = query.rating as string;
			if (ratingValue.includes(",")) {
				const ratingValues: string[] = ratingValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"tripFeedback.rating IN (:...ratingValues)",
					{
						ratingValues,
					},
				);
			} else {
				queryBuilder.andWhere("tripFeedback.rating = :rating", {
					rating: ratingValue,
				});
			}
		}

		// Apply filter for userId if provided
		if (query.userId) {
			queryBuilder.andWhere("user.id = :userId", {
				userId: query.userId,
			});
		}

		// Apply filter for tripId if provided
		if (query.tripId) {
			queryBuilder.andWhere("trip.id = :tripId", {
				tripId: query.tripId,
			});
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<TripFeedback>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = ["id", "rating", "comment"];

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
		queryBuilder: SelectQueryBuilder<TripFeedback>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"rating",
			"comment",
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
					"CAST(SUBSTRING(tripFeedback.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`tripFeedback.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<TripFeedback>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default TripFeedbackRepository;
