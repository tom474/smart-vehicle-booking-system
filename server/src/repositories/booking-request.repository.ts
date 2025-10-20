import { Service } from "typedi";
import {
	DeleteResult,
	EntityManager,
	Repository,
	SelectQueryBuilder,
} from "typeorm";
import AppDataSource from "../config/database";
import BookingRequest from "../database/entities/BookingRequest";
import OneWayBookingRequest from "../database/entities/OneWayBookingRequest";
import RequestStatus from "../database/enums/RequestStatus";
import Priority from "../database/enums/Priority";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class BookingRequestRepository {
	private readonly bookingRequestRepository: Repository<BookingRequest> =
		AppDataSource.getRepository(BookingRequest);

	private getRepository(manager?: EntityManager): Repository<BookingRequest> {
		return manager
			? manager.getRepository(BookingRequest)
			: this.bookingRequestRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<BookingRequest[]> {
		// Get the repository
		const repository: Repository<BookingRequest> =
			this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<BookingRequest> = repository
			.createQueryBuilder("bookingRequest")
			.leftJoinAndSelect("bookingRequest.requester", "requester")
			.leftJoinAndSelect("bookingRequest.passengers", "passengers")
			.leftJoinAndSelect(
				"bookingRequest.departureLocation",
				"departure_location",
			)
			.leftJoinAndSelect(
				"bookingRequest.arrivalLocation",
				"arrival_location",
			)
			.leftJoinAndSelect(
				"bookingRequest.returnDepartureLocation",
				"return_departure_location",
			)
			.leftJoinAndSelect(
				"bookingRequest.returnArrivalLocation",
				"return_arrival_location",
			)
			.leftJoinAndSelect("bookingRequest.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
			.leftJoinAndSelect("tickets.trip", "ticket_trip")
			.leftJoinAndSelect("ticket_trip.driver", "ticket_driver")
			.leftJoinAndSelect("ticket_trip.vehicle", "ticket_vehicle")
			.leftJoinAndSelect(
				"ticket_trip.outsourcedVehicle",
				"ticket_trip_outsourced_vehicle",
			)
			.leftJoinAndSelect(
				"tickets.bookingRequest",
				"ticket_booking_request",
			)
			.leftJoinAndSelect(
				"tickets.departureLocation",
				"ticket_departure_location",
			)
			.leftJoinAndSelect(
				"tickets.arrivalLocation",
				"ticket_arrival_location",
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
				queryBuilder.orderBy("bookingRequest.updatedAt", "DESC");
			}
		}

		// Apply pagination if provided
		if (pagination) {
			await this.applyPagination(queryBuilder, pagination);
		}

		return await queryBuilder.getMany();
	}

	public async findBookingForTripOptimizer(
		manager?: EntityManager,
	): Promise<OneWayBookingRequest[]> {
		// Get the repository
		const repository: Repository<OneWayBookingRequest> = manager
			? manager.getRepository(OneWayBookingRequest)
			: AppDataSource.getRepository(OneWayBookingRequest);

		// Get current date and one month from now
		const now: Date = new Date();
		const oneMonthFromNow: Date = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			now.getDate() + 3,
		);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<OneWayBookingRequest> =
			repository
				.createQueryBuilder("bookingRequest")
				.leftJoinAndSelect(
					"bookingRequest.departureLocation",
					"departure_location",
				)
				.leftJoinAndSelect(
					"bookingRequest.arrivalLocation",
					"arrival_location",
				)
				.where("bookingRequest.status = :status", {
					status: RequestStatus.PENDING,
				})
				.andWhere("bookingRequest.priority != :priority", {
					priority: Priority.HIGH,
				})
				.andWhere(
					"bookingRequest.departureTime BETWEEN :now AND :oneMonthFromNow",
					{
						now,
						oneMonthFromNow,
					},
				)
				.orderBy("bookingRequest.departureTime", "ASC");

		return await queryBuilder.getMany();
	}

	public async findManyByIds(
		ids: string[],
		manager?: EntityManager,
	): Promise<OneWayBookingRequest[]> {
		// Validate input
		const requestIds: string[] = Array.isArray(ids) ? [...ids] : [];
		if (!requestIds.length) return [];

		// Enforce distinct input
		const uniqueIds: string[] = Array.from(new Set(requestIds));
		if (uniqueIds.length !== requestIds.length) {
			throw new ApiError(
				"Duplicate booking request IDs supplied. Provide a list of unique IDs.",
				400,
			);
		}

		// Get the repository
		const repository: Repository<OneWayBookingRequest> =
			this.getRepository(manager);

		// Find booking requests by IDs
		const bookingRequests: OneWayBookingRequest[] = await repository
			.createQueryBuilder("bookingRequest")
			.leftJoinAndSelect("bookingRequest.requester", "requester")
			.leftJoinAndSelect("bookingRequest.passengers", "passengers")
			.leftJoinAndSelect(
				"bookingRequest.departureLocation",
				"departure_lsocation",
			)
			.leftJoinAndSelect(
				"bookingRequest.arrivalLocation",
				"arrival_location",
			)
			.where("bookingRequest.id IN (:...ids)", { ids: uniqueIds })
			.getMany();

		// Ensure all requested IDs were found
		if (bookingRequests.length !== uniqueIds.length) {
			const foundIds: Set<string> = new Set(
				bookingRequests.map((bookingRequest) => bookingRequest.id),
			);
			const missingIds: string[] = uniqueIds.filter(
				(id) => !foundIds.has(id),
			);
			throw new ApiError(
				`Booking request(s) not found: ${missingIds.join(", ")}.`,
				404,
			);
		}

		return bookingRequests;
	}

	public async findOne(
		id: string,
		manager?: EntityManager,
	): Promise<BookingRequest | null> {
		// Get the repository
		const repository: Repository<BookingRequest> =
			this.getRepository(manager);

		// Find booking request by ID
		const bookingRequest: BookingRequest | null = await repository
			.createQueryBuilder("bookingRequest")
			.leftJoinAndSelect("bookingRequest.requester", "requester")
			.leftJoinAndSelect("requester.role", "role")
			.leftJoinAndSelect("bookingRequest.passengers", "passengers")
			.leftJoinAndSelect(
				"bookingRequest.departureLocation",
				"departure_location",
			)
			.leftJoinAndSelect(
				"bookingRequest.arrivalLocation",
				"arrival_location",
			)
			.leftJoinAndSelect(
				"bookingRequest.returnDepartureLocation",
				"return_departure_location",
			)
			.leftJoinAndSelect(
				"bookingRequest.returnArrivalLocation",
				"return_arrival_location",
			)
			.leftJoinAndSelect("bookingRequest.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
			.leftJoinAndSelect("tickets.trip", "ticket_trip")
			.leftJoinAndSelect("ticket_trip.driver", "ticket_trip_driver")
			.leftJoinAndSelect("ticket_trip.vehicle", "ticket_trip_vehicle")
			.leftJoinAndSelect(
				"ticket_trip.outsourcedVehicle",
				"ticket_trip_outsourced_vehicle",
			)
			.leftJoinAndSelect(
				"tickets.bookingRequest",
				"ticket_booking_request",
			)
			.leftJoinAndSelect(
				"tickets.departureLocation",
				"ticket_departure_location",
			)
			.leftJoinAndSelect(
				"tickets.arrivalLocation",
				"ticket_arrival_location",
			)
			.where("bookingRequest.id = :id", { id })
			.getOne();

		return bookingRequest;
	}

	public async findOneByBookingRequestIdAndTripId(
		bookingRequestId: string,
		tripId: string,
		manager?: EntityManager,
	): Promise<BookingRequest | null> {
		// Get the repository
		const repository: Repository<BookingRequest> =
			this.getRepository(manager);

		// Find booking request by ID and trip ID
		const bookingRequest: BookingRequest | null = await repository
			.createQueryBuilder("bookingRequest")
			.leftJoinAndSelect("bookingRequest.requester", "requester")
			.leftJoinAndSelect("bookingRequest.passengers", "passengers")
			.leftJoinAndSelect(
				"bookingRequest.departureLocation",
				"departure_location",
			)
			.leftJoinAndSelect(
				"bookingRequest.arrivalLocation",
				"arrival_location",
			)
			.leftJoinAndSelect(
				"bookingRequest.returnDepartureLocation",
				"return_departure_location",
			)
			.leftJoinAndSelect(
				"bookingRequest.returnArrivalLocation",
				"return_arrival_location",
			)
			.leftJoinAndSelect("bookingRequest.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
			.leftJoinAndSelect("tickets.trip", "ticket_trip")
			.leftJoinAndSelect("ticket_trip.driver", "ticket_trip_driver")
			.leftJoinAndSelect("ticket_trip.vehicle", "ticket_trip_vehicle")
			.leftJoinAndSelect(
				"ticket_trip.outsourcedVehicle",
				"ticket_trip_outsourced_vehicle",
			)
			.leftJoinAndSelect(
				"tickets.departureLocation",
				"ticket_departure_location",
			)
			.leftJoinAndSelect(
				"tickets.arrivalLocation",
				"ticket_arrival_location",
			)
			.leftJoinAndSelect(
				"tickets.bookingRequest",
				"ticket_booking_request",
			)
			.where("bookingRequest.id = :bookingRequestId", {
				bookingRequestId,
			})
			.andWhere("ticket_trip.id = :tripId", { tripId })
			.getOne();

		return bookingRequest;
	}

	public async findOneByTripId(
		tripId: string,
		manager?: EntityManager,
	): Promise<BookingRequest> {
		// Get the repository
		const repository: Repository<BookingRequest> =
			this.getRepository(manager);

		// Find booking request by trip ID
		const bookingRequest = await repository
			.createQueryBuilder("bookingRequest")
			.leftJoinAndSelect("bookingRequest.requester", "requester")
			.leftJoinAndSelect("requester.role", "role")
			.leftJoinAndSelect("bookingRequest.tickets", "tickets")
			.leftJoinAndSelect("tickets.trip", "ticket_trip")
			.where("trip.id = :tripId", { tripId })
			.getOne();

		if (!bookingRequest) {
			throw new ApiError(
				`Booking request for trip with ID '${tripId}' not found.`,
				404,
			);
		}

		return bookingRequest;
	}

	public async create(
		bookingRequest: BookingRequest,
		manager?: EntityManager,
	): Promise<BookingRequest> {
		// Get the repository
		const repository: Repository<BookingRequest> =
			this.getRepository(manager);

		// Check if the booking request's ID already exists
		const existingBookingRequestWithId: BookingRequest | null =
			await repository
				.createQueryBuilder("bookingRequest")
				.where("bookingRequest.id = :id", { id: bookingRequest.id })
				.getOne();
		if (existingBookingRequestWithId) {
			throw new ApiError(
				`Booking request with ID '${bookingRequest.id}' already exists.`,
				409,
			);
		}

		// Save the new booking request
		return await repository.save(bookingRequest);
	}

	public async update(
		bookingRequest: BookingRequest,
		manager?: EntityManager,
	): Promise<BookingRequest> {
		// Get the repository
		const repository: Repository<BookingRequest> =
			this.getRepository(manager);

		// Check if the booking request exists
		const existingBookingRequest: BookingRequest | null = await repository
			.createQueryBuilder("bookingRequest")
			.where("bookingRequest.id = :id", { id: bookingRequest.id })
			.getOne();
		if (!existingBookingRequest) {
			throw new ApiError(
				`Booking request with ID '${bookingRequest.id}' not found.`,
				404,
			);
		}

		// Save the updated booking request
		return await repository.save(bookingRequest);
	}

	public async delete(
		id: string,
		manager?: EntityManager,
	): Promise<DeleteResult> {
		// Get the repository
		const repository: Repository<BookingRequest> =
			this.getRepository(manager);

		// Check if the booking request exists
		const existingBookingRequest: BookingRequest | null = await repository
			.createQueryBuilder("bookingRequest")
			.where("bookingRequest.id = :id", { id })
			.getOne();
		if (!existingBookingRequest) {
			throw new ApiError(
				`Booking request with ID '${id}' not found.`,
				404,
			);
		}

		// Delete the booking request
		return await repository.delete(id);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<BookingRequest>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for priority if provided
		if (query.priority) {
			const priorityValue: string = query.priority as string;
			if (priorityValue.includes(",")) {
				const priorityValues: string[] = priorityValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"bookingRequest.priority IN (:...priorityValues)",
					{
						priorityValues,
					},
				);
			} else {
				queryBuilder.andWhere("bookingRequest.priority = :priority", {
					priority: priorityValue,
				});
			}
		}

		// Apply filter for type if provided
		if (query.type) {
			const typeValue: string = query.type as string;
			if (typeValue.includes(",")) {
				const typeValues: string[] = typeValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"bookingRequest.type IN (:...typeValues)",
					{
						typeValues,
					},
				);
			} else {
				queryBuilder.andWhere("bookingRequest.type = :type", {
					type: typeValue,
				});
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
					"bookingRequest.status IN (:...statusValues)",
					{ statusValues },
				);
			} else {
				queryBuilder.andWhere("bookingRequest.status = :status", {
					status: statusValue,
				});
			}
		}

		// Apply filter for minNumberOfPassengers if provided
		if (query.minNumberOfPassengers) {
			queryBuilder.andWhere(
				"bookingRequest.numberOfPassengers >= :minNumberOfPassengers",
				{
					minNumberOfPassengers: query.minNumberOfPassengers,
				},
			);
		}

		// Apply filter for maxNumberOfPassengers if provided
		if (query.maxNumberOfPassengers) {
			queryBuilder.andWhere(
				"bookingRequest.numberOfPassengers <= :maxNumberOfPassengers",
				{
					maxNumberOfPassengers: query.maxNumberOfPassengers,
				},
			);
		}

		// Apply filter for departureTimeFrom if provided
		if (query.departureTimeFrom) {
			const departureTimeFrom: Date = new Date(
				query.departureTimeFrom as string,
			);
			queryBuilder.andWhere(
				"bookingRequest.departureTime >= :departureTimeFrom",
				{ departureTimeFrom },
			);
		}

		// Apply filter for departureTimeTo if provided
		if (query.departureTimeTo) {
			const departureTimeTo: Date = new Date(
				query.departureTimeTo as string,
			);
			queryBuilder.andWhere(
				"bookingRequest.departureTime <= :departureTimeTo",
				{ departureTimeTo },
			);
		}

		// Apply filter for arrivalTimeFrom if provided
		if (query.arrivalTimeFrom) {
			const arrivalTimeFrom: Date = new Date(
				query.arrivalTimeFrom as string,
			);
			queryBuilder.andWhere(
				"bookingRequest.arrivalTime >= :arrivalTimeFrom",
				{ arrivalTimeFrom },
			);
		}

		// Apply filter for arrivalTimeTo if provided
		if (query.arrivalTimeTo) {
			const arrivalTimeTo: Date = new Date(query.arrivalTimeTo as string);
			queryBuilder.andWhere(
				"bookingRequest.arrivalTime <= :arrivalTimeTo",
				{ arrivalTimeTo },
			);
		}

		// Apply filter for requesterId if provided
		if (query.requesterId) {
			queryBuilder.andWhere(
				"(requester.id = :requesterId OR passengers.id = :requesterId)",
				{
					requesterId: query.requesterId,
				},
			);
		}

		// Apply filter for isReserved if provided
		if (query.isReserved) {
			const isReservedValue: string = query.isReserved as string;
			if (isReservedValue.includes(",")) {
				const isReservedValues: string[] = isReservedValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere(
					"bookingRequest.isReserved IN (:...isReservedValues)",
					{
						isReservedValues,
					},
				);
			} else {
				queryBuilder.andWhere(
					"bookingRequest.isReserved = :isReserved",
					{
						isReserved: isReservedValue,
					},
				);
			}
		}

		// Apply filter for tripId if provided
		if (query.tripId) {
			queryBuilder.andWhere("ticket_trip.id = :tripId", {
				tripId: query.tripId,
			});
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<BookingRequest>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"tripPurpose",
			"note",
			"requesterName",
			"contactName",
			"contactPhoneNumber",
			"cancelReason",
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
		if (searchField === "requesterName") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(requester.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(bookingRequest.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<BookingRequest>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"tripPurpose",
			"note",
			"contactName",
			"contactPhoneNumber",
			"departureTime",
			"arrivalTime",
			"returnDepartureTime",
			"returnArrivalTime",
			"cancelReason",
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
					"CAST(SUBSTRING(bookingRequest.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`bookingRequest.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<BookingRequest>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default BookingRequestRepository;
