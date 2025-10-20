import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import TripTicket from "../database/entities/TripTicket";
import BookingRequest from "../database/entities/BookingRequest";
import Trip from "../database/entities/Trip";
import TripTicketStatus from "../database/enums/TripTicketStatus";
import TripStatus from "../database/enums/TripStatus";
import ActionType from "../database/enums/ActionType";
import TripTicketRepository from "../repositories/trip-ticket.repository";
import BookingRequestRepository from "../repositories/booking-request.repository";
import TripRepository from "../repositories/trip.repository";
import ITripTicketService from "./interfaces/ITripTicketService";
import ActivityLogService from "./activity-log.service";
import DetailedTripTicketResponseDto from "../dtos/trip-ticket/detailed-trip-ticket-response.dto";
import NoShowReasonDto from "../dtos/trip-ticket/no-show-reason.dto";
import BasicUserResponseDto from "../dtos/user/basic-user-response.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class TripTicketService implements ITripTicketService {
	constructor(
		private readonly tripTicketRepository: TripTicketRepository,
		private readonly bookingRequestRepository: BookingRequestRepository,
		private readonly tripRepository: TripRepository,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getTripTickets(
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedTripTicketResponseDto[]> {
		try {
			// Fetch trip tickets
			const tripTickets: TripTicket[] =
				await this.tripTicketRepository.find(pagination, query);

			// Transform trip tickets to DTOs
			const tripTicketResponseDtos: DetailedTripTicketResponseDto[] =
				plainToInstance(DetailedTripTicketResponseDto, tripTickets, {
					excludeExtraneousValues: true,
				});

			return tripTicketResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch trip tickets.", 500, error);
		}
	}

	public async getTicketById(
		id: string,
	): Promise<DetailedTripTicketResponseDto> {
		try {
			// Fetch trip ticket by ID
			const tripTicket: TripTicket | null =
				await this.tripTicketRepository.findOne(id);
			if (!tripTicket) {
				throw new ApiError(
					`Trip ticket with ID '${id}' not found.`,
					404,
				);
			}

			// Transform trip ticket to DTO
			const tripTicketResponseDto: DetailedTripTicketResponseDto =
				plainToInstance(DetailedTripTicketResponseDto, tripTicket, {
					excludeExtraneousValues: true,
				});

			return tripTicketResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch trip ticket with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async confirmPickUp(
		currentUser: CurrentUser,
		bookingRequestId: string,
		tripId: string,
	): Promise<DetailedTripTicketResponseDto[]> {
		try {
			// Fetch booking request by ID and trip ID
			const bookingRequest: BookingRequest | null =
				await this.bookingRequestRepository.findOneByBookingRequestIdAndTripId(
					bookingRequestId,
					tripId,
				);
			if (!bookingRequest) {
				throw new ApiError(
					`Booking request with ID '${bookingRequestId}' for trip with ID '${tripId}' not found.`,
					404,
				);
			}

			// Validate tickets
			if (!bookingRequest || bookingRequest.tickets.length === 0) {
				throw new ApiError(
					`Booking request with ID '${bookingRequestId}' has no tickets to confirm pickup.`,
					400,
				);
			}

			// Find the trip linked to the first ticket
			const firstTicket: TripTicket = bookingRequest.tickets[0];
			const trip: Trip = await this.tripRepository.findByTripTicketId(
				firstTicket.id,
			);

			// Validate driver's permission
			if (!trip.driver || trip.driver.id !== currentUser.id) {
				throw new ApiError(
					"You are not authorized to confirm pickup for this trip.",
					403,
				);
			}

			// Validate trip status
			if (trip.status !== TripStatus.ON_GOING) {
				throw new ApiError(
					`Pickup cannot be confirmed. The trip is currently marked as '${trip.status}'.`,
					400,
				);
			}

			// Update all tickets
			await AppDataSource.transaction(async (manager: EntityManager) => {
				for (const ticket of bookingRequest.tickets) {
					ticket.ticketStatus = TripTicketStatus.PICKED_UP;
					this.tripTicketRepository.update(ticket, manager);
				}

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.TRIP,
					trip.id,
					ActionType.UPDATE,
					`User with ID '${currentUser.id}' confirmed pickup for booking request with ID '${bookingRequestId}' on trip with ID '${tripId}'.`,
					manager,
				);
			});

			// Transform trip tickets to DTOs
			const tripTicketResponseDtos: DetailedTripTicketResponseDto[] =
				plainToInstance(
					DetailedTripTicketResponseDto,
					bookingRequest.tickets,
					{
						excludeExtraneousValues: true,
					},
				);

			return tripTicketResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to confirm pickup for trip with ID '${tripId}'.`,
						500,
						error,
					);
		}
	}

	public async confirmPassengersNoShow(
		currentUser: CurrentUser,
		bookingRequestId: string,
		tripId: string,
		data: NoShowReasonDto,
	): Promise<DetailedTripTicketResponseDto[]> {
		try {
			// Fetch booking request by ID and trip ID
			const bookingRequest: BookingRequest | null =
				await this.bookingRequestRepository.findOneByBookingRequestIdAndTripId(
					bookingRequestId,
					tripId,
				);
			if (!bookingRequest) {
				throw new ApiError(
					`Booking request with ID '${bookingRequestId}' for trip with ID '${tripId}' not found.`,
					404,
				);
			}

			// Validate tickets
			if (!bookingRequest || bookingRequest.tickets.length === 0) {
				throw new ApiError(
					`No valid tickets found for booking request with ID '${bookingRequestId}'.`,
					400,
				);
			}

			// Find the trip linked to the first ticket
			const firstTicket: TripTicket = bookingRequest.tickets[0];
			const trip: Trip = await this.tripRepository.findByTripTicketId(
				firstTicket.id,
			);

			// Validate driver's permission
			if (!trip.driver || trip.driver.id !== currentUser.id) {
				throw new ApiError(
					"You are not authorized to mark absence for this group of passengers.",
					403,
				);
			}

			// Validate trip status
			if (trip.status !== TripStatus.ON_GOING) {
				throw new ApiError(
					`Cannot confirm absence. The trip is currently marked as "${trip.status}".`,
					400,
				);
			}

			// Update all tickets
			await AppDataSource.transaction(async (manager) => {
				for (const ticket of bookingRequest.tickets) {
					ticket.ticketStatus = TripTicketStatus.NO_SHOW;
					ticket.noShowReason = data.reason;
					this.tripTicketRepository.update(ticket, manager);
				}

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.TRIP,
					trip.id,
					ActionType.UPDATE,
					`User with ID '${currentUser.id}' confirmed absence for booking request with ID '${bookingRequestId}' on trip with ID '${tripId}'.`,
					manager,
				);
			});

			// Transform trip tickets to DTOs
			const tripTicketResponseDtos: DetailedTripTicketResponseDto[] =
				plainToInstance(
					DetailedTripTicketResponseDto,
					bookingRequest.tickets,
					{
						excludeExtraneousValues: true,
					},
				);

			return tripTicketResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to confirm passenger absence for trip with ID '${tripId}'.`,
						500,
						error,
					);
		}
	}

	public async confirmDroppedOff(
		currentUser: CurrentUser,
		bookingRequestId: string,
		tripId: string,
	): Promise<DetailedTripTicketResponseDto[]> {
		try {
			// Fetch booking request by ID and trip ID
			const bookingRequest: BookingRequest | null =
				await this.bookingRequestRepository.findOneByBookingRequestIdAndTripId(
					bookingRequestId,
					tripId,
				);
			if (!bookingRequest) {
				throw new ApiError(
					`Booking request with ID '${bookingRequestId}' for trip with ID '${tripId}' not found.`,
					404,
				);
			}

			// Validate tickets
			if (!bookingRequest || bookingRequest.tickets.length === 0) {
				throw new ApiError(
					`No valid tickets found for booking request with ID '${bookingRequestId}'.`,
					400,
				);
			}

			// Find the trip from the first ticket (all tickets belong to the same trip)
			const firstTicket: TripTicket = bookingRequest.tickets[0];
			const trip: Trip = await this.tripRepository.findByTripTicketId(
				firstTicket.id,
			);

			// Validate driver's permission
			if (!trip.driver || trip.driver.id !== currentUser.id) {
				throw new ApiError(
					"You are not authorized to confirm drop-off for this trip.",
					403,
				);
			}

			// Check trip status
			if (trip.status !== TripStatus.ON_GOING) {
				throw new ApiError(
					`Cannot confirm drop-off. The trip is currently marked as '${trip.status}'.`,
					400,
				);
			}

			// Mark all associated tickets as DROPPED_OFF
			await AppDataSource.transaction(async (manager) => {
				for (const ticket of bookingRequest.tickets) {
					ticket.ticketStatus = TripTicketStatus.DROPPED_OFF;
					this.tripTicketRepository.update(ticket, manager);
				}

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.TRIP,
					trip.id,
					ActionType.UPDATE,
					`User with ID '${currentUser.id}' confirmed drop-off for booking request with ID '${bookingRequestId}' on trip with ID '${tripId}'.`,
					manager,
				);
			});

			// Transform trip tickets to DTOs
			const tripTicketResponseDto: DetailedTripTicketResponseDto[] =
				plainToInstance(
					DetailedTripTicketResponseDto,
					bookingRequest.tickets,
					{
						excludeExtraneousValues: true,
					},
				);

			return tripTicketResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to confirm drop-off for trip with ID '${tripId}'.`,
						500,
						error,
					);
		}
	}

	public async getPassengerInformation(
		currentUser: CurrentUser,
		id: string,
	): Promise<BasicUserResponseDto> {
		try {
			// Fetch trip ticket by ID
			const tripTicket: TripTicket | null =
				await this.tripTicketRepository.findOne(id);
			if (!tripTicket) {
				throw new ApiError(
					`Trip ticket with ID '${id}' not found.`,
					404,
				);
			}

			// Validate driver's permission
			if (
				!tripTicket.trip.driver ||
				tripTicket.trip.driver.id !== currentUser.id
			) {
				throw new ApiError(
					"You are not authorized to view passenger information for this trip.",
					403,
				);
			}

			// Transform user to DTO
			const userResponseDto: BasicUserResponseDto = plainToInstance(
				BasicUserResponseDto,
				tripTicket.user,
				{
					excludeExtraneousValues: true,
				},
			);

			return userResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch passenger information for ticket with ID '${id}'.`,
						500,
						error,
					);
		}
	}
}

export default TripTicketService;
