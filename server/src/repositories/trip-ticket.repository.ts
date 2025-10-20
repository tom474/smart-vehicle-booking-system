import {
	DeleteResult,
	EntityManager,
	Repository,
	SelectQueryBuilder,
} from "typeorm";
import { Service } from "typedi";
import AppDataSource from "../config/database";
import TripTicket from "../database/entities/TripTicket";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class TripTicketRepository {
	private readonly tripTicketRepository: Repository<TripTicket> =
		AppDataSource.getRepository(TripTicket);

	private getRepository(manager?: EntityManager): Repository<TripTicket> {
		return manager
			? manager.getRepository(TripTicket)
			: this.tripTicketRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<TripTicket[]> {
		// Get the repository
		const repository: Repository<TripTicket> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<TripTicket> = repository
			.createQueryBuilder("tripTicket")
			.leftJoinAndSelect("tripTicket.user", "user")
			.leftJoinAndSelect("tripTicket.trip", "trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("trip.vehicle", "vehicle")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourced_vehicle")
			.leftJoinAndSelect("tripTicket.bookingRequest", "booking_request")
			.leftJoinAndSelect(
				"tripTicket.departureLocation",
				"departure_location",
			)
			.leftJoinAndSelect(
				"tripTicket.arrivalLocation",
				"arrival_location",
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
				queryBuilder.orderBy("trip.updatedAt", "DESC");
			}
		}

		// Apply pagination if provided
		if (pagination) {
			await this.applyPagination(queryBuilder, pagination);
		}

		return await queryBuilder.getMany();
	}

	public async findByBookingRequestId(
		id: string,
		manager?: EntityManager,
	): Promise<TripTicket[]> {
		// Get the repository
		const repository: Repository<TripTicket> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<TripTicket> = repository
			.createQueryBuilder("tripTicket")
			.leftJoinAndSelect("tripTicket.user", "user")
			.leftJoinAndSelect("tripTicket.trip", "trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("trip.vehicle", "vehicle")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourced_vehicle")
			.leftJoinAndSelect("tripTicket.bookingRequest", "booking_request")
			.leftJoinAndSelect(
				"tripTicket.departureLocation",
				"departure_location",
			)
			.leftJoinAndSelect("tripTicket.arrivalLocation", "arrival_location")
			.where("booking_request.id = :id", { id });

		return await queryBuilder.getMany();
	}

	public async findOne(
		id: string,
		manager?: EntityManager,
	): Promise<TripTicket | null> {
		// Get the repository
		const repository: Repository<TripTicket> = this.getRepository(manager);

		// Find trip ticket by ID
		const tripTicket: TripTicket | null = await repository
			.createQueryBuilder("ticket")
			.where("ticket.id = :id", { id })
			.leftJoinAndSelect("ticket.user", "user")
			.leftJoinAndSelect("ticket.trip", "trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("trip.vehicle", "vehicle")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourced_vehicle")
			.leftJoinAndSelect("ticket.bookingRequest", "booking_request")
			.leftJoinAndSelect("ticket.departureLocation", "departure_location")
			.leftJoinAndSelect("ticket.arrivalLocation", "arrival_location")
			.getOne();

		return tripTicket;
	}

	public async create(
		tripTicket: TripTicket,
		manager?: EntityManager,
	): Promise<TripTicket> {
		// Get the repository
		const repository: Repository<TripTicket> = this.getRepository(manager);

		// Check if the trip ticket's ID already exists
		const existingTripTicket: TripTicket | null = await repository
			.createQueryBuilder("tripTicket")
			.where("tripTicket.id = :id", { id: tripTicket.id })
			.getOne();
		if (existingTripTicket) {
			throw new ApiError(
				`Trip ticket with ID '${tripTicket.id}' already exists.`,
				409,
			);
		}

		// Save the new trip ticket
		return await repository.save(tripTicket);
	}

	public async update(
		tripTicket: TripTicket,
		manager?: EntityManager,
	): Promise<TripTicket> {
		// Get the repository
		const repository: Repository<TripTicket> = this.getRepository(manager);

		// Check if the trip ticket exists
		const existingTripTicket: TripTicket | null = await repository
			.createQueryBuilder("tripTicket")
			.where("tripTicket.id = :id", { id: tripTicket.id })
			.getOne();
		if (!existingTripTicket) {
			throw new ApiError(
				`Trip ticket with ID '${tripTicket.id}' not found.`,
				404,
			);
		}

		// Save the updated trip ticket
		return await repository.save(tripTicket);
	}

	public async delete(
		id: string,
		manager: EntityManager,
	): Promise<DeleteResult> {
		// Get the repository
		const repository: Repository<TripTicket> = this.getRepository(manager);

		// Check if the trip ticket exists
		const existingTripTicket: TripTicket | null = await repository
			.createQueryBuilder("tripTicket")
			.where("tripTicket.id = :id", { id })
			.getOne();
		if (!existingTripTicket) {
			throw new ApiError(`Trip ticket with ID '${id}' not found.`, 404);
		}

		// Delete the trip ticket
		return await repository.delete(id);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<TripTicket>,
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
					"tripTicket.ticketStatus IN (:...statusValues)",
					{
						statusValues,
					},
				);
			} else {
				queryBuilder.andWhere("tripTicket.ticketStatus = :status", {
					status: statusValue,
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

		// Apply filter for bookingRequestId if provided
		if (query.bookingRequestId) {
			queryBuilder.andWhere("booking_request.id = :bookingRequestId", {
				bookingRequestId: query.bookingRequestId,
			});
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<TripTicket>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = ["id", "userName"];

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
		if (searchField === "userName") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(user.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(tripTicket.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<TripTicket>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"departureTime",
			"arrivalTime",
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
					"CAST(SUBSTRING(tripTicket.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`tripTicket.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<TripTicket>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default TripTicketRepository;
