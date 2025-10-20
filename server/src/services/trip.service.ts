import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import Trip from "../database/entities/Trip";
import TripTicket from "../database/entities/TripTicket";
import TripStop from "../database/entities/TripStop";
import BookingRequest from "../database/entities/BookingRequest";
import RoundTripBookingRequest from "../database/entities/RoundTripBookingRequest";
import Location from "../database/entities/Location";
import Driver from "../database/entities/Driver";
import Vehicle from "../database/entities/Vehicle";
import OutsourcedVehicle from "../database/entities/OutsourcedVehicle";
import Schedule from "../database/entities/Schedule";
import PublicTripAccess from "../database/entities/PublicTripAccess";
import TripStopType from "../database/enums/TripStopType";
import TripStatus from "../database/enums/TripStatus";
import TripTicketStatus from "../database/enums/TripTicketStatus";
import Priority from "../database/enums/Priority";
import BookingRequestType from "../database/enums/BookingRequestType";
import RequestStatus from "../database/enums/RequestStatus";
import UserStatus from "../database/enums/UserStatus";
import DriverAvailability from "../database/enums/DriverAvailability";
import VehicleAvailability from "../database/enums/VehicleAvailability";
import LocationType from "../database/enums/LocationType";
import ActionType from "../database/enums/ActionType";
import TripRepository from "../repositories/trip.repository";
import TripTicketRepository from "../repositories/trip-ticket.repository";
import TripStopRepository from "../repositories/trip-stop.repository";
import BookingRequestRepository from "../repositories/booking-request.repository";
import DriverRepository from "../repositories/driver.repository";
import VehicleRepository from "../repositories/vehicle.repository";
import OutsourcedVehicleRepository from "../repositories/outsourced-vehicle.repository";
import ScheduleRepository from "../repositories/schedule.repository";
import PublicTripAccessRepository from "../repositories/pulic-trip-access.repository";
import ITripService from "./interfaces/ITripService";
import IdCounterService from "./id-counter.service";
import LocationService from "./location.service";
import ActivityLogService from "./activity-log.service";
import GoogleMapsService from "./google-maps.service";
import DetailedTripResponseDto from "../dtos/trip/detailed-trip-response.dto";
import BasicTripTicketResponseDto from "../dtos/trip-ticket/basic-trip-ticket-response.dto";
import TripStopResponseDto from "../dtos/trip-stop/trip-stop-response.dto";
import SelectVehicleDto from "../dtos/vehicle/select-vehicle.dto";
import CreateOutsourcedVehicleDto from "../dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import BookingRequestResponseDto from "../dtos/booking-request/booking-request-response.dto";
import CreateCombinedTripDto from "../dtos/trip/create-combined-trip.dto";
import SelectBookingRequestDto from "../dtos/booking-request/select-booking-request.dto";
import DetailedVehicleResponseDto from "../dtos/vehicle/detailed-vehicle-response.dto";
import DriverCurrentLocationDto from "../dtos/trip/driver-current-location.dto";
import UpdateDriverCurrentLocationDto from "../dtos/trip/update-driver-current-location.dto";
import PublicTripAccessDto from "../dtos/trip/public-trip-access.dto";
import TripOptimizerResultDto from "../dtos/trip-optimizer/trip-optimizer-result.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";
import logger from "../utils/logger";
import NotificationBody from "../dtos/notification/notification-body.dto";
import NotificationService from "./notification.service";

@Service()
class TripService implements ITripService {
	constructor(
		private readonly tripRepository: TripRepository,
		private readonly tripTicketRepository: TripTicketRepository,
		private readonly tripStopRepository: TripStopRepository,
		private readonly bookingRequestRepository: BookingRequestRepository,
		private readonly driverRepository: DriverRepository,
		private readonly vehicleRepository: VehicleRepository,
		private readonly outsourcedVehicleRepository: OutsourcedVehicleRepository,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly publicTripAccessRepository: PublicTripAccessRepository,
		private readonly idCounterService: IdCounterService,
		private readonly locationService: LocationService,
		private readonly activityLogService: ActivityLogService,
		private readonly googleMapsService: GoogleMapsService,
		private readonly notificationService: NotificationService,
	) {}

