import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import BookingRequest from "../database/entities/BookingRequest";
import OneWayBookingRequest from "../database/entities/OneWayBookingRequest";
import RoundTripBookingRequest from "../database/entities/RoundTripBookingRequest";
import User from "../database/entities/User";
import Location from "../database/entities/Location";
import Driver from "../database/entities/Driver";
import Vehicle from "../database/entities/Vehicle";
import OutsourcedVehicle from "../database/entities/OutsourcedVehicle";
import Trip from "../database/entities/Trip";
import TripTicket from "../database/entities/TripTicket";
import Schedule from "../database/entities/Schedule";
import Priority from "../database/enums/Priority";
import BookingRequestType from "../database/enums/BookingRequestType";
import RequestStatus from "../database/enums/RequestStatus";
import UserStatus from "../database/enums/UserStatus";
import TripStatus from "../database/enums/TripStatus";
import TripTicketStatus from "../database/enums/TripTicketStatus";
import VehicleAvailability from "../database/enums/VehicleAvailability";
import ActionType from "../database/enums/ActionType";
import BookingRequestRepository from "../repositories/booking-request.repository";
import TripRepository from "../repositories/trip.repository";
import TripTicketRepository from "../repositories/trip-ticket.repository";
import DriverRepository from "../repositories/driver.repository";
import VehicleRepository from "../repositories/vehicle.repository";
import OutsourcedVehicleRepository from "../repositories/outsourced-vehicle.repository";
import ScheduleRepository from "../repositories/schedule.repository";
import IBookingRequestService from "./interfaces/IBookingRequestService";
import IdCounterService from "./id-counter.service";
import UserService from "./user.service";
import LocationService from "./location.service";
import TripService from "./trip.service";
import TripOptimizerService from "./trip-optimizer.service";
import NotificationService from "./notification.service";
import ActivityLogService from "./activity-log.service";
import BookingRequestResponseDto from "../dtos/booking-request/booking-request-response.dto";
import CreateBookingRequestDto from "../dtos/booking-request/create-booking-request.dto";
import UpdateBookingRequestDto from "../dtos/booking-request/update-booking-request.dto";
import RejectBookingRequestDto from "../dtos/booking-request/reject-booking-request.dto";
import CancelBookingRequestDto from "../dtos/booking-request/cancel-booking-request.dto";
import SelectVehicleDto from "../dtos/vehicle/select-vehicle.dto";
import CreateOutsourcedVehicleDto from "../dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import DetailedVehicleResponseDto from "../dtos/vehicle/detailed-vehicle-response.dto";
import NotificationBody from "../dtos/notification/notification-body.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class BookingRequestService implements IBookingRequestService {
	constructor(
		private readonly bookingRequestRepository: BookingRequestRepository,
		private readonly tripRepository: TripRepository,
		private readonly tripTicketRepository: TripTicketRepository,
		private readonly driverRepository: DriverRepository,
		private readonly vehicleRepository: VehicleRepository,
		private readonly outsourcedVehicleRepository: OutsourcedVehicleRepository,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly idCounterService: IdCounterService,
		private readonly userService: UserService,
		private readonly locationService: LocationService,
		private readonly tripService: TripService,
		private readonly tripOptimizationService: TripOptimizerService,
		private readonly notificationService: NotificationService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getBookingRequests(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<BookingRequestResponseDto[]> {
		try {
			// Employee role can only see their own booking requests
			if (currentUser.role === RoleMap.EMPLOYEE) {
				query.requesterId = currentUser.id;
			}

			// Fetch booking requests
			const bookingRequests: BookingRequest[] =
				await this.bookingRequestRepository.find(pagination, query);

			// Transform booking requests to DTOs
			const bookingRequestDtos: BookingRequestResponseDto[] =
				plainToInstance(BookingRequestResponseDto, bookingRequests, {
					excludeExtraneousValues: true,
				});

			return bookingRequestDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch booking requests.", 500, error);
		}
	}

	public async getBookingRequestById(
		currentUser: CurrentUser,
		id: string,
	): Promise<BookingRequestResponseDto> {
		try {
			// Fetch booking request by ID
			const bookingRequest: BookingRequest | null =
				await this.bookingRequestRepository.findOne(id);
			if (!bookingRequest) {
				throw new ApiError(
					`Booking request with ID '${id}' not found.`,
					404,
				);
			}

			// Employee role can only see their own booking requests
			if (
				currentUser.role === RoleMap.EMPLOYEE &&
				bookingRequest.requester.id !== currentUser.id &&
				!bookingRequest.passengers
					.map((passenger) => passenger.id)
					.includes(currentUser.id)
			) {
				throw new ApiError(
					`User is not authorized to access this booking request.`,
					403,
				);
			}

			// Transform booking request to DTO
			const bookingRequestDto: BookingRequestResponseDto =
				plainToInstance(BookingRequestResponseDto, bookingRequest, {
					excludeExtraneousValues: true,
				});

			return bookingRequestDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch booking request with ID '${id}.'`,
						500,
						error,
					);
		}
	}

	public async createBookingRequest(
		currentUser: CurrentUser,
		data: CreateBookingRequestDto,
	): Promise<BookingRequestResponseDto[]> {
		try {
			const result: BookingRequestResponseDto[] =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						const bookingRequests: BookingRequest[] = [];

						if (data.type === BookingRequestType.ONE_WAY) {
							// Create a one-way booking request
							const bookingRequestId: string =
								await this.idCounterService.generateId(
									EntityMap.BOOKING_REQUEST,
									manager,
								);
							const newBookingRequest: OneWayBookingRequest =
								await this.createOneWayBookingRequest(
									currentUser,
									bookingRequestId,
									data,
									manager,
								);
							await this.bookingRequestRepository.create(
								newBookingRequest,
								manager,
							);
							bookingRequests.push(newBookingRequest);
						} else if (
							data.type === BookingRequestType.ROUND_TRIP
						) {
							if (!data.isReserved) {
								// Create two one-way booking requests for the round trip
								const bookingRequestIds: string[] =
									await this.idCounterService.generateIds(
										EntityMap.BOOKING_REQUEST,
										2,
										manager,
									);
								const newBookingRequests: OneWayBookingRequest[] =
									await this.createRoundTripBookingRequest(
										currentUser,
										bookingRequestIds,
										data,
										manager,
									);
								for (const newBookingRequest of newBookingRequests) {
									await this.bookingRequestRepository.create(
										newBookingRequest,
										manager,
									);
									bookingRequests.push(newBookingRequest);
								}
							} else {
								// Create a reserved round trip booking request
								const bookingRequestId: string =
									await this.idCounterService.generateId(
										EntityMap.BOOKING_REQUEST,
										manager,
									);
								const newBookingRequest: RoundTripBookingRequest =
									await this.createReservedRoundTripBookingRequest(
										currentUser,
										bookingRequestId,
										data,
										manager,
									);
								await this.bookingRequestRepository.create(
									newBookingRequest,
									manager,
								);
								bookingRequests.push(newBookingRequest);
							}
						}

						// Process created booking requests based on priority
						for (const bookingRequest of bookingRequests) {
							// Fetch created booking request
							const createdBookingRequest: BookingRequest | null =
								await this.bookingRequestRepository.findOne(
									bookingRequest.id,
									manager,
								);
							if (!createdBookingRequest) {
								throw new ApiError(
									`Failed to fetch created booking request with id ${bookingRequest.id}.`,
									500,
								);
							}

							if (
								createdBookingRequest.priority === Priority.HIGH
							) {
								// Optimize high priority booking request immediately
								await this.tripOptimizationService.optimizeHighPriorityBookingRequest(
									createdBookingRequest.id,
									manager,
								);

								// Send notification to admin and coordinator about new VIP booking request
								const notificationBody: NotificationBody =
									new NotificationBody(
										"New VIP Booking Request",
										"NewVipBookingRequest",
										{
											employeeName:
												bookingRequest.requester.name,
											departureDate: new Date(
												bookingRequest.departureTime,
											).toLocaleDateString("en-GB", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
											}),
											departureTime: new Date(
												bookingRequest.departureTime,
											).toLocaleTimeString("en-GB", {
												hour: "2-digit",
												minute: "2-digit",
												hour12: false,
											}),
										},
										bookingRequest.id,
										Priority.HIGH,
									);
								await this.notificationService.sendCoordinatorAndAdminNotification(
									notificationBody,
									manager,
								);
							} else {
								// Check if the booking request is urgent (less than 24 hours to departure)
								if (
									createdBookingRequest.departureTime.getTime() -
										Date.now() <=
									24 * 60 * 60 * 1000
								) {
									// Set priority to urgent and optimize immediately
									createdBookingRequest.priority =
										Priority.URGENT;
									await this.bookingRequestRepository.update(
										createdBookingRequest,
										manager,
									);
									await this.tripOptimizationService.optimizeNormalBookingRequest(
										createdBookingRequest.id,
										manager,
									);

									// Send notification to admin and coordinator about new urgent booking request
									const notificationBody: NotificationBody =
										new NotificationBody(
											"New Urgent Booking Request",
											"NewUrgentBookingRequest",
											{
												employeeName:
													bookingRequest.requester
														.name,
												departureDate: new Date(
													bookingRequest.departureTime,
												).toLocaleDateString("en-GB", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
												}),
												departureTime: new Date(
													bookingRequest.departureTime,
												).toLocaleTimeString("en-GB", {
													hour: "2-digit",
													minute: "2-digit",
													hour12: false,
												}),
											},
											bookingRequest.id,
											Priority.URGENT,
										);
									await this.notificationService.sendCoordinatorAndAdminNotification(
										notificationBody,
										manager,
									);
								} else {
									// Send notification to admin and coordinator about new normal booking request
									const notificationBody: NotificationBody =
										new NotificationBody(
											"New Booking Request",
											"NewBookingRequest",
											{
												employeeName:
													bookingRequest.requester
														.name,
											},
											bookingRequest.id,
											Priority.NORMAL,
										);

									await this.notificationService.sendCoordinatorAndAdminNotification(
										notificationBody,
										manager,
									);
								}
							}
						}

						// Fetch all created booking requests
						const createdBookingRequests: BookingRequest[] = [];
						for (const bookingRequest of bookingRequests) {
							const createdBookingRequest: BookingRequest | null =
								await this.bookingRequestRepository.findOne(
									bookingRequest.id,
									manager,
								);
							if (!createdBookingRequest) {
								throw new ApiError(
									`Failed to fetch created booking request with id ${bookingRequest.id}.`,
									500,
								);
							}
							createdBookingRequests.push(createdBookingRequest);

							// Log the activity
							await this.activityLogService.createActivityLog(
								currentUser,
								EntityMap.BOOKING_REQUEST,
								createdBookingRequest.id,
								ActionType.CREATE,
								`User with ID '${currentUser.id}' created booking request with ID '${createdBookingRequest.id}'.`,
								manager,
							);
						}

						// Transform booking requests to DTOs
						const bookingRequestDtos: BookingRequestResponseDto[] =
							plainToInstance(
								BookingRequestResponseDto,
								createdBookingRequests,
								{
									excludeExtraneousValues: true,
								},
							);

						return bookingRequestDtos;
					},
				);
			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create booking request.", 500, error);
		}
	}

	private async createOneWayBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: CreateBookingRequestDto,
		manager: EntityManager,
	): Promise<OneWayBookingRequest> {
		// Get the requester by ID
		const requester: User = await this.userService.loadUserById(
			currentUser.id,
			manager,
		);

		// Get the passengers by IDs
		const passengers: User[] = await this.userService.loadUsersByIds(
			data.passengerIds,
			manager,
		);

		// Get the departure location
		const departureLocation: Location =
			await this.locationService.loadLocation(
				data.departureLocation,
				manager,
			);

		// Get the arrival location
		const arrivalLocation: Location =
			await this.locationService.loadLocation(
				data.arrivalLocation,
				manager,
			);

		// Create the booking request
		const newBookingRequest: OneWayBookingRequest =
			new OneWayBookingRequest(
				id,
				data.priority,
				data.numberOfPassengers,
				requester,
				passengers,
				data.contactName,
				data.contactPhoneNumber,
				data.departureTime,
				data.arrivalTime,
				departureLocation,
				arrivalLocation,
				data.tripPurpose,
				data.note,
			);

		return newBookingRequest;
	}

	private async createRoundTripBookingRequest(
		currentUser: CurrentUser,
		ids: string[],
		data: CreateBookingRequestDto,
		manager: EntityManager,
	): Promise<OneWayBookingRequest[]> {
		// Get the requester by ID
		const requester: User = await this.userService.loadUserById(
			currentUser.id,
			manager,
		);

		// Get the passengers by IDs
		const passengers: User[] = await this.userService.loadUsersByIds(
			data.passengerIds,
			manager,
		);

		// Get the departure location
		const departureLocation: Location =
			await this.locationService.loadLocation(
				data.departureLocation,
				manager,
			);

		// Get the arrival location
		const arrivalLocation: Location =
			await this.locationService.loadLocation(
				data.arrivalLocation,
				manager,
			);

		// Get the return departure location
		const returnDepartureLocation: Location =
			await this.locationService.loadLocation(
				data.returnDepartureLocation!,
				manager,
			);

		// Get the return arrival location
		const returnArrivalLocation: Location =
			await this.locationService.loadLocation(
				data.returnArrivalLocation!,
				manager,
			);

		// Create the booking requests
		const startBookingRequest: OneWayBookingRequest =
			new OneWayBookingRequest(
				ids[0],
				data.priority,
				data.numberOfPassengers,
				requester,
				passengers,
				data.contactName,
				data.contactPhoneNumber,
				data.departureTime,
				data.arrivalTime,
				departureLocation,
				arrivalLocation,
				data.tripPurpose,
				data.note,
			);
		const returnBookingRequest: OneWayBookingRequest =
			new OneWayBookingRequest(
				ids[1],
				data.priority,
				data.numberOfPassengers,
				requester,
				passengers,
				data.contactName,
				data.contactPhoneNumber,
				data.returnDepartureTime!,
				data.returnArrivalTime!,
				returnDepartureLocation,
				returnArrivalLocation,
				data.tripPurpose,
				data.note,
			);

		return [startBookingRequest, returnBookingRequest];
	}

	private async createReservedRoundTripBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: CreateBookingRequestDto,
		manager: EntityManager,
	): Promise<RoundTripBookingRequest> {
		// Get the requester by ID
		const requester: User = await this.userService.loadUserById(
			currentUser.id,
			manager,
		);

		// Get the passengers by IDs
		const passengers: User[] = await this.userService.loadUsersByIds(
			data.passengerIds,
			manager,
		);

		// Get the departure location
		const departureLocation: Location =
			await this.locationService.loadLocation(
				data.departureLocation,
				manager,
			);

		// Get the arrival location
		const arrivalLocation: Location =
			await this.locationService.loadLocation(
				data.arrivalLocation,
				manager,
			);

		// Get the return departure location
		const returnDepartureLocation: Location =
			await this.locationService.loadLocation(
				data.returnDepartureLocation!,
				manager,
			);

		// Get the return arrival location
		const returnArrivalLocation: Location =
			await this.locationService.loadLocation(
				data.returnArrivalLocation!,
				manager,
			);

		// Create the booking request
		const newBookingRequest: RoundTripBookingRequest =
			new RoundTripBookingRequest(
				id,
				data.priority,
				data.numberOfPassengers,
				requester,
				passengers,
				data.contactName,
				data.contactPhoneNumber,
				data.departureTime,
				data.arrivalTime,
				departureLocation,
				arrivalLocation,
				data.returnDepartureTime!,
				data.returnArrivalTime!,
				returnDepartureLocation,
				returnArrivalLocation,
				data.isReserved!,
				data.tripPurpose,
				data.note,
			);

		return newBookingRequest;
	}

	public async updateBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: UpdateBookingRequestDto,
	): Promise<BookingRequestResponseDto> {
		try {
			const result: BookingRequestResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch booking request by ID
						const bookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								id,
								manager,
							);
						if (!bookingRequest) {
							throw new ApiError(
								`Booking request with ID '${id}' not found.`,
								404,
							);
						}

						// Employee role can only update their own booking requests
						if (
							currentUser.role === RoleMap.EMPLOYEE &&
							bookingRequest.requester.id !== currentUser.id
						) {
							throw new ApiError(
								`User with ID '${currentUser.id}' is not authorized to update this booking request.`,
								403,
							);
						}

						// Update the booking request with the new data
						if (data.tripPurpose !== undefined) {
							bookingRequest.tripPurpose = data.tripPurpose;
						}
						if (data.priority !== undefined) {
							bookingRequest.priority = data.priority;
						}
						if (data.numberOfPassengers !== undefined) {
							bookingRequest.numberOfPassengers =
								data.numberOfPassengers;
						}
						if (data.passengerIds !== undefined) {
							bookingRequest.passengers =
								await this.userService.loadUsersByIds(
									data.passengerIds,
									manager,
								);
						}
						if (data.note !== undefined) {
							bookingRequest.note = data.note;
						}
						if (data.contactName !== undefined) {
							bookingRequest.contactName = data.contactName;
						}
						if (data.contactPhoneNumber !== undefined) {
							bookingRequest.contactPhoneNumber =
								data.contactPhoneNumber;
						}
						if (data.departureTime !== undefined) {
							bookingRequest.departureTime = data.departureTime;
						}
						if (data.arrivalTime !== undefined) {
							bookingRequest.arrivalTime = data.arrivalTime;
						}
						if (data.departureLocation !== undefined) {
							bookingRequest.departureLocation =
								await this.locationService.loadLocation(
									data.departureLocation,
									manager,
								);
						}
						if (data.arrivalLocation !== undefined) {
							bookingRequest.arrivalLocation =
								await this.locationService.loadLocation(
									data.arrivalLocation,
									manager,
								);
						}
						if (bookingRequest instanceof RoundTripBookingRequest) {
							if (data.returnDepartureTime !== undefined) {
								bookingRequest.returnDepartureTime =
									data.returnDepartureTime;
							}
							if (data.returnArrivalTime !== undefined) {
								bookingRequest.returnArrivalTime =
									data.returnArrivalTime;
							}
							if (data.returnDepartureLocation !== undefined) {
								bookingRequest.returnDepartureLocation =
									await this.locationService.loadLocation(
										data.returnDepartureLocation,
										manager,
									);
							}
							if (data.returnArrivalLocation !== undefined) {
								bookingRequest.returnArrivalLocation =
									await this.locationService.loadLocation(
										data.returnArrivalLocation,
										manager,
									);
							}
						}
						bookingRequest.status = RequestStatus.PENDING;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);

						// Handle associated trips if any
						if (bookingRequest.tickets.length > 0) {
							const tripIds: string[] = [];
							for (const ticket of bookingRequest.tickets) {
								if (!tripIds.includes(ticket.trip.id)) {
									tripIds.push(ticket.trip.id);
								}
							}

							for (const tripId of tripIds) {
								// Fetch the associated trip
								const trip: Trip | null =
									await this.tripRepository.findOne(
										tripId,
										manager,
									);
								if (!trip) {
									throw new ApiError(
										`Failed to fetch associated trip with ID '${tripId}'.`,
										404,
									);
								}

								// Check if the trip is a combined trip
								let isCombinedTrip = false;
								for (const ticket of trip.tickets) {
									if (
										ticket.bookingRequest.id !==
										bookingRequest.id
									) {
										isCombinedTrip = true;
										break;
									}
								}

								if (
									trip.status === TripStatus.SCHEDULING ||
									!isCombinedTrip
								) {
									// If the trip is still scheduling or not a combined trip, delete the trip
									await this.tripRepository.delete(
										trip.id,
										manager,
									);
								} else {
									// If the trip is a scheduled combined trip, remove the booking request from the trip
									await this.tripService.handleRemoveBookingRequestFromCombinedTrip(
										bookingRequest,
										trip,
										manager,
									);
								}
							}
						}

						// Process updated booking requests based on priority
						const existingBookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								bookingRequest.id,
								manager,
							);
						if (!existingBookingRequest) {
							throw new ApiError(
								`Failed to fetch existing booking request with ID '${bookingRequest.id}'.`,
								404,
							);
						}
						if (existingBookingRequest.priority === Priority.HIGH) {
							// Optimize high priority booking request immediately
							await this.tripOptimizationService.optimizeHighPriorityBookingRequest(
								existingBookingRequest.id,
								manager,
							);

							// Send notification to admin and coordinator about updated VIP booking request
							const notification: NotificationBody =
								new NotificationBody(
									"VIP Booking Request Updated",
									"VipBookingRequestUpdated",
									{
										bookingRequestId:
											existingBookingRequest.id,
									},
									existingBookingRequest.id,
									Priority.HIGH,
								);

							await this.notificationService.sendCoordinatorAndAdminNotification(
								notification,
								manager,
							);
						} else {
							// Check if the booking request is urgent (less than 24 hours to departure)
							if (
								existingBookingRequest.departureTime.getTime() -
									Date.now() <=
								24 * 60 * 60 * 1000
							) {
								// Set priority to urgent and optimize immediately
								existingBookingRequest.priority =
									Priority.URGENT;
								await this.bookingRequestRepository.update(
									existingBookingRequest,
									manager,
								);
								await this.tripOptimizationService.optimizeNormalBookingRequest(
									existingBookingRequest.id,
									manager,
								);

								// Send notification to admin and coordinator about updated urgent booking request
								const notification: NotificationBody =
									new NotificationBody(
										"Urgent Booking Request Updated",
										"UrgentBookingRequestUpdated",
										{
											bookingRequestId:
												existingBookingRequest.id,
										},
										existingBookingRequest.id,
										Priority.URGENT,
									);

								await this.notificationService.sendCoordinatorAndAdminNotification(
									notification,
									manager,
								);
							} else {
								// Send notification to admin and coordinator about updated normal booking request
								const notification: NotificationBody =
									new NotificationBody(
										"Booking Request Updated",
										"BookingRequestUpdated",
										{
											bookingRequestId:
												existingBookingRequest.id,
										},
										existingBookingRequest.id,
										Priority.NORMAL,
									);

								await this.notificationService.sendCoordinatorAndAdminNotification(
									notification,
									manager,
								);
							}
						}

						// Fetch the updated booking request
						const updatedBookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								bookingRequest.id,
								manager,
							);
						if (!updatedBookingRequest) {
							throw new ApiError(
								`Failed to fetch updated booking request with ID '${bookingRequest.id}'.`,
								404,
							);
						}

						if (currentUser.role === RoleMap.COORDINATOR) {
							// Send notification to requester about updated booking request
							const notification: NotificationBody =
								new NotificationBody(
									"Booking Request Modified by Coordinator",
									"BookingRequestModifiedByCoordinator",
									{
										date: new Date(),
									},
									bookingRequest.id,
									Priority.HIGH,
								);

							// Send to requester first
							await this.notificationService.sendUserNotification(
								notification,
								bookingRequest.requester.id,
								"employee",
								manager,
							);
						}

						// Transform the updated booking request to DTO
						const bookingRequestDto: BookingRequestResponseDto =
							plainToInstance(
								BookingRequestResponseDto,
								updatedBookingRequest,
								{
									excludeExtraneousValues: true,
								},
							);

						return bookingRequestDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update booking request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async rejectBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: RejectBookingRequestDto,
	): Promise<BookingRequestResponseDto> {
		try {
			const result: BookingRequestResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the booking request by ID
						const bookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								id,
								manager,
							);
						if (!bookingRequest) {
							throw new ApiError(
								`Booking request with ID '${id}' not found.`,
								404,
							);
						}

						// User can only reject pending booking requests
						if (bookingRequest.status !== RequestStatus.PENDING) {
							throw new ApiError(
								`User can only reject pending booking requests.`,
								403,
							);
						}

						// Update the booking request status to rejected
						bookingRequest.status = RequestStatus.REJECTED;
						bookingRequest.rejectReason = data.reason;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);

						// Handle associated trips if any
						if (bookingRequest.tickets.length > 0) {
							const tripIds: string[] = [];
							for (const ticket of bookingRequest.tickets) {
								if (!tripIds.includes(ticket.trip.id)) {
									tripIds.push(ticket.trip.id);
								}
							}

							for (const tripId of tripIds) {
								// Fetch the associated trip
								const trip: Trip | null =
									await this.tripRepository.findOne(
										tripId,
										manager,
									);
								if (!trip) {
									throw new ApiError(
										`Failed to fetch associated trip with ID '${tripId}'.`,
										404,
									);
								}

								// Check if the trip is a combined trip
								let isCombinedTrip = false;
								for (const ticket of trip.tickets) {
									if (
										ticket.bookingRequest.id !==
										bookingRequest.id
									) {
										isCombinedTrip = true;
										break;
									}
								}

								if (
									trip.status === TripStatus.SCHEDULING ||
									!isCombinedTrip
								) {
									// If the trip is still scheduling or not a combined trip, delete the trip
									await this.tripRepository.delete(
										trip.id,
										manager,
									);
								} else {
									// If the trip is a scheduled combined trip, remove the booking request from the trip
									await this.tripService.handleRemoveBookingRequestFromCombinedTrip(
										bookingRequest,
										trip,
										manager,
									);
								}
							}
						}

						// Fetch the rejected booking request
						const rejectedBookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								bookingRequest.id,
								manager,
							);
						if (!rejectedBookingRequest) {
							throw new ApiError(
								`Failed to fetch rejected booking request with ID '${bookingRequest.id}'.`,
								404,
							);
						}

						// Send notification to requester about rejected booking request
						const notification = new NotificationBody(
							"Booking Request Rejected",
							"BookingRequestRejected",
							{ date: bookingRequest.departureTime },
							bookingRequest.id,
							Priority.HIGH,
						);
						await this.notificationService.sendUserNotification(
							notification,
							bookingRequest.requester.id,
							bookingRequest.requester.role.key,
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.BOOKING_REQUEST,
							rejectedBookingRequest.id,
							ActionType.REJECT,
							`User with ID '${currentUser.id}' rejected booking request with ID '${rejectedBookingRequest.id}'.`,
							manager,
						);

						// Transform the rejected booking request to DTO
						const bookingRequestDto: BookingRequestResponseDto =
							plainToInstance(
								BookingRequestResponseDto,
								rejectedBookingRequest,
								{
									excludeExtraneousValues: true,
								},
							);

						return bookingRequestDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to reject booking request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async cancelBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: CancelBookingRequestDto,
	): Promise<BookingRequestResponseDto> {
		try {
			const result: BookingRequestResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the booking request by ID
						const bookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								id,
								manager,
							);
						if (!bookingRequest) {
							throw new ApiError(
								`Booking request with ID ${id} not found.`,
								404,
							);
						}

						// Employee role can only cancel their own booking requests
						if (
							currentUser.role === RoleMap.EMPLOYEE &&
							bookingRequest.requester.id !== currentUser.id
						) {
							throw new ApiError(
								`User is not authorized to cancel this booking request.`,
								403,
							);
						}

						// Update the booking request status to cancelled
						bookingRequest.status = RequestStatus.CANCELLED;
						bookingRequest.cancelReason = data.reason;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);

						if (bookingRequest.tickets.length > 0) {
							// Update associated trip tickets status to cancelled if any
							for (const ticket of bookingRequest.tickets) {
								ticket.ticketStatus =
									TripTicketStatus.CANCELLED;
								await this.tripTicketRepository.update(
									ticket,
									manager,
								);
							}

							// Update associated trip status to cancelled if all tickets are cancelled
							const trip: Trip | null =
								await this.tripRepository.findOne(
									bookingRequest.tickets[0].trip.id,
									manager,
								);
							if (!trip) {
								throw new ApiError(
									`Failed to fetch associated trip with ID '${bookingRequest.tickets[0].trip.id}'.`,
									404,
								);
							}
							let allTicketsCancelled = true;
							for (const ticket of trip.tickets) {
								if (
									ticket.ticketStatus !==
									TripTicketStatus.CANCELLED
								) {
									allTicketsCancelled = false;
									break;
								}
							}
							if (allTicketsCancelled) {
								trip.status = TripStatus.CANCELLED;
								await this.tripRepository.update(trip, manager);

								// Delete associated schedule if any
								if (trip.schedule) {
									await this.scheduleRepository.delete(
										trip.schedule.id,
										manager,
									);
								}
							}
						}

						// Fetch the cancelled booking request
						const cancelledBookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								bookingRequest.id,
								manager,
							);
						if (!cancelledBookingRequest) {
							throw new ApiError(
								`Failed to fetch cancelled booking request with ID '${bookingRequest.id}'.`,
								404,
							);
						}

						if (currentUser.role === RoleMap.COORDINATOR) {
							// Send notification to requester about cancelled booking request
							const notification = new NotificationBody(
								"Booking Request Cancelled by Coordinator",
								"BookingRequestCancelledByCoordinator",
								{ date: bookingRequest.createdAt },
								bookingRequest.id,
								Priority.HIGH,
							);

							await this.notificationService.sendUserNotification(
								notification,
								bookingRequest.requester.id,
								"employee",
								manager,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.BOOKING_REQUEST,
							cancelledBookingRequest.id,
							ActionType.CANCEL,
							`User with ID '${currentUser.id}' cancelled booking request with ID '${cancelledBookingRequest.id}'.`,
							manager,
						);

						// Transform the cancelled booking request to DTO
						const bookingRequestDto: BookingRequestResponseDto =
							plainToInstance(
								BookingRequestResponseDto,
								cancelledBookingRequest,
								{
									excludeExtraneousValues: true,
								},
							);

						return bookingRequestDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to cancel booking request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async deleteBookingRequest(
		currentUser: CurrentUser,
		id: string,
	): Promise<void> {
		try {
			await AppDataSource.transaction(async (manager: EntityManager) => {
				// Fetch the booking request by ID
				const bookingRequest: BookingRequest | null =
					await this.bookingRequestRepository.findOne(id, manager);
				if (!bookingRequest) {
					throw new ApiError(
						`Booking request with ID '${id}' not found.`,
						404,
					);
				}

				// User can only delete pending, cancelled, or rejected booking requests
				if (
					bookingRequest.status !== RequestStatus.PENDING &&
					bookingRequest.status !== RequestStatus.CANCELLED &&
					bookingRequest.status !== RequestStatus.REJECTED
				) {
					throw new ApiError(
						`User can only delete pending, cancelled, or rejected booking requests.`,
						403,
					);
				}

				// Handle associated trips if any
				if (bookingRequest.tickets.length > 0) {
					const tripIds: string[] = [];
					for (const ticket of bookingRequest.tickets) {
						if (!tripIds.includes(ticket.trip.id)) {
							tripIds.push(ticket.trip.id);
						}
					}

					for (const tripId of tripIds) {
						// Fetch the associated trip
						const trip: Trip | null =
							await this.tripRepository.findOne(tripId, manager);
						if (!trip) {
							throw new ApiError(
								`Failed to fetch associated trip with ID '${tripId}'.`,
								404,
							);
						}

						// Check if the trip is a combined trip
						let isCombinedTrip = false;
						for (const ticket of trip.tickets) {
							if (
								ticket.bookingRequest.id !== bookingRequest.id
							) {
								isCombinedTrip = true;
								break;
							}
						}

						if (
							trip.status === TripStatus.SCHEDULING ||
							!isCombinedTrip
						) {
							// If the trip is still scheduling or not a combined trip, delete the trip
							await this.tripRepository.delete(trip.id, manager);
						} else {
							// If the trip is a scheduled combined trip, remove the booking request from the trip
							await this.tripService.handleRemoveBookingRequestFromCombinedTrip(
								bookingRequest,
								trip,
								manager,
							);
						}
					}
				}

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.BOOKING_REQUEST,
					bookingRequest.id,
					ActionType.DELETE,
					`User with ID '${currentUser.id}' deleted booking request with ID '${bookingRequest.id}'.`,
					manager,
				);

				// Delete the booking request
				await this.bookingRequestRepository.delete(id, manager);
			});
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to delete booking request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async getAvailableVehiclesForBookingRequest(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedVehicleResponseDto[]> {
		try {
			const result: DetailedVehicleResponseDto[] =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the booking request by ID
						const bookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								id,
								manager,
							);
						if (!bookingRequest) {
							throw new ApiError(
								`Booking request with ID '${id}' not found.`,
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
								driver.vehicle.capacity >=
									bookingRequest.numberOfPassengers
							) {
								// Check driver's schedules
								if (driver.schedules.length === 0) {
									availableVehicleIds.push(driver.vehicle.id);
								} else {
									// Get the start and end time of the booking request
									let startTime: Date;
									let endTime: Date;
									if (
										bookingRequest instanceof
										RoundTripBookingRequest
									) {
										startTime =
											bookingRequest.departureTime;
										endTime =
											bookingRequest.returnArrivalTime;
									} else {
										startTime =
											bookingRequest.departureTime;
										endTime = bookingRequest.arrivalTime;
									}

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
						`Failed to fetch available vehicles for booking request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async assignVehicleToBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: SelectVehicleDto,
	): Promise<BookingRequestResponseDto> {
		try {
			const result: BookingRequestResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						if (!data.vehicleId) {
							throw new ApiError(
								`Vehicle ID is required to assign a vehicle to a booking request.`,
								400,
							);
						}

						// Fetch the booking request by ID
						const bookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								id,
								manager,
							);
						if (!bookingRequest) {
							throw new ApiError(
								`Booking request with ID '${id}' not found.`,
								404,
							);
						}

						// Handle booking request's associated trips if any
						if (bookingRequest.tickets.length > 0) {
							const tripIds: string[] = [];
							for (const ticket of bookingRequest.tickets) {
								if (!tripIds.includes(ticket.trip.id)) {
									tripIds.push(ticket.trip.id);
								}
							}

							for (const tripId of tripIds) {
								// Fetch the associated trip
								const trip: Trip | null =
									await this.tripRepository.findOne(
										tripId,
										manager,
									);
								if (!trip) {
									throw new ApiError(
										`Failed to fetch associated trip with ID '${tripId}'.`,
										404,
									);
								}

								// Check if the trip is a combined trip
								let isCombinedTrip = false;
								for (const ticket of trip.tickets) {
									if (
										ticket.bookingRequest.id !==
										bookingRequest.id
									) {
										isCombinedTrip = true;
										break;
									}
								}

								if (
									trip.status === TripStatus.SCHEDULING ||
									!isCombinedTrip
								) {
									// If the trip is still scheduling or not a combined trip, delete the trip
									await this.tripRepository.delete(
										trip.id,
										manager,
									);
								} else {
									// If the trip is a scheduled combined trip, remove the booking request from the trip
									await this.tripService.handleRemoveBookingRequestFromCombinedTrip(
										bookingRequest,
										trip,
										manager,
									);
								}
							}
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
						const startTime: Date = bookingRequest.departureTime;
						const endTime: Date =
							bookingRequest instanceof RoundTripBookingRequest
								? bookingRequest.returnArrivalTime
								: bookingRequest.arrivalTime;
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
											`Vehicle with ID '${vehicle.id}' has a scheduled trip with ID '${trip.id}'. Please reassign or cancel the trip before assigning the vehicle to the booking request.`,
											403,
										);
									}
								}
							}
						}

						// Create trip(s) based on the booking request
						const tripTickets: TripTicket[] =
							await this.tripService.createScheduledTripFromBookingRequest(
								bookingRequest,
								vehicle,
								manager,
							);

						// Update the booking request status
						bookingRequest.status = RequestStatus.APPROVED;
						bookingRequest.tickets = tripTickets;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);

						// Fetch the assigned booking request
						const assignedBookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								bookingRequest.id,
								manager,
							);
						if (!assignedBookingRequest) {
							throw new ApiError(
								`Failed to fetch assigned booking request with ID '${bookingRequest.id}'.`,
								404,
							);
						}

						// Send notification to driver about new trip assigned
						const tripAssignedNotification: NotificationBody =
							new NotificationBody(
								"Driver new trip assigned",
								"DriverNewTripAssigned",
								{
									date: assignedBookingRequest.departureTime.toLocaleDateString(
										"en-GB",
										{
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
										},
									),
									time: assignedBookingRequest.departureTime.toLocaleTimeString(
										"en-GB",
										{
											hour: "2-digit",
											minute: "2-digit",
											hour12: false,
										},
									),
								},
								tripTickets[0].trip.id,
								Priority.HIGH,
							);
						await this.notificationService.sendUserNotification(
							tripAssignedNotification,
							vehicle.driver!.id,
							"driver",
							manager,
						);

						// Send notification for requester about approved booking request
						const approvedRequestNotification: NotificationBody =
							new NotificationBody(
								"Booking request approved",
								"BookingRequestApproved",
								{
									date: new Date(
										assignedBookingRequest.departureTime,
									).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
									}),
								},
								assignedBookingRequest.id,
								Priority.HIGH,
							);
						await this.notificationService.sendUserNotification(
							approvedRequestNotification,
							assignedBookingRequest.requester.id,
							assignedBookingRequest.requester.role.key,
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.BOOKING_REQUEST,
							assignedBookingRequest.id,
							ActionType.APPROVE,
							`User with ID '${currentUser.id}' assigned vehicle with ID '${vehicle.id}' to booking request with ID '${assignedBookingRequest.id}'.`,
							manager,
						);

						// Transform the assigned booking request to DTO
						const assignedBookingRequestDto: BookingRequestResponseDto =
							plainToInstance(
								BookingRequestResponseDto,
								assignedBookingRequest,
								{
									excludeExtraneousValues: true,
								},
							);

						return assignedBookingRequestDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to assign vehicle with ID '${data.vehicleId}' to booking request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async assignOutsourcedVehicleToBookingRequest(
		currentUser: CurrentUser,
		bookingRequestId: string,
		data: CreateOutsourcedVehicleDto,
	): Promise<BookingRequestResponseDto> {
		try {
			const result: BookingRequestResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the booking request by ID
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

						// Handle associated trips if any
						if (bookingRequest.tickets.length > 0) {
							const tripIds: string[] = [];
							for (const ticket of bookingRequest.tickets) {
								if (!tripIds.includes(ticket.trip.id)) {
									tripIds.push(ticket.trip.id);
								}
							}

							for (const tripId of tripIds) {
								// Fetch the associated trip
								const trip: Trip | null =
									await this.tripRepository.findOne(
										tripId,
										manager,
									);
								if (!trip) {
									throw new ApiError(
										`Failed to fetch associated trip with ID '${tripId}'.`,
										404,
									);
								}

								// Check if the trip is a combined trip
								let isCombinedTrip = false;
								for (const ticket of trip.tickets) {
									if (
										ticket.bookingRequest.id !==
										bookingRequest.id
									) {
										isCombinedTrip = true;
										break;
									}
								}

								if (
									trip.status === TripStatus.SCHEDULING ||
									!isCombinedTrip
								) {
									// If the trip is still scheduling or not a combined trip, delete the trip
									await this.tripRepository.delete(
										trip.id,
										manager,
									);
								} else {
									// If the trip is a scheduled combined trip, remove the booking request from the trip
									await this.tripService.handleRemoveBookingRequestFromCombinedTrip(
										bookingRequest,
										trip,
										manager,
									);
								}
							}
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

						// Create trip(s) based on the booking request
						const tripTickets: TripTicket[] =
							await this.tripService.createScheduledTripFromBookingRequest(
								bookingRequest,
								outsourcedVehicle,
								manager,
							);

						// Update the trip's total cost if provided
						if (data.cost) {
							const trip: Trip | null =
								await this.tripRepository.findOne(
									tripTickets[0].trip.id,
									manager,
								);
							if (!trip) {
								throw new ApiError(
									`Failed to fetch trip with ID '${tripTickets[0].trip.id}'.`,
									404,
								);
							}
							trip.totalCost += data.cost;
							await this.tripRepository.update(trip, manager);
						}

						// Update the booking request status
						bookingRequest.status = RequestStatus.APPROVED;
						bookingRequest.tickets = tripTickets;
						await this.bookingRequestRepository.update(
							bookingRequest,
							manager,
						);

						// Fetch the assigned booking request
						const assignedBookingRequest: BookingRequest | null =
							await this.bookingRequestRepository.findOne(
								bookingRequest.id,
								manager,
							);
						if (!assignedBookingRequest) {
							throw new ApiError(
								`Failed to fetch assigned booking request with ID '${bookingRequest.id}'.`,
								404,
							);
						}

						// Send notification for requester about approved booking request
						const approvedRequestNotification: NotificationBody =
							new NotificationBody(
								"Booking request approved",
								"BookingRequestApproved",
								{
									date: new Date(
										assignedBookingRequest.departureTime,
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
							approvedRequestNotification,
							assignedBookingRequest.requester.id,
							assignedBookingRequest.requester.role.key,
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.BOOKING_REQUEST,
							assignedBookingRequest.id,
							ActionType.APPROVE,
							`User with ID '${currentUser.id}' assigned outsourced vehicle with ID '${outsourcedVehicle.id}' to booking request with ID '${assignedBookingRequest.id}'.`,
							manager,
						);

						// Transform the assigned booking request to DTO
						const assignedBookingRequestDto: BookingRequestResponseDto =
							plainToInstance(
								BookingRequestResponseDto,
								assignedBookingRequest,
								{
									excludeExtraneousValues: true,
								},
							);

						return assignedBookingRequestDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to assign outsourced vehicle to booking request with ID '${bookingRequestId}'.`,
						500,
						error,
					);
		}
	}
}

export default BookingRequestService;
