import { Service } from "typedi";
import {
	DeleteResult,
	EntityManager,
	Repository,
	SelectQueryBuilder,
} from "typeorm";
import AppDataSource from "../config/database";
import Trip from "../database/entities/Trip";
import TripStatus from "../database/enums/TripStatus";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class TripRepository {
	private readonly tripRepository: Repository<Trip> =
		AppDataSource.getRepository(Trip);

	private getRepository(manager?: EntityManager): Repository<Trip> {
		return manager ? manager.getRepository(Trip) : this.tripRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Trip[]> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Trip> = repository
			.createQueryBuilder("trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("trip.vehicle", "vehicle")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourced_vehicle")
			.leftJoinAndSelect("trip.schedule", "schedule")
			.leftJoinAndSelect("trip.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
			.leftJoinAndSelect("tickets.trip", "ticket_trip")
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
			.leftJoinAndSelect("trip.stops", "stops")
			.leftJoinAndSelect("stops.location", "stop_location");

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

	public async findByTripTicketId(
		ticketId: string,
		manager?: EntityManager,
	): Promise<Trip> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Find trip by trip ticket ID
		const trip: Trip | null = await repository
			.createQueryBuilder("trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("trip.vehicle", "vehicle")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourced_vehicle")
			.leftJoinAndSelect("trip.schedule", "schedule")
			.leftJoinAndSelect("trip.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
			.leftJoinAndSelect("tickets.trip", "ticket_trip")
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
			.leftJoinAndSelect("trip.stops", "stops")
			.leftJoinAndSelect("stops.location", "stop_location")
			.where("tickets.id = :ticketId", { ticketId })
			.getOne();

		if (!trip) {
			throw new ApiError(
				`Trip with ticket ID ${ticketId} not found.`,
				404,
			);
		}

		return trip;
	}

	public async findSchedulingTrips(
		hours: number,
		manager?: EntityManager,
	): Promise<Trip[]> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Get current time and cutoff time
		const startTime: Date = new Date();
		const now: Date = new Date();
		const cutoffTime: Date = new Date(
			now.getTime() + hours * 60 * 60 * 1000,
		);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Trip> = repository
			.createQueryBuilder("trip")
			.leftJoinAndSelect("trip.vehicle", "vehicle")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourced_vehicle")
			.leftJoinAndSelect("trip.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
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
			.leftJoinAndSelect("trip.stops", "stops")
			.leftJoinAndSelect("stops.location", "stop_location")
			.where("trip.status = :status", {
				status: TripStatus.SCHEDULING,
			})
			.andWhere("trip.departureTime >= :startTime", {
				startTime,
			})
			.andWhere("trip.departureTime <= :cutoffTime", {
				cutoffTime,
			})
			.andWhere("trip.vehicle IS NOT NULL")
			.orderBy("trip.departureTime", "ASC");

		return await queryBuilder.getMany();
	}

	public async getUpcomingTrip(manager?: EntityManager): Promise<Trip[]> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Calculate dates in UTC to match database
		const startOfTomorrow: Date = new Date();
		startOfTomorrow.setUTCHours(0, 0, 0, 0);
		startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
		const startOfDayAfterTomorrow: Date = new Date(startOfTomorrow);
		startOfDayAfterTomorrow.setUTCDate(
			startOfDayAfterTomorrow.getUTCDate() + 1,
		);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Trip> = repository
			.createQueryBuilder("trip")
			.leftJoinAndSelect("trip.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
			.leftJoinAndSelect("ticket_user.role", "ticket_user_role")
			.where("trip.status = :status", { status: TripStatus.SCHEDULED })
			.andWhere(
				"trip.departureTime >= :startOfTomorrow AND trip.departureTime < :startOfDayAfterTomorrow",
				{ startOfTomorrow, startOfDayAfterTomorrow },
			)
			.orderBy("trip.departureTime", "ASC");

		return await queryBuilder.getMany();
	}

	public async areAllTripsScheduled(
		bookingRequestId: string,
		manager?: EntityManager,
	): Promise<boolean> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Check if there are any trips not in 'scheduled' status for the given booking request ID
		const unscheduledTrip = await repository
			.createQueryBuilder("trip")
			.leftJoin("trip.tickets", "tickets")
			.leftJoin("tickets.bookingRequest", "bookingRequest")
			.where("bookingRequest.id = :bookingRequestId", {
				bookingRequestId,
			})
			.andWhere("trip.status != :scheduledStatus", {
				scheduledStatus: "scheduled",
			})
			.getOne();

		return !unscheduledTrip;
	}

	async findTripsByBookingRequestIds(
		bookingRequestIds: string[],
		manager?: EntityManager,
	): Promise<Trip[]> {
		// Return empty array if no booking request IDs are provided
		if (!bookingRequestIds.length) return [];

		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Trip> = repository
			.createQueryBuilder("trip")
			.distinct(true)
			.leftJoinAndSelect("trip.tickets", "ticket")
			.leftJoinAndSelect(
				"ticket.bookingRequest",
				"ticket_booking_request",
			)
			.leftJoinAndSelect("trip.stops", "stops")
			.leftJoinAndSelect("trip.schedule", "schedule")
			.where("ticket_booking_request.id IN (:...ids)", {
				ids: bookingRequestIds,
			});

		return await queryBuilder.getMany();
	}

	public async findByBookingRequestId(
		id: string,
		manager?: EntityManager,
	): Promise<Trip[]> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Trip> = repository
			.createQueryBuilder("trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("trip.vehicle", "vehicle")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourced_vehicle")
			.leftJoinAndSelect("trip.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
			.leftJoinAndSelect("tickets.trip", "ticket_trip")
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
			.leftJoinAndSelect("trip.stops", "stops")
			.leftJoinAndSelect("stops.location", "stop_location")
			.where("tickets.bookingRequest.id = :id", { id });

		return await queryBuilder.getMany();
	}

	public async findOne(
		id: string,
		manager?: EntityManager,
	): Promise<Trip | null> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Find trip by ID
		const trip: Trip | null = await repository
			.createQueryBuilder("trip")
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("trip.vehicle", "vehicle")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourced_vehicle")
			.leftJoinAndSelect("trip.schedule", "schedule")
			.leftJoinAndSelect("trip.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
			.leftJoinAndSelect("tickets.trip", "ticket_trip")
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
			.leftJoinAndSelect("trip.stops", "trip_stops")
			.leftJoinAndSelect("trip_stops.location", "stop_location")
			.where("trip.id = :id", { id })
			.getOne();

		return trip;
	}

	public async findById(id: string, manager?: EntityManager): Promise<Trip> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Create query builder
		const trip: Trip | null = await repository
			.createQueryBuilder("trip")
			.where("trip.id = :id", { id })
			.leftJoinAndSelect("trip.driver", "driver")
			.leftJoinAndSelect("trip.vehicle", "vehicle")
			.leftJoinAndSelect("trip.driverCurrentLocation", "location")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourced_vehicle")
			.leftJoinAndSelect("trip.tickets", "tickets")
			.leftJoinAndSelect("tickets.user", "ticket_user")
			.leftJoinAndSelect("trip.stops", "stops")
			.getOne();

		if (!trip) {
			throw new ApiError(`Trip with ID ${id} not found.`, 404);
		}

		return trip;
	}

	public async create(trip: Trip, manager?: EntityManager): Promise<Trip> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Check if the trip's ID already exists
		const existingTripWithId: Trip | null = await repository
			.createQueryBuilder("trip")
			.where("trip.id = :id", { id: trip.id })
			.getOne();
		if (existingTripWithId) {
			throw new ApiError(
				`Trip with ID '${trip.id}' already exists.`,
				409,
			);
		}

		// Save the new trip
		return await repository.save(trip);
	}

	public async update(trip: Trip, manager?: EntityManager): Promise<Trip> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Check if the trip exists
		const existingTrip: Trip | null = await repository
			.createQueryBuilder("trip")
			.where("trip.id = :id", { id: trip.id })
			.getOne();
		if (!existingTrip) {
			throw new ApiError(`Trip with ID '${trip.id}' not found.`, 404);
		}

		// Save the updated trip
		return await repository.save(trip);
	}

	public async delete(
		id: string,
		manager?: EntityManager,
	): Promise<DeleteResult> {
		// Get the repository
		const repository: Repository<Trip> = this.getRepository(manager);

		// Check if the trip exists
		const existingTrip: Trip | null = await repository
			.createQueryBuilder("trip")
			.where("trip.id = :id", { id })
			.getOne();
		if (!existingTrip) {
			throw new ApiError(`Trip with ID '${id}' not found.`, 404);
		}

		// Delete the trip
		return await repository.delete(id);
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Trip>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
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
				`(LOWER(REGEXP_REPLACE(vehicle.licensePlate, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern OR LOWER(REGEXP_REPLACE(outsourced_vehicle.licensePlate, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern)`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(trip.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<Trip>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for status if provided
		if (query.status) {
			const statusValue: string = query.status as string;
			if (statusValue.includes(",")) {
				const statusValues: string[] = statusValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere("trip.status IN (:...statusValues)", {
					statusValues,
				});
			} else {
				queryBuilder.andWhere("trip.status = :status", {
					status: statusValue,
				});
			}
		}

		// Apply filter for minTotalCost if provided
		if (query.minTotalCost) {
			queryBuilder.andWhere("trip.totalCost >= :minTotalCost", {
				minTotalCost: query.minTotalCost,
			});
		}

		// Apply filter for maxTotalCost if provided
		if (query.maxTotalCost) {
			queryBuilder.andWhere("trip.totalCost <= :maxTotalCost", {
				maxTotalCost: query.maxTotalCost,
			});
		}

		// Apply filter for departureTimeFrom if provided
		if (query.departureTimeFrom) {
			const departureTimeFrom: Date = new Date(
				query.departureTimeFrom as string,
			);
			queryBuilder.andWhere("trip.departureTime >= :departureTimeFrom", {
				departureTimeFrom,
			});
		}

		// Apply filter for departureTimeTo if provided
		if (query.departureTimeTo) {
			const departureTimeTo: Date = new Date(
				query.departureTimeTo as string,
			);
			queryBuilder.andWhere("trip.departureTime <= :departureTimeTo", {
				departureTimeTo,
			});
		}

		// Apply filter for arrivalTimeFrom if provided
		if (query.arrivalTimeFrom) {
			const arrivalTimeFrom: Date = new Date(
				query.arrivalTimeFrom as string,
			);
			queryBuilder.andWhere("trip.arrivalTime >= :arrivalTimeFrom", {
				arrivalTimeFrom,
			});
		}

		// Apply filter for arrivalTimeTo if provided
		if (query.arrivalTimeTo) {
			const arrivalTimeTo: Date = new Date(query.arrivalTimeTo as string);
			queryBuilder.andWhere(
				"trip.arrivalTime <= :arrivalTimeTo",
				arrivalTimeTo,
			);
		}

		// Apply filter for driverId if provided
		if (query.driverId) {
			queryBuilder.andWhere("driver.id = :driverId", {
				driverId: query.driverId,
			});
		}

		// Apply filter for vehicleId if provided
		if (query.vehicleId) {
			queryBuilder.andWhere("vehicle.id = :vehicleId", {
				vehicleId: query.vehicleId,
			});
		}

		// Apply filter to bookingRequestId if provided
		if (query.bookingRequestId) {
			queryBuilder.andWhere(
				"ticket_booking_request.id = :bookingRequestId",
				{
					bookingRequestId: query.bookingRequestId,
				},
			);
		}

		// Apply filter for passengerId if provided
		if (query.passengerId) {
			queryBuilder.andWhere("ticket_user.id = :passengerId", {
				passengerId: query.passengerId,
			});
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Trip>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"totalCost",
			"departureTime",
			"arrivalTime",
			"actualDepartureTime",
			"actualArrivalTime",
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
					"CAST(SUBSTRING(trip.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`trip.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Trip>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default TripRepository;