	public async getTrips(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedTripResponseDto[]> {
		try {
			// Fetch trips
			const trips: Trip[] = await this.tripRepository.find(
				pagination,
				query,
			);

			// Map trips to response DTOs
			const tripResponseDto: DetailedTripResponseDto[] = trips.map(
				(trip) => this.mapTripToResponseDto(trip),
			);

			return tripResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch trips.", 500, error);
		}
	}

	public async getTripById(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto> {
		try {
			// Fetch trip by ID
			const trip: Trip | null = await this.tripRepository.findOne(id);
			if (!trip) {
				throw new ApiError(`Trip with ID '${id}' not found.`, 404);
			}

			// Map trip to response DTO
			const tripResponseDto: DetailedTripResponseDto =
				this.mapTripToResponseDto(trip);

			return tripResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch trip with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createSchedulingTripFromBookingRequest(
		bookingRequest: BookingRequest,
		vehicle: Vehicle | OutsourcedVehicle,
		manager: EntityManager,
	): Promise<TripTicket[]> {
		const tripTickets: TripTicket[] = [];

		// Check if the booking request's type
		const isRoundTrip = bookingRequest instanceof RoundTripBookingRequest;

		// Generate IDs
		const tripIds: string[] = await this.idCounterService.generateIds(
			EntityMap.TRIP,
			isRoundTrip ? 2 : 1,
			manager,
		);
		const tripTicketIds: string[] = await this.idCounterService.generateIds(
			EntityMap.TRIP_TICKET,
			isRoundTrip
				? bookingRequest.passengers.length * 2
				: bookingRequest.passengers.length,
			manager,
		);
		const tripStopIds: string[] = await this.idCounterService.generateIds(
			EntityMap.TRIP_STOP,
			isRoundTrip ? 4 : 2,
			manager,
		);

		// Create trip
		const trip: Trip = new Trip(
			tripIds[0],
			bookingRequest.departureTime,
			bookingRequest.arrivalTime,
			vehicle instanceof Vehicle ? vehicle.driver : null,
			vehicle instanceof Vehicle ? vehicle : null,
			vehicle instanceof OutsourcedVehicle ? vehicle : null,
		);
		trip.tickets = [];
		trip.stops = [];

		// Create trip tickets
		for (const [i, passenger] of bookingRequest.passengers.entries()) {
			const tripTicket: TripTicket = new TripTicket(
				tripTicketIds[i],
				passenger,
				bookingRequest,
				trip,
				bookingRequest.departureTime,
				bookingRequest.arrivalTime,
				bookingRequest.departureLocation,
				bookingRequest.arrivalLocation,
			);
			tripTickets.push(tripTicket);
			trip.tickets.push(tripTicket);
		}

		// Create trip stops
		const departureStop = new TripStop(
			tripStopIds[0],
			trip,
			TripStopType.PICKUP,
			1,
			bookingRequest.departureLocation,
			bookingRequest.departureTime,
		);
		trip.stops.push(departureStop);
		const arrivalStop = new TripStop(
			tripStopIds[1],
			trip,
			TripStopType.DROP_OFF,
			2,
			bookingRequest.arrivalLocation,
			bookingRequest.arrivalTime,
		);
		trip.stops.push(arrivalStop);

		// Create trip
		await this.tripRepository.create(trip, manager);

		if (isRoundTrip) {
			// Create return trip
			const returnTrip: Trip = new Trip(
				tripIds[1],
				bookingRequest.returnDepartureTime,
				bookingRequest.returnArrivalTime,
				vehicle instanceof Vehicle ? vehicle.driver : null,
				vehicle instanceof Vehicle ? vehicle : null,
				vehicle instanceof OutsourcedVehicle ? vehicle : null,
			);
			returnTrip.tickets = [];
			returnTrip.stops = [];

			// Create return trip tickets
			for (const [i, passenger] of bookingRequest.passengers.entries()) {
				const tripTicket = new TripTicket(
					tripTicketIds[i + bookingRequest.passengers.length],
					passenger,
					bookingRequest,
					returnTrip,
					bookingRequest.returnDepartureTime,
					bookingRequest.returnArrivalTime,
					bookingRequest.returnDepartureLocation,
					bookingRequest.returnArrivalLocation,
				);
				tripTickets.push(tripTicket);
				returnTrip.tickets.push(tripTicket);
			}

			// Create return trip stops
			const returnDepartureStop = new TripStop(
				tripStopIds[2],
				returnTrip,
				TripStopType.PICKUP,
				1,
				bookingRequest.returnDepartureLocation,
				bookingRequest.returnDepartureTime,
			);
			returnTrip.stops.push(returnDepartureStop);
			const returnArrivalStop = new TripStop(
				tripStopIds[3],
				returnTrip,
				TripStopType.DROP_OFF,
				2,
				bookingRequest.returnArrivalLocation,
				bookingRequest.returnArrivalTime,
			);
			returnTrip.stops.push(returnDepartureStop, returnArrivalStop);

			// Create return trip
			await this.tripRepository.create(returnTrip, manager);
		}

		return tripTickets;
	}

	public async createScheduledTripFromBookingRequest(
		bookingRequest: BookingRequest,
		vehicle: Vehicle | OutsourcedVehicle,
		manager: EntityManager,
	): Promise<TripTicket[]> {
		const tripTickets: TripTicket[] = [];

		// Check if the booking request's type
		const isRoundTrip = bookingRequest instanceof RoundTripBookingRequest;

		// Generate IDs
		const tripIds: string[] = await this.idCounterService.generateIds(
			EntityMap.TRIP,
			isRoundTrip ? 2 : 1,
			manager,
		);
		const tripTicketIds: string[] = await this.idCounterService.generateIds(
			EntityMap.TRIP_TICKET,
			isRoundTrip
				? bookingRequest.passengers.length * 2
				: bookingRequest.passengers.length,
			manager,
		);
		const tripStopIds: string[] = await this.idCounterService.generateIds(
			EntityMap.TRIP_STOP,
			isRoundTrip ? 4 : 2,
			manager,
		);
		let scheduleIds: string[] = [];
		if (vehicle instanceof Vehicle) {
			scheduleIds = await this.idCounterService.generateIds(
				EntityMap.SCHEDULE,
				isRoundTrip ? 3 : 1,
				manager,
			);
		}

		// Create trip
		const trip: Trip = new Trip(
			tripIds[0],
			bookingRequest.departureTime,
			bookingRequest.arrivalTime,
			vehicle instanceof Vehicle ? vehicle.driver : null,
			vehicle instanceof Vehicle ? vehicle : null,
			vehicle instanceof OutsourcedVehicle ? vehicle : null,
		);
		trip.tickets = [];
		trip.stops = [];
		trip.status = TripStatus.SCHEDULED;

		// Create trip tickets
		for (const [i, passenger] of bookingRequest.passengers.entries()) {
			const tripTicket: TripTicket = new TripTicket(
				tripTicketIds[i],
				passenger,
				bookingRequest,
				trip,
				bookingRequest.departureTime,
				bookingRequest.arrivalTime,
				bookingRequest.departureLocation,
				bookingRequest.arrivalLocation,
			);
			tripTickets.push(tripTicket);
			trip.tickets.push(tripTicket);
		}

		// Create trip stops
		const departureStop = new TripStop(
			tripStopIds[0],
			trip,
			TripStopType.PICKUP,
			1,
			bookingRequest.departureLocation,
			bookingRequest.departureTime,
		);
		trip.stops.push(departureStop);
		const arrivalStop = new TripStop(
			tripStopIds[1],
			trip,
			TripStopType.DROP_OFF,
			2,
			bookingRequest.arrivalLocation,
			bookingRequest.arrivalTime,
		);
		trip.stops.push(arrivalStop);

		// Create trip
		await this.tripRepository.create(trip, manager);

		// Create trip schedule for driver
		if (vehicle instanceof Vehicle) {
			const schedule: Schedule = new Schedule(
				scheduleIds[0],
				`Trip #${trip.id}`,
				trip.departureTime,
				trip.arrivalTime,
				`Trip from ${trip.stops[0].location.name} to ${trip.stops[trip.stops.length - 1].location.name}.`,
				vehicle.driver,
				vehicle,
				trip,
			);
			await this.scheduleRepository.create(schedule, manager);
		}

		if (isRoundTrip) {
			// Create return trip
			const returnTrip: Trip = new Trip(
				tripIds[1],
				bookingRequest.returnDepartureTime,
				bookingRequest.returnArrivalTime,
				vehicle instanceof Vehicle ? vehicle.driver : null,
				vehicle instanceof Vehicle ? vehicle : null,
				vehicle instanceof OutsourcedVehicle ? vehicle : null,
			);
			returnTrip.tickets = [];
			returnTrip.stops = [];
			returnTrip.status = TripStatus.SCHEDULED;

			// Create return trip tickets
			for (const [i, passenger] of bookingRequest.passengers.entries()) {
				const tripTicket = new TripTicket(
					tripTicketIds[i + bookingRequest.passengers.length],
					passenger,
					bookingRequest,
					returnTrip,
					bookingRequest.returnDepartureTime,
					bookingRequest.returnArrivalTime,
					bookingRequest.returnDepartureLocation,
					bookingRequest.returnArrivalLocation,
				);
				tripTickets.push(tripTicket);
				returnTrip.tickets.push(tripTicket);
			}

			// Create return trip stops
			const returnDepartureStop = new TripStop(
				tripStopIds[2],
				returnTrip,
				TripStopType.PICKUP,
				1,
				bookingRequest.returnDepartureLocation,
				bookingRequest.returnDepartureTime,
			);
			returnTrip.stops.push(returnDepartureStop);
			const returnArrivalStop = new TripStop(
				tripStopIds[3],
				returnTrip,
				TripStopType.DROP_OFF,
				2,
				bookingRequest.returnArrivalLocation,
				bookingRequest.returnArrivalTime,
			);
			returnTrip.stops.push(returnDepartureStop, returnArrivalStop);

			// Create return trip
			await this.tripRepository.create(returnTrip, manager);

			// Create return trip schedule for driver
			if (vehicle instanceof Vehicle) {
				const reservedSchedule: Schedule = new Schedule(
					scheduleIds[1],
					`Reserved Schedule for Trip #${trip.id} and Trip #${returnTrip.id}`,
					trip.arrivalTime,
					returnTrip.departureTime,
					`Reserved schedule for round trip from ${trip.stops[0].location.name} to ${trip.stops[trip.stops.length - 1].location.name} and return.`,
					vehicle.driver,
					vehicle,
				);
				await this.scheduleRepository.create(reservedSchedule, manager);
				const returnSchedule: Schedule = new Schedule(
					scheduleIds[2],
					`Trip #${returnTrip.id}`,
					returnTrip.departureTime,
					returnTrip.arrivalTime,
					`Return trip from ${returnTrip.stops[0].location.name} to ${returnTrip.stops[returnTrip.stops.length - 1].location.name}.`,
					vehicle.driver,
					vehicle,
					returnTrip,
				);
				await this.scheduleRepository.create(returnSchedule, manager);
			}
		}

		return tripTickets;
	}

	public async getAvailableVehiclesForTrip(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedVehicleResponseDto[]> {
		try {
			const result: DetailedVehicleResponseDto[] =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch trip by ID
						const trip: Trip | null =
							await this.tripRepository.findOne(id, manager);
						if (!trip) {
							throw new ApiError(
								`Trip with ID '${id}' not found.`,
								404,
							);
						}

						// Fetch all active drivers
						const drivers: Driver[] =
							await this.driverRepository.find(
								undefined,
								{ status: UserStatus.ACTIVE },
								manager,
							);

						// Filter available drivers and vehicles
						const availableVehicleIds: string[] = [];
						for (const driver of drivers) {
							if (
								driver.vehicle &&
								!driver.vehicle.executive &&
								driver.vehicle.availability !==
									VehicleAvailability.UNAVAILABLE &&
								driver.vehicle.availability !==
									VehicleAvailability.OUT_OF_SERVICE &&
								driver.vehicle.capacity >= trip.tickets.length
							) {
								// Check driver's schedules
								if (driver.schedules.length === 0) {
									availableVehicleIds.push(driver.vehicle.id);
								} else {
									// Get the start and end time of the trip
									let startTime: Date = trip.departureTime;
									let endTime: Date = trip.arrivalTime;

									// Check if driver is available (no conflicting schedules)
									let hasConflict = false;
									for (const schedule of driver.schedules) {
										if (
											schedule.startTime < endTime &&
											schedule.endTime > startTime
										) {
											hasConflict = true;
											break;
										}
									}

									// Only add vehicle if there are no scheduling conflicts
									if (!hasConflict) {
										availableVehicleIds.push(
											driver.vehicle.id,
										);
									}
								}
							}
						}

						// Fetch the available vehicles by IDs
						const availableVehicles: Vehicle[] = [];
						for (const vehicleId of availableVehicleIds) {
							const vehicle: Vehicle | null =
								await this.vehicleRepository.findOne(
									vehicleId,
									manager,
								);
							if (!vehicle) {
								throw new ApiError(
									`Vehicle with ID '${vehicleId}' not found.`,
									404,
								);
							}
							availableVehicles.push(vehicle);
						}

						// Transform the available vehicles to DTOs
						const vehicleResponseDtos: DetailedVehicleResponseDto[] =
							plainToInstance(
								DetailedVehicleResponseDto,
								availableVehicles,
								{
									excludeExtraneousValues: true,
								},
							);

						return vehicleResponseDtos;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch available vehicles for trip with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async assignVehicleToTrip(
		currentUser: CurrentUser,
		id: string,
		data: SelectVehicleDto,
	): Promise<DetailedTripResponseDto> {
		try {
			const result: DetailedTripResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						if (!data.vehicleId) {
							throw new ApiError(
								"Vehicle ID is required to assign a vehicle to a trip.",
								400,
							);
						}

						// Fetch trip by ID
						const trip: Trip | null =
							await this.tripRepository.findOne(id, manager);
						if (!trip) {
							throw new ApiError(
								`Trip with ID '${id}' not found.`,
								404,
							);
						}

						// Fetch the vehicle by ID
						const vehicle: Vehicle | null =
							await this.vehicleRepository.findOne(
								data.vehicleId,
								manager,
							);
						if (!vehicle) {
							throw new ApiError(
								`Vehicle with ID '${data.vehicleId}' not found.`,
								404,
							);
						}

						// Handle vehicle's conflicting schedules if any
						const startTime: Date = trip.departureTime;
						const endTime: Date = trip.arrivalTime;
						const schedules: Schedule[] =
							await this.scheduleRepository.find(
								undefined,
								{
									vehicleId: vehicle.id,
									startTimeFrom: startTime,
									endTimeTo: endTime,
								},
								manager,
							);
						if (schedules.length > 0) {
							for (const schedule of schedules) {
								if (schedule.trip) {
									// Fetch the associated trip
									const trip: Trip | null =
										await this.tripRepository.findOne(
											schedule.trip.id,
											manager,
										);
									if (!trip) {
										throw new ApiError(
											`Failed to fetch associated trip with ID '${schedule.trip.id}'.`,
											404,
										);
									}

									if (trip.status === TripStatus.SCHEDULING) {
										// If the trip is still scheduling, delete the trip
										await this.tripRepository.delete(
											trip.id,
											manager,
										);
									} else {
										throw new ApiError(
											`Vehicle with ID '${vehicle.id}' has a scheduled trip with ID '${trip.id}'. Please reassign or cancel the trip before assigning the vehicle to the trip.`,
											403,
										);
									}
								}
							}
						}

						// Update the trip's schedule
						if (trip.schedule) {
							// Fetch the trip's schedule by ID
							const schedule: Schedule | null =
								await this.scheduleRepository.findOne(
									trip.schedule.id,
									manager,
								);
							if (!schedule) {
								throw new ApiError(
									`Schedule for trip with ID '${trip.id}' not found.`,
									404,
								);
							}

							// Send notification to previous driver if any
							if (schedule.driver) {
								const cancelNotificationBody: NotificationBody =
									new NotificationBody(
										"Trip Cancelled",
										"DriverTripCancelled",
										{
											date: new Date(
												schedule.startTime,
											).toLocaleDateString("en-GB", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
											}),
										},
										trip.id,
										Priority.HIGH,
									);

								await this.notificationService.sendUserNotification(
									cancelNotificationBody,
									schedule.driver.id,
									RoleMap.DRIVER,
									manager,
								);
							}
							// Update the schedule's driver and vehicle
							schedule.driver = vehicle.driver;
							schedule.vehicle = vehicle;
							await this.scheduleRepository.update(
								schedule,
								manager,
							);

							// Fetch the updated schedule
							const updatedSchedule =
								await this.scheduleRepository.findOne(
									schedule.id,
									manager,
								);
							if (!updatedSchedule) {
								throw new ApiError(
									`Failed to fetch updated schedule with ID '${schedule.id}'.`,
									404,
								);
							}
							trip.schedule = updatedSchedule;
						} else {
							// Create a new schedule for trip, driver, and vehicle
							const scheduleId: string =
								await this.idCounterService.generateId(
									EntityMap.SCHEDULE,
									manager,
								);
							const schedule: Schedule = new Schedule(
								scheduleId,
								`Trip #${trip.id}`,
								trip.departureTime,
								trip.arrivalTime,
								`Trip from ${trip.stops[0].location.name} to ${trip.stops[trip.stops.length - 1].location.name}.`,
								vehicle.driver,
								vehicle,
								trip,
								null,
								null,
							);
							await this.scheduleRepository.create(
								schedule,
								manager,
							);
							trip.schedule = schedule;
						}

						// Update the trip with the assigned vehicle
						trip.vehicle = vehicle;
						trip.driver = vehicle.driver;
						trip.outsourcedVehicle = null;
						trip.status = TripStatus.SCHEDULED;
						await this.tripRepository.update(trip, manager);

						// Approve all associated booking requests
						const bookingRequestIds: BookingRequest[] = [];
						for (const ticket of trip.tickets) {
							if (
								!bookingRequestIds.includes(
									ticket.bookingRequest,
								)
							) {
								bookingRequestIds.push(ticket.bookingRequest);
							}
						}
						for (const bookingRequest of bookingRequestIds) {
							bookingRequest.status = RequestStatus.APPROVED;
							await this.bookingRequestRepository.update(
								bookingRequest,
								manager,
							);
						}

						// Fetch the assigned trip
						const assignedTrip = await this.tripRepository.findOne(
							trip.id,
							manager,
						);
						if (!assignedTrip) {
							throw new ApiError(
								`Failed to fetch assigned trip with ID '${trip.id}'.`,
								500,
							);
						}

						// Send notification to the new driver
						const newTripNotificationBody: NotificationBody =
							new NotificationBody(
								"New Trip Assigned",
								"DriverNewTripAssigned",
								{
									date: new Date(
										trip.departureTime,
									).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
									}),
									time: new Date(
										trip.departureTime,
									).toLocaleTimeString("en-GB", {
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									}),
								},
								trip.id,
								Priority.HIGH,
							);

						await this.notificationService.sendUserNotification(
							newTripNotificationBody,
							vehicle.driver!.id,
							RoleMap.DRIVER,
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.TRIP,
							trip.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' assigned vehicle with ID '${vehicle.id}' to trip with ID '${trip.id}'.`,
							manager,
						);

						// Transform the assigned trip to DTO
						const assignedTripDto: DetailedTripResponseDto =
							plainToInstance(
								DetailedTripResponseDto,
								assignedTrip,
								{
									excludeExtraneousValues: true,
								},
							);

						return assignedTripDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to assign vehicle with ID '${data.vehicleId}' to trip with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async assignOutSourcedVehicleToTrip(
		currentUser: CurrentUser,
		id: string,
		data: CreateOutsourcedVehicleDto,
	): Promise<DetailedTripResponseDto> {
		try {
			const result: DetailedTripResponseDto =
				await AppDataSource.transaction(async (manager) => {
					// Fetch the trip by ID
					const trip: Trip | null =
						await this.tripRepository.findOne(id);
					if (!trip) {
						throw new ApiError(
							`Trip with ID '${id}' not found.`,
							404,
						);
					}

					// Create the outsourced vehicle
					const outsourcedVehicleId: string =
						await this.idCounterService.generateId(
							EntityMap.OUTSOURCED_VEHICLE,
							manager,
						);
					const outsourcedVehicle: OutsourcedVehicle =
						new OutsourcedVehicle(
							outsourcedVehicleId,
							data.driverName,
							data.phoneNumber,
							data.licensePlate,
							data.color,
							data.capacity,
							data.model,
						);
					await this.outsourcedVehicleRepository.create(
						outsourcedVehicle,
						manager,
					);

					// Update the trip's schedule
					if (trip.schedule) {
						// Fetch the trip's schedule by ID
						const schedule: Schedule | null =
							await this.scheduleRepository.findOne(
								trip.schedule.id,
								manager,
							);
						if (!schedule) {
							throw new ApiError(
								`Schedule for trip with ID '${trip.id}' not found.`,
								404,
							);
						}

						// Send notification to previous driver if any
						if (schedule.driver) {
							const cancelNotificationBody: NotificationBody =
								new NotificationBody(
									"Trip Cancelled",
									"DriverTripCancelled",
									{
										date: new Date(
											schedule.startTime,
										).toLocaleDateString("en-GB", {
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
										}),
									},
									trip.id,
									Priority.HIGH,
								);

							await this.notificationService.sendUserNotification(
								cancelNotificationBody,
								schedule.driver.id,
								RoleMap.DRIVER,
								manager,
							);
						}

						// Update the schedule
						schedule.driver = null;
						schedule.vehicle = null;
						await this.scheduleRepository.update(schedule, manager);

						// Fetch the updated schedule
						const updatedSchedule =
							await this.scheduleRepository.findOne(
								schedule.id,
								manager,
							);
						if (!updatedSchedule) {
							throw new ApiError(
								`Failed to fetch updated schedule with ID '${schedule.id}'.`,
								404,
							);
						}
						trip.schedule = updatedSchedule;
					} else {
						// Generate an ID for the new schedule
						const scheduleId: string =
							await this.idCounterService.generateId(
								EntityMap.SCHEDULE,
								manager,
							);

						// Create a new schedule for trip, driver, and vehicle
						const schedule: Schedule = new Schedule(
							scheduleId,
							`Trip #${trip.id}`,
							trip.departureTime,
							trip.arrivalTime,
							`Trip from ${trip.stops[0].location.name} to ${trip.stops[trip.stops.length - 1].location.name}.`,
							null,
							null,
							trip,
							null,
							null,
						);
						await this.scheduleRepository.create(schedule, manager);
						trip.schedule = schedule;
					}

					// Update the trip with the outsourced vehicle
					trip.driver = null;
					trip.vehicle = null;
					trip.outsourcedVehicle = outsourcedVehicle;
					trip.status = TripStatus.SCHEDULED;
					await this.tripRepository.update(trip, manager);

					// Approve all associated booking requests
					const bookingRequestIds: BookingRequest[] = [];
					for (const ticket of trip.tickets) {
						if (
							!bookingRequestIds.includes(ticket.bookingRequest)
						) {
							bookingRequestIds.push(ticket.bookingRequest);
						}
					}
					for (const bookingRequest of bookingRequestIds) {
						bookingRequest.status = RequestStatus.APPROVED;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);
					}

					// Fetch the assigned trip
					const assignedTrip = await this.tripRepository.findOne(
						trip.id,
						manager,
					);
					if (!assignedTrip) {
						throw new ApiError(
							`Failed to fetch assigned trip with ID '${trip.id}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.TRIP,
						trip.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' assigned outsourced vehicle with ID '${outsourcedVehicle.id}' to trip with ID '${trip.id}'.`,
						manager,
					);

					// Transform the assigned trip to DTO
					const assignedTripDto: DetailedTripResponseDto =
						plainToInstance(DetailedTripResponseDto, assignedTrip, {
							excludeExtraneousValues: true,
						});

					return assignedTripDto;
				});
			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to assign outsourced vehicle to trip with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createCombinedTrip(
		currentUser: CurrentUser,
		data: CreateCombinedTripDto,
	): Promise<DetailedTripResponseDto> {
		try {
			const result: DetailedTripResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Get booking requests by IDs
						const bookingRequests: BookingRequest[] = [];
						for (const bookingRequestId of data.bookingRequestIds) {
							const bookingRequest: BookingRequest | null =
								await this.bookingRequestRepository.findOne(
									bookingRequestId,
									manager,
								);
							if (!bookingRequest) {
								throw new ApiError(
									`Booking request with ID '${bookingRequestId}' not found.`,
									404,
								);
							}
							bookingRequests.push(bookingRequest);
						}

						// All booking requests should be pending and one_way
						for (const bookingRequest of bookingRequests) {
							if (
								bookingRequest.status !==
									RequestStatus.PENDING &&
								bookingRequest.type !==
									BookingRequestType.ONE_WAY
							) {
								throw new ApiError(
									`Booking request with ID '${bookingRequest.id}' is not pending or one-way.`,
									400,
								);
							}
						}

						// Get the vehicle by ID
						const vehicle: Vehicle | null =
							await this.vehicleRepository.findOne(
								data.vehicleId,
								manager,
							);
						if (!vehicle) {
							throw new ApiError(
								`Vehicle with ID '${data.vehicleId}' not found.`,
								404,
							);
						}

						// Create the combined trip
						const tripId: string =
							await this.idCounterService.generateId(
								EntityMap.TRIP,
								manager,
							);
						const arrivalTime = new Date(data.departureTime);
						const combinedTrip: Trip = new Trip(
							tripId,
							data.departureTime,
							arrivalTime,
							vehicle.driver,
							vehicle,
							null,
						);
						combinedTrip.stops = [];
						combinedTrip.tickets = [];
						combinedTrip.status = TripStatus.SCHEDULED;

						// Create trip stops
						for (const stop of data.tripStopOrders) {
							// Load the location
							const location: Location =
								await this.locationService.loadLocation(
									stop.location,
									manager,
								);

							if (stop.order !== 1) {
								const routeDetails: {
									distance: number;
									duration: number;
								} =
									await this.googleMapsService.estimateRouteDetails(
										combinedTrip.stops[stop.order - 2]
											.location,
										location,
									);

								// Update the trip arrival time
								combinedTrip.arrivalTime = new Date(
									combinedTrip.arrivalTime.getTime() +
										routeDetails.duration * 60 * 1000,
								);
							}

							// Create a new trip stop
							const tripStopId: string =
								await this.idCounterService.generateId(
									EntityMap.TRIP_STOP,
									manager,
								);
							const tripStop: TripStop = new TripStop(
								tripStopId,
								combinedTrip,
								stop.type,
								stop.order,
								location,
								combinedTrip.arrivalTime,
							);
							combinedTrip.stops.push(tripStop);
						}

						// Create trip tickets
						for (const bookingRequest of bookingRequests) {
							for (const passenger of bookingRequest.passengers) {
								// Create a new trip ticket
								const ticketId: string =
									await this.idCounterService.generateId(
										EntityMap.TRIP_TICKET,
										manager,
									);
								const tripTicket: TripTicket = new TripTicket(
									ticketId,
									passenger,
									bookingRequest,
									combinedTrip,
									combinedTrip.departureTime,
									combinedTrip.arrivalTime,
									bookingRequest.departureLocation,
									bookingRequest.arrivalLocation,
								);
								combinedTrip.tickets.push(tripTicket);
								bookingRequest.tickets.push(tripTicket);
							}
						}

						// Create the combined trip
						await this.tripRepository.create(combinedTrip, manager);

						// Create schedule for driver
						const scheduleId: string =
							await this.idCounterService.generateId(
								EntityMap.SCHEDULE,
								manager,
							);
						const schedule: Schedule = new Schedule(
							scheduleId,
							`Trip #${tripId}`,
							combinedTrip.departureTime,
							combinedTrip.arrivalTime,
							`Trip from ${combinedTrip.stops[0].location.name} to ${combinedTrip.stops[combinedTrip.stops.length - 1].location.name}.`,
							vehicle.driver,
							vehicle,
							combinedTrip,
							null,
							null,
						);
						await this.scheduleRepository.create(schedule, manager);

						// Update the combined trip
						await this.tripRepository.update(combinedTrip, manager);

						// Update booking requests
						for (const bookingRequest of bookingRequests) {
							bookingRequest.status = RequestStatus.APPROVED;
							await this.bookingRequestRepository.update(
								bookingRequest,
								manager,
							);

							// Send notification to the requester
							const approvedNotificationBody: NotificationBody =
								new NotificationBody(
									"Booking Request Approved",
									"BookingRequestApproved",
									{
										date: new Date(
											bookingRequest.departureTime,
										).toLocaleDateString("en-GB", {
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
										}),
									},
									bookingRequest.id,
									Priority.HIGH,
								);

							await this.notificationService.sendUserNotification(
								approvedNotificationBody,
								bookingRequest.requester.id,
								bookingRequest.requester.role.key,
								manager,
							);
						}

						// Fetch the created combined trip
						const createdCombinedTrip =
							await this.tripRepository.findOne(
								combinedTrip.id,
								manager,
							);
						if (!createdCombinedTrip) {
							throw new ApiError(
								`Failed to fetch created combined trip with ID '${combinedTrip.id}'.`,
								500,
							);
						}

						// Send notification to the driver
						const newTripNotificationBody: NotificationBody =
							new NotificationBody(
								"New Trip Assigned",
								"DriverNewTripAssigned",
								{
									date: new Date(
										createdCombinedTrip.departureTime,
									).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
									}),
									time: new Date(
										createdCombinedTrip.departureTime,
									).toLocaleTimeString("en-GB", {
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									}),
								},
								createdCombinedTrip.id,
								Priority.HIGH,
							);

						await this.notificationService.sendUserNotification(
							newTripNotificationBody,
							vehicle.driver!.id,
							RoleMap.DRIVER,
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.TRIP,
							combinedTrip.id,
							ActionType.CREATE,
							`User with ID '${currentUser.id}' created a combined trip with ID '${combinedTrip.id}'.`,
							manager,
						);

						// Transform the created combined trip to DTO
						const combinedTripResponseDto: DetailedTripResponseDto =
							plainToInstance(
								DetailedTripResponseDto,
								createdCombinedTrip,
								{
									excludeExtraneousValues: true,
								},
							);

						return combinedTripResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create combined trip.", 500, error);
		}
	}

	public async uncombineTrip(
		currentUser: CurrentUser,
		id: string,
	): Promise<void> {
		try {
			await AppDataSource.transaction(async (manager: EntityManager) => {
				// Get trip by ID
				const trip: Trip | null = await this.tripRepository.findOne(
					id,
					manager,
				);
				if (!trip) {
					throw new ApiError(`Trip with ID '${id}' not found.`, 404);
				}

				// Get all the booking request and change status to pending
				for (const tripTicket of trip.tickets) {
					tripTicket.bookingRequest.status = RequestStatus.PENDING;
					await this.bookingRequestRepository.update(
						tripTicket.bookingRequest,
						manager,
					);
				}

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.TRIP,
					trip.id,
					ActionType.DELETE,
					`User with ID '${currentUser.id}' uncombined trip with ID '${trip.id}'.`,
					manager,
				);

				// Delete the trip
				await this.tripRepository.delete(trip.id, manager);
			});
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to uncombine trip with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async getCombinableBookingRequests(
		currentUser: CurrentUser,
		id: string,
	): Promise<BookingRequestResponseDto[]> {
		try {
			const result: BookingRequestResponseDto[] =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Get the trip by I
						const trip: Trip | null =
							await this.tripRepository.findOne(id, manager);
						if (!trip) {
							throw new ApiError(
								`Trip with ID '${id}' not found.`,
								404,
							);
						}

						// Check if the trip is scheduled and has a vehicle assigned
						if (!trip.vehicle) {
							throw new ApiError(
								`Trip with ID '${id}' is not assigned to any vehicle to add booking requests.`,
								400,
							);
						}

						// Build the query for fetching booking request
						const query: Record<string, unknown> = {
							type: BookingRequestType.ONE_WAY,
							status: RequestStatus.PENDING,
							departureTimeFrom: Date.now(),
						};

						// Fetch all booking requests
						const bookingRequests: BookingRequest[] =
							await this.bookingRequestRepository.find(
								undefined,
								query,
								manager,
							);

						// Filter combinable booking requests
						const combinableBookingRequestsIds: string[] = [];
						for (const bookingRequest of bookingRequests) {
							if (
								bookingRequest.priority !== Priority.HIGH &&
								bookingRequest.departureTime.getDate() ===
									trip.departureTime.getDate() &&
								bookingRequest.arrivalTime.getDate() ===
									trip.arrivalTime.getDate() &&
								bookingRequest.numberOfPassengers +
									trip.tickets.length <=
									trip.vehicle.capacity
							) {
								let pickupOrder: number | null = null;
								let dropoffOrder: number | null = null;

								// Loop through trip stops ascending to find matching pickup location
								for (const stop of trip.stops) {
									if (
										stop.type === TripStopType.PICKUP &&
										stop.location.id ===
											bookingRequest.departureLocation.id
									) {
										pickupOrder = stop.order;
									}
								}

								// Loop through trip stops descending to find matching dropoff location
								for (const stop of trip.stops
									.slice()
									.reverse()) {
									if (
										stop.type === TripStopType.DROP_OFF &&
										stop.location.id ===
											bookingRequest.arrivalLocation.id
									) {
										dropoffOrder = stop.order;
									}
								}

								// Check if both pickup and dropoff orders are found
								if (
									pickupOrder &&
									dropoffOrder &&
									pickupOrder < dropoffOrder
								) {
									combinableBookingRequestsIds.push(
										bookingRequest.id,
									);
								}
							}
						}

						// Fetch combinable booking requests
						const combinableBookingRequests: BookingRequest[] = [];
						for (const bookingRequestId of combinableBookingRequestsIds) {
							const bookingRequest: BookingRequest | null =
								await this.bookingRequestRepository.findOne(
									bookingRequestId,
									manager,
								);
							if (!bookingRequest) {
								throw new ApiError(
									`Booking request with ID '${bookingRequestId}' not found.`,
									404,
								);
							}
							combinableBookingRequests.push(bookingRequest);
						}

						// Transform combinable booking requests to DTOs
						const combinableBookingRequestsDtos: BookingRequestResponseDto[] =
							plainToInstance(
								BookingRequestResponseDto,
								combinableBookingRequests,
								{ excludeExtraneousValues: true },
							);

						return combinableBookingRequestsDtos;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to retrieve combinable booking requests for trip with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async addBookingRequestToTrip(
		currentUser: CurrentUser,
		id: string,
		data: SelectBookingRequestDto,
	): Promise<DetailedTripResponseDto> {
		try {
			const result: DetailedTripResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Get the trip by I
						const trip: Trip | null =
							await this.tripRepository.findOne(id, manager);
						if (!trip) {
							throw new ApiError(
								`Trip with ID '${id}' not found.`,
								404,
							);
						}

						// Get booking request by ID
						const bookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								data.bookingRequestId,
								manager,
							);
						if (!bookingRequest) {
							throw new ApiError(
								`Booking request with ID '${data.bookingRequestId}' not found.`,
								404,
							);
						}

						// Create trip tickets for each passenger in the booking request
						for (const passenger of bookingRequest.passengers) {
							// Generate an ID for the new trip ticket
							const ticketId: string =
								await this.idCounterService.generateId(
									EntityMap.TRIP_TICKET,
									manager,
								);

							// Create a new trip ticket
							const tripTicket: TripTicket = new TripTicket(
								ticketId,
								passenger,
								bookingRequest,
								trip,
								bookingRequest.departureTime,
								bookingRequest.arrivalTime,
								bookingRequest.departureLocation,
								bookingRequest.arrivalLocation,
							);
							await this.tripTicketRepository.create(
								tripTicket,
								manager,
							);
							trip.tickets.push(tripTicket);
							bookingRequest.tickets.push(tripTicket);
						}

						// Update the trip
						await this.tripRepository.update(trip, manager);

						// Update the booking request
						bookingRequest.status = RequestStatus.APPROVED;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);

						// Send notification to the requester
						const approvedNotificationBody: NotificationBody =
							new NotificationBody(
								"Booking Request Approved",
								"BookingRequestApproved",
								{
									date: new Date(
										bookingRequest.departureTime,
									).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
									}),
								},
								bookingRequest.id,
								Priority.HIGH,
							);

						await this.notificationService.sendUserNotification(
							approvedNotificationBody,
							bookingRequest.requester.id,
							bookingRequest.requester.role.key,
							manager,
						);

						// Fetch the updated trip
						const updatedTrip = await this.tripRepository.findOne(
							trip.id,
							manager,
						);
						if (!updatedTrip) {
							throw new ApiError(
								`Failed to retrieve updated trip with ID '${trip.id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.TRIP,
							trip.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' added booking request with ID '${bookingRequest.id}' to trip with ID '${trip.id}'.`,
							manager,
						);

						// Transform the updated trip to DTO
						const updatedTripDto: DetailedTripResponseDto =
							plainToInstance(
								DetailedTripResponseDto,
								updatedTrip,
								{ excludeExtraneousValues: true },
							);

						return updatedTripDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to add booking request with ID ${data.bookingRequestId} to trip with ID ${id}.`,
						500,
						error,
					);
		}
	}

	public async removeBookingRequestFromTrip(
		currentUser: CurrentUser,
		id: string,
		data: SelectBookingRequestDto,
	): Promise<DetailedTripResponseDto> {
		try {
			const result: DetailedTripResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Get trip by ID
						const trip: Trip | null =
							await this.tripRepository.findOne(id, manager);
						if (!trip) {
							throw new ApiError(
								`Trip with ID '${id}' not found.`,
								404,
							);
						}

						// Get the booking request by ID
						const bookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								data.bookingRequestId,
								manager,
							);
						if (!bookingRequest) {
							throw new ApiError(
								`Booking request with ID '${data.bookingRequestId}' not found.`,
								404,
							);
						}

						// Delete trip tickets associated with the booking request
						for (const tripTicket of trip.tickets) {
							if (
								tripTicket.bookingRequest.id ===
								bookingRequest.id
							) {
								// Remove the trip ticket from the trip's tickets array
								trip.tickets = trip.tickets.filter(
									(ticket) => ticket.id !== tripTicket.id,
								);

								// Delete the trip ticket
								await this.tripTicketRepository.delete(
									tripTicket.id,
									manager,
								);
							}
						}

						// Delete trip stops that not associated with any trip tickets
						for (const stop of trip.stops) {
							let isStopUsed = false;
							for (const ticket of trip.tickets) {
								// Check if any ticket uses this stop as pickup
								if (
									stop.type === TripStopType.PICKUP &&
									stop.location.id ===
										ticket.departureLocation.id
								) {
									isStopUsed = true;
									break;
								}

								// Check if any ticket uses this stop as dropoff
								if (
									stop.type === TripStopType.DROP_OFF &&
									stop.location.id ===
										ticket.arrivalLocation.id
								) {
									isStopUsed = true;
									break;
								}
							}
							if (!isStopUsed) {
								// Remove the trip stop from the trip's stops array
								trip.stops = trip.stops.filter(
									(stop) => stop.id !== stop.id,
								);

								// Delete the trip stop
								await this.tripStopRepository.delete(
									stop.id,
									manager,
								);
							}
						}

						// Update the booking request status
						bookingRequest.status = RequestStatus.PENDING;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);

						// Fetch the updated trip
						const updatedTrip = await this.tripRepository.findOne(
							trip.id,
							manager,
						);
						if (!updatedTrip) {
							throw new ApiError(
								`Failed to retrieve updated trip with ID '${trip.id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.TRIP,
							trip.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' removed booking request with ID '${bookingRequest.id}' from trip with ID '${trip.id}'.`,
							manager,
						);

						// Transform the updated trip to DTO
						const updatedTripDto: DetailedTripResponseDto =
							plainToInstance(
								DetailedTripResponseDto,
								updatedTrip,
								{
									excludeExtraneousValues: true,
								},
							);

						return updatedTripDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to remove booking request with ID ${data.bookingRequestId} from trip with ID ${id}.`,
						500,
						error,
					);
		}
	}

	public async handleRemoveBookingRequestFromCombinedTrip(
		bookingRequest: BookingRequest,
		trip: Trip,
		manager: EntityManager,
	): Promise<void> {
		// Delete trip tickets associated with the booking request
		for (const tripTicket of trip.tickets) {
			if (tripTicket.bookingRequest.id === bookingRequest.id) {
				// Remove the trip ticket from the trip's tickets array
				trip.tickets = trip.tickets.filter(
					(ticket) => ticket.id !== tripTicket.id,
				);

				// Delete the trip ticket
				await this.tripTicketRepository.delete(tripTicket.id, manager);
			}
		}

		// Delete trip stops that not associated with any trip tickets
		for (const stop of trip.stops) {
			let isStopUsed = false;
			for (const ticket of trip.tickets) {
				// Check if any ticket uses this stop as pickup
				if (
					stop.type === TripStopType.PICKUP &&
					stop.location.id === ticket.departureLocation.id
				) {
					isStopUsed = true;
					break;
				}

				// Check if any ticket uses this stop as dropoff
				if (
					stop.type === TripStopType.DROP_OFF &&
					stop.location.id === ticket.arrivalLocation.id
				) {
					isStopUsed = true;
					break;
				}
			}
			if (!isStopUsed) {
				// Remove the trip stop from the trip's stops array
				trip.stops = trip.stops.filter((stop) => stop.id !== stop.id);

				// Delete the trip stop
				await this.tripStopRepository.delete(stop.id, manager);
			}
		}
	}

	public async approveSchedulingTrip(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto> {
		try {
			const result: DetailedTripResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch trip by ID
						const trip: Trip | null =
							await this.tripRepository.findOne(id, manager);
						if (!trip) {
							throw new ApiError(
								`Trip with ID '${id}' not found.`,
								404,
							);
						}

						// Check if the trip is scheduling
						if (trip.status !== TripStatus.SCHEDULING) {
							throw new ApiError(
								`Only scheduling trips can be approved.`,
								400,
							);
						}

						// Convert scheduling trip to scheduled trip
						const tripId: string =
							await this.idCounterService.generateId(
								EntityMap.TRIP,
								manager,
							);
						trip.id = tripId;
						trip.status = TripStatus.SCHEDULED;
						for (const ticket of trip.tickets) {
							ticket.trip = trip;
						}
						for (const stop of trip.stops) {
							stop.trip = trip;
						}
						await this.tripRepository.create(trip, manager);

						// Create a schedule for trip, driver, and vehicle
						const scheduleId: string =
							await this.idCounterService.generateId(
								EntityMap.SCHEDULE,
								manager,
							);
						const schedule: Schedule = new Schedule(
							scheduleId,
							`Trip #${trip.id}`,
							trip.departureTime,
							trip.arrivalTime,
							`Trip from ${trip.stops[0].location.name} to ${trip.stops[trip.stops.length - 1].location.name}.`,
							trip.driver,
							trip.vehicle,
							trip,
							null,
							null,
						);
						await this.scheduleRepository.create(schedule, manager);
						trip.schedule = schedule;
						await this.tripRepository.update(trip, manager);

						// Approve all associated booking requests
						const bookingRequestIds: string[] = [];
						for (const ticket of trip.tickets) {
							if (
								!bookingRequestIds.includes(
									ticket.bookingRequest.id,
								)
							) {
								bookingRequestIds.push(
									ticket.bookingRequest.id,
								);
							}
						}
						for (const bookingRequestId of bookingRequestIds) {
							const bookingRequest: BookingRequest | null =
								await this.bookingRequestRepository.findOne(
									bookingRequestId,
									manager,
								);
							if (!bookingRequest) {
								throw new ApiError(
									`Booking request with ID '${bookingRequestId}' not found.`,
									404,
								);
							}
							bookingRequest.status = RequestStatus.APPROVED;
							await this.bookingRequestRepository.update(
								bookingRequest,
								manager,
							);

							// Send notification to the requester
							const approvedNotificationBody: NotificationBody =
								new NotificationBody(
									"Booking Request Approved",
									"BookingRequestApproved",
									{
										date: new Date(
											bookingRequest.departureTime,
										).toLocaleDateString("en-GB", {
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
										}),
									},
									bookingRequest.id,
									Priority.HIGH,
								);

							await this.notificationService.sendUserNotification(
								approvedNotificationBody,
								bookingRequest.requester.id,
								bookingRequest.requester.role.key,
								manager,
							);
						}

						// Delete the temporary scheduling trip
						const temporaryTrip: Trip | null =
							await this.tripRepository.findOne(id, manager);
						if (!temporaryTrip) {
							throw new ApiError(
								`Temporary trip with ID '${id}' not found.`,
								404,
							);
						}
						temporaryTrip.tickets = [];
						temporaryTrip.stops = [];
						await this.tripRepository.update(
							temporaryTrip,
							manager,
						);
						await this.tripRepository.delete(
							temporaryTrip.id,
							manager,
						);

						// Fetch the approved trip
						const approvedTrip = await this.tripRepository.findOne(
							trip.id,
							manager,
						);
						if (!approvedTrip) {
							throw new ApiError(
								`Failed to fetch approved trip with ID '${trip.id}'.`,
								500,
							);
						}

						// Send notification to the driver
						const newTripNotificationBody: NotificationBody =
							new NotificationBody(
								"New Trip Assigned",
								"DriverNewTripAssigned",
								{
									date: new Date(
										approvedTrip.departureTime,
									).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
									}),
									time: new Date(
										approvedTrip.departureTime,
									).toLocaleTimeString("en-GB", {
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									}),
								},
								approvedTrip.id,
								Priority.HIGH,
							);

						await this.notificationService.sendUserNotification(
							newTripNotificationBody,
							approvedTrip.driver!.id,
							RoleMap.DRIVER,
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.TRIP,
							trip.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' approved scheduling trip with ID '${id}' and converted it to scheduled trip with ID '${trip.id}'.`,
							manager,
						);

						const approvedTripDto: DetailedTripResponseDto =
							plainToInstance(
								DetailedTripResponseDto,
								approvedTrip,
								{
									excludeExtraneousValues: true,
								},
							);

						return approvedTripDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to approve scheduling trip with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async driverConfirmTripStart(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto> {
		try {
			// Fetch trip by ID
			const trip: Trip | null = await this.tripRepository.findOne(id);
			if (!trip) {
				throw new ApiError(`Trip with ID '${id}' not found.`, 404);
			}

			// Validate trip status is scheduled
			if (!(trip.status === TripStatus.SCHEDULED)) {
				throw new ApiError("Only scheduled trips can be started.", 400);
			}

			// Validate matching driver with driver of the trip
			if (currentUser.role === RoleMap.DRIVER) {
				if (!trip.driver || trip.driver.id !== currentUser.id) {
					throw new ApiError(
						"You are not authorized to start this trip",
						403,
					);
				}
			} else {
				throw new ApiError(
					"Access denied: Unsupported user role.",
					403,
				);
			}

			const result = await AppDataSource.transaction(async (manager) => {
				// Update status to on going and capture departure time.
				trip.status = TripStatus.ON_GOING;
				trip.actualDepartureTime = new Date();

				// Update driver status
				trip.driver!.availability = DriverAvailability.ON_TRIP;
				await this.driverRepository.update(trip.driver!, manager);

				const updated = await this.tripRepository.update(trip, manager);
				if (!updated) {
					throw new ApiError("Failed to start trip", 500);
				}

				const updatedTrip: Trip | null =
					await this.tripRepository.findOne(id, manager);
				if (!updatedTrip) {
					throw new ApiError(
						"Failed to retrieve updated trip after starting it.",
						500,
					);
				}

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.TRIP,
					trip.id,
					ActionType.UPDATE,
					`Driver with ID '${currentUser.id}' started trip with ID '${trip.id}'.`,
					manager,
				);

				return updatedTrip;
			});

			const tripDto = this.mapTripToResponseDto(result);
			return tripDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to confirm trip start.", 500, error);
		}
	}

	public async driverConfirmEndTrip(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto> {
		try {
			const trip: Trip | null = await this.tripRepository.findOne(id);
			if (!trip) {
				throw new ApiError(`Trip with ID ${id} not found.`, 404);
			}

			if (trip.status !== TripStatus.ON_GOING) {
				throw new ApiError("Only started trips can be ended", 400);
			}

			if (trip.driver === null) {
				throw new ApiError(
					"This trip does not assigned to any driver",
					400,
				);
			}

			// Validate user is Driver
			if (currentUser.role === RoleMap.DRIVER) {
				if (trip.driver!.id !== currentUser.id) {
					throw new ApiError(
						"Unauthorized: This trip does not belong to your assigned vehicle.",
						403,
					);
				}
			} else {
				throw new ApiError(
					"Access denied: Unsupported user role.",
					403,
				);
			}

			const updatedTrip = await AppDataSource.transaction(
				async (manager) => {
					// Update trip status
					trip.status = TripStatus.COMPLETED;
					trip.actualArrivalTime = new Date();

					// Update driver status
					trip.driver!.availability = DriverAvailability.AVAILABLE;
					await this.driverRepository.update(trip.driver!, manager);

					// Update all booking request to completed
					// Filter out distinct booking requests from trip tickets
					const bookingRequestIds: string[] = [];
					for (const ticket of trip.tickets) {
						if (
							!bookingRequestIds.includes(
								ticket.bookingRequest.id,
							)
						) {
							bookingRequestIds.push(ticket.bookingRequest.id);
						}
					}

					// Start updating booking requests status to completed
					for (const bookingRequestId of bookingRequestIds) {
						const bookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								bookingRequestId,
								manager,
							);
						if (!bookingRequest) {
							throw new ApiError(
								`Booking request with ID '${bookingRequestId}' not found.`,
								404,
							);
						}
						bookingRequest.status = RequestStatus.COMPLETED;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);
					}

					// Update trip
					await this.tripRepository.update(trip, manager);

					const updatedTrip: Trip | null =
						await this.tripRepository.findOne(id, manager);
					if (!updatedTrip) {
						throw new ApiError(
							"Failed to retrieve updated trip after ending it.",
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.TRIP,
						trip.id,
						ActionType.UPDATE,
						`Driver with ID '${currentUser.id}' ended trip with ID '${trip.id}'.`,
						manager,
					);

					return updatedTrip;
				},
			);

			const tripResponseDto: DetailedTripResponseDto =
				this.mapTripToResponseDto(updatedTrip);

			return tripResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to confirm trip end.", 500, error);
		}
	}

	public async outsourcedConfirmTripStart(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto> {
		try {
			const trip: Trip | null = await this.tripRepository.findOne(id);
			if (!trip) {
				throw new ApiError(`Trip with ID ${id} not found.`, 404);
			}

			// Validate trip status is scheduled
			if (trip.status !== TripStatus.SCHEDULED) {
				throw new ApiError("Only scheduled trips can be started.", 400);
			}

			// Validate user is Anonymous and trip is outsourced
			if (currentUser.role === RoleMap.ANONYMOUS) {
				if (trip.outsourcedVehicle === null) {
					throw new ApiError(
						"Unauthorized: This trip does not belong to your assigned vehicle.",
						403,
					);
				}
			} else {
				throw new ApiError(
					"Access denied: Unsupported user role.",
					403,
				);
			}

			// Perform transaction
			const updatedTrip = await AppDataSource.transaction(
				async (manager) => {
					// Update trip status
					trip.status = TripStatus.ON_GOING;
					await this.tripRepository.update(trip, manager);

					// Update tickets
					for (const ticket of trip.tickets) {
						ticket.ticketStatus = TripTicketStatus.PICKED_UP;
						await this.tripTicketRepository.update(ticket, manager);
					}

					return trip;
				},
			);

			const tripResponseDto: DetailedTripResponseDto =
				this.mapTripToResponseDto(updatedTrip);

			return tripResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to confirm trip start.", 500, error);
		}
	}

	async outsourcedConfirmEndTrip(
		user: CurrentUser,
		tripId: string,
	): Promise<DetailedTripResponseDto> {
		try {
			const trip: Trip | null = await this.tripRepository.findOne(tripId);
			if (!trip) {
				throw new ApiError(`Trip with ID ${tripId} not found.`, 404);
			}

			if (trip.status !== TripStatus.ON_GOING) {
				throw new ApiError("Only started trips can be ended", 400);
			}

			// Validate user is Anonymous and trip is outsourced
			if (user.role === RoleMap.ANONYMOUS) {
				if (trip.outsourcedVehicle === null) {
					throw new ApiError(
						"Unauthorized: This trip does not belong to your assigned vehicle.",
						403,
					);
				}
			} else {
				throw new ApiError(
					"Access denied: Unsupported user role.",
					403,
				);
			}

			const updatedTrip = await AppDataSource.transaction(
				async (manager) => {
					// Update trip status
					trip.status = TripStatus.COMPLETED;
					trip.actualArrivalTime = new Date();
					await this.tripRepository.update(trip, manager);

					// Update tickets
					for (const ticket of trip.tickets) {
						ticket.ticketStatus = TripTicketStatus.DROPPED_OFF;
						await this.tripTicketRepository.update(ticket, manager);
					}

					// Update stops
					for (const stop of trip.stops) {
						stop.actualArrivalTime = trip.actualDepartureTime;
						await this.tripStopRepository.update(stop, manager);
					}

					// Update all booking request to completed
					// Filter out distinct booking requests from trip tickets
					const bookingRequestIds: string[] = [];
					for (const ticket of trip.tickets) {
						if (
							!bookingRequestIds.includes(
								ticket.bookingRequest.id,
							)
						) {
							bookingRequestIds.push(ticket.bookingRequest.id);
						}
					}

					// Start updating booking requests status to completed
					for (const bookingRequestId of bookingRequestIds) {
						const bookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								bookingRequestId,
								manager,
							);
						if (!bookingRequest) {
							throw new ApiError(
								`Booking request with ID '${bookingRequestId}' not found.`,
								404,
							);
						}
						bookingRequest.status = RequestStatus.COMPLETED;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);
					}

					return trip;
				},
			);

			const tripResponseDto: DetailedTripResponseDto =
				this.mapTripToResponseDto(updatedTrip);

			return tripResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to confirm trip end.", 500, error);
		}
	}

	private mapTripToResponseDto(trip: Trip): DetailedTripResponseDto {
		// Base trip mapping
		const tripDto = plainToInstance(DetailedTripResponseDto, trip, {
			excludeExtraneousValues: true,
		});

		// For each stop find its matching passengers
		const stops = trip.stops.map((stop) => {
			const matchingTickets = trip.tickets.filter((ticket) => {
				// only check departure if the type is pickup
				if (stop.type === TripStopType.PICKUP) {
					return ticket.departureLocation?.id === stop.location?.id;
				}
				// check arrival if the type is drop off
				if (stop.type === TripStopType.DROP_OFF) {
					return ticket.arrivalLocation?.id === stop.location?.id;
				}
				return false;
			});

			const tickets = matchingTickets.map((ticket) => {
				return plainToInstance(BasicTripTicketResponseDto, ticket, {
					excludeExtraneousValues: true,
				});
			});

			const stopDto = plainToInstance(TripStopResponseDto, stop, {
				excludeExtraneousValues: true,
			});
			stopDto.tickets = tickets;

			return stopDto;
		});

		tripDto.stops = stops;
		return tripDto;
	}

	public async generatePublicUrl(id: string): Promise<PublicTripAccessDto> {
		const access = await AppDataSource.transaction(async (manager) => {
			// Remove any existing public access for this trip
			await this.publicTripAccessRepository.deleteByTripId(id, manager);

			// Load the trip with the given ID
			const trip: Trip = await this.tripRepository.findById(id, manager);

			// Ensure the trip is using an outsourced vehicle
			if (!trip.outsourcedVehicle) {
				throw new ApiError(
					"Public access is only allowed for trips with outsourced vehicles.",
					400,
				);
			}

			// Create and save a new public access entry
			const newAccess = new PublicTripAccess(
				trip,
				trip.departureTime,
				trip.arrivalTime,
			);
			const saved = await this.publicTripAccessRepository.create(
				newAccess,
				manager,
			);

			newAccess.code = saved.code;
			return newAccess;
		});

		// Map the entity to a public-facing DTO
		return plainToInstance(PublicTripAccessDto, access, {
			excludeExtraneousValues: true,
		});
	}

	public async getPublicUrl(id: string): Promise<PublicTripAccessDto> {
		// Look up existing public access by trip ID
		const access = await this.publicTripAccessRepository.findByTripId(id);

		// Map to DTO
		return plainToInstance(PublicTripAccessDto, access, {
			excludeExtraneousValues: true,
		});
	}

	public async getDriverCurrentLocation(
		id: string,
	): Promise<DriverCurrentLocationDto> {
		try {
			const trip: Trip = await this.tripRepository.findById(id);

			if (trip.driverCurrentLocation === null) {
				throw new ApiError("Driver has not started yet.", 400);
			}

			const driverCurrentLocation = plainToInstance(
				DriverCurrentLocationDto,
				trip,
				{
					excludeExtraneousValues: true,
				},
			);

			return driverCurrentLocation;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to retrieve driver's current location.",
						500,
						error,
					);
		}
	}

	public async updateDriverCurrentLocation(
		currentUser: CurrentUser,
		id: string,
		data: UpdateDriverCurrentLocationDto,
	): Promise<DriverCurrentLocationDto> {
		try {
			const trip: Trip = await this.tripRepository.findById(id);

			if (!trip.driver) {
				throw new ApiError(
					"This trip is not assigned to any driver.",
					403,
				);
			}

			if (trip.driver.id !== currentUser.id) {
				throw new ApiError(
					"Access denied: You are not assigned to this trip.",
					403,
				);
			}

			if (trip.status !== TripStatus.ON_GOING) {
				throw new ApiError(
					"Location can only be updated during an ongoing trip.",
					400,
				);
			}

			const result = await AppDataSource.transaction(async (manager) => {
				if (!trip.driverCurrentLocation) {
					const locationId = await this.idCounterService.generateId(
						EntityMap.LOCATION,
						manager,
					);

					const location = new Location(
						locationId,
						LocationType.REALTIME,
						data.name,
						data.address,
						data.latitude,
						data.longitude,
					);
					trip.driverCurrentLocation = location;
				} else {
					trip.driverCurrentLocation.name = data.name;
					trip.driverCurrentLocation.address = data.address;
					trip.driverCurrentLocation.latitude = data.latitude;
					trip.driverCurrentLocation.longitude = data.longitude;
				}

				await this.tripRepository.update(trip, manager);
				return trip;
			});

			const driverCurrentLocation = plainToInstance(
				DriverCurrentLocationDto,
				result,
				{
					excludeExtraneousValues: true,
				},
			);

			return driverCurrentLocation;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to update driver's current location.",
						500,
						error,
					);
		}
	}

	public async createTripByOptimizerResult(
		result: TripOptimizerResultDto,
		manager: EntityManager,
	): Promise<Trip> {
		// 1) Validate input
		const requestIds = Array.from(
			new Set(result.combined_request_ids || []),
		);
		if (!requestIds.length) {
			throw new ApiError(
				"Optimizer result has no booking request IDs.",
				400,
			);
		}

		// 2) Load booking requests in this transaction
		const bookingRequests =
			await this.bookingRequestRepository.findManyByIds(
				requestIds,
				manager,
			);

		if (!bookingRequests.length) {
			throw new ApiError(
				"No booking requests found for optimizer result.",
				404,
			);
		}

		// 3) Optional vehicle
		let vehicle: Vehicle | null = null;
		if (result.vehicle_id) {
			try {
				vehicle = await this.vehicleRepository.findOne(
					result.vehicle_id,
				);
			} catch {
				/* ignore if not found */
			}
		}

		// 4) Create the trip
		const tripId = await this.idCounterService.generateId(
			"trip_temp",
			manager,
		);
		const trip = new Trip(
			tripId,
			result.trip_start_time,
			result.trip_end_time,
			vehicle?.driver ?? null,
			vehicle ?? null,
			null,
		);
		trip.status = TripStatus.SCHEDULING;

		// 5) Build quick lookup tables for matching route points to booking requests
		const key = (lat: number, lng: number) =>
			`${lat.toFixed(6)},${lng.toFixed(6)}`;

		const pkByLocId = new Map<string, BookingRequest[]>();
		const dpByLocId = new Map<string, BookingRequest[]>();
		const pkByLatLng = new Map<string, BookingRequest[]>();
		const dpByLatLng = new Map<string, BookingRequest[]>();

		for (const br of bookingRequests) {
			const pkId = br.departureLocation.id;
			const dpId = br.arrivalLocation.id;
			(pkByLocId.get(pkId) ?? pkByLocId.set(pkId, []).get(pkId))!.push(
				br,
			);
			(dpByLocId.get(dpId) ?? dpByLocId.set(dpId, []).get(dpId))!.push(
				br,
			);

			const pkLL = key(
				br.departureLocation.latitude,
				br.departureLocation.longitude,
			);
			const dpLL = key(
				br.arrivalLocation.latitude,
				br.arrivalLocation.longitude,
			);
			(pkByLatLng.get(pkLL) ?? pkByLatLng.set(pkLL, []).get(pkLL))!.push(
				br,
			);
			(dpByLatLng.get(dpLL) ?? dpByLatLng.set(dpLL, []).get(dpLL))!.push(
				br,
			);
		}

		const picked = new Set<string>();
		const dropped = new Set<string>();

		type StopRow = {
			type: "pickup" | "dropoff";
			when: Date;
			location: Location;
			delta: number;
		};

		const stopsData: StopRow[] = [];

		// 6) Copy EXACT order from route; skip "start"; calculate realistic timing
		let currentTime = result.trip_start_time;
		let previousLocation: Location | null = null;

		for (const pt of result.route || []) {
			if (pt.type === "start") {
				// Set the starting location for route calculations
				const startLocation = new Location(
					"start",
					LocationType.CUSTOM,
					"Start Point",
					"",
					pt.latitude,
					pt.longitude,
				);
				previousLocation = startLocation;
				continue;
			}

			const matchList = (() => {
				// Prefer location_id if provided; else fallback to lat/lng match
				if (pt.type === "pickup") {
					if (pt.location_id && pkByLocId.has(pt.location_id))
						return pkByLocId.get(pt.location_id)!;
					return pkByLatLng.get(key(pt.latitude, pt.longitude)) || [];
				} else {
					if (pt.location_id && dpByLocId.has(pt.location_id))
						return dpByLocId.get(pt.location_id)!;
					return dpByLatLng.get(key(pt.latitude, pt.longitude)) || [];
				}
			})();

			// Filter out BRs already processed for this leg
			const fresh: BookingRequest[] = matchList.filter((br) =>
				pt.type === "pickup" ? !picked.has(br.id) : !dropped.has(br.id),
			);
			if (!fresh.length) continue;

			const deltaAbs = fresh.reduce(
				(sum, br) => sum + br.numberOfPassengers,
				0,
			);

			// Calculate arrival time using Google Maps
			let estimatedArrivalTime = currentTime;

			if (previousLocation) {
				const currentLocation =
					fresh[0][
						pt.type === "pickup"
							? "departureLocation"
							: "arrivalLocation"
					];

				try {
					const routeDetails =
						await this.googleMapsService.estimateRouteDetails(
							previousLocation,
							currentLocation,
						);

					// Add travel time to current time
					estimatedArrivalTime = new Date(
						currentTime.getTime() +
							routeDetails.duration * 60 * 1000,
					);
				} catch (error: unknown) {
					logger.error(
						`Failed to calculate route details for stop ${pt.type}:`,
						error,
					);
					// Fallback: use optimizer's time or add 10 minutes buffer
					estimatedArrivalTime =
						pt.estimated_arrival_time ??
						new Date(currentTime.getTime() + 10 * 60 * 1000);
				}
			}

			// Use the calculated time or fallback to optimizer/booking request time
			const when = estimatedArrivalTime;

			if (pt.type === "pickup") {
				for (const br of fresh) {
					picked.add(br.id);
				}
				stopsData.push({
					type: "pickup",
					when,
					location: fresh[0].departureLocation,
					delta: deltaAbs,
				});
				previousLocation = fresh[0].departureLocation;
			} else {
				for (const br of fresh) {
					dropped.add(br.id);
				}
				stopsData.push({
					type: "dropoff",
					when,
					location: fresh[0].arrivalLocation,
					delta: -deltaAbs,
				});
				previousLocation = fresh[0].arrivalLocation;
			}

			// Update current time for next iteration (add some buffer for passenger boarding/alighting)
			currentTime = new Date(when.getTime() + 5 * 60 * 1000); // 5 min buffer
		}

		// 7) Create TripStops in the same order; compute currentCapacity as we go
		const stopIds = await this.idCounterService.generateIds(
			"trip_stop",
			stopsData.length,
			manager,
		);
		let order = 1;
		trip.stops = stopsData.map((s, i) => {
			return new TripStop(
				stopIds[i],
				trip,
				s.type === "pickup"
					? TripStopType.PICKUP
					: TripStopType.DROP_OFF,
				order++,
				s.location,
				s.when,
			);
		});

		// 8) Create tickets for all passengers in all BRs
		const paxCount = bookingRequests.reduce(
			(sum, br) => sum + br.passengers.length,
			0,
		);
		const ticketIds = await this.idCounterService.generateIds(
			"trip_ticket",
			paxCount,
			manager,
		);
		const tickets: TripTicket[] = [];
		let t = 0;
		for (const br of bookingRequests) {
			for (const passenger of br.passengers) {
				tickets.push(
					new TripTicket(
						ticketIds[t++],
						passenger,
						br,
						trip,
						br.departureTime,
						br.arrivalTime,
						br.departureLocation,
						br.arrivalLocation,
					),
				);
			}
		}
		trip.tickets = tickets;

		// 9) Persist (cascade)
		await this.tripRepository.create(trip, manager);

		// 11) Return fully-loaded trip
		const createdTrip: Trip | null = await this.tripRepository.findOne(
			trip.id,
			manager,
		);
		if (!createdTrip) {
			throw new ApiError(`Failed to retrieve created trip.`, 500);
		}
		return createdTrip;
	}
}

export default TripService;
