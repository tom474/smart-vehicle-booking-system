import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import TripFeedback from "../database/entities/TripFeedback";
import User from "../database/entities/User";
import Trip from "../database/entities/Trip";
import Priority from "../database/enums/Priority";
import TripStatus from "../database/enums/TripStatus";
import ActionType from "../database/enums/ActionType";
import TripFeedbackRepository from "../repositories/trip-feedback.repository";
import UserRepository from "../repositories/user.repository";
import TripRepository from "../repositories/trip.repository";
import ITripFeedbackService from "./interfaces/ITripFeedbackService";
import IdCounterService from "./id-counter.service";
import NotificationService from "./notification.service";
import ActivityLogService from "./activity-log.service";
import TripFeedbackResponseDto from "../dtos/trip-feedback/trip-feedback-response.dto";
import CreateTripFeedbackDto from "../dtos/trip-feedback/create-trip-feedback.dto";
import NotificationBody from "../dtos/notification/notification-body.dto";
import ApiError from "../templates/api-error";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";

@Service()
class TripFeedbackService implements ITripFeedbackService {
	constructor(
		private readonly tripFeedbackRepository: TripFeedbackRepository,
		private readonly userRepository: UserRepository,
		private readonly tripRepository: TripRepository,
		private readonly idCounterService: IdCounterService,
		private readonly notificationService: NotificationService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getTripFeedbacks(
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<TripFeedbackResponseDto[]> {
		try {
			// Fetch trip feedbacks
			const tripFeedbacks: TripFeedback[] =
				await this.tripFeedbackRepository.find(pagination, query);

			// Transform trip feedbacks to DTOs
			const tripFeedbackResponseDtos: TripFeedbackResponseDto[] =
				plainToInstance(TripFeedbackResponseDto, tripFeedbacks, {
					excludeExtraneousValues: true,
				});

			return tripFeedbackResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch trip feedbacks.", 500, error);
		}
	}

	public async getOwnTripFeedbacks(
		currentUser: CurrentUser,
		tripId: string,
	): Promise<TripFeedbackResponseDto> {
		try {
			// Fetch trip feedback by trip ID and user ID
			const tripFeedback: TripFeedback | null =
				await this.tripFeedbackRepository.findByTripIdAndUserId(
					tripId,
					currentUser.id,
				);

			// Transform trip feedback to DTO
			const tripFeedbackResponseDto: TripFeedbackResponseDto =
				plainToInstance(TripFeedbackResponseDto, tripFeedback, {
					excludeExtraneousValues: true,
				});

			return tripFeedbackResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch trip feedback for trip with ID ${tripId}.`,
						500,
						error,
					);
		}
	}

	public async getTripFeedbackById(
		currentUser: CurrentUser,
		id: string,
	): Promise<TripFeedbackResponseDto> {
		try {
			// Fetch trip feedback by ID
			const tripFeedback: TripFeedback | null =
				await this.tripFeedbackRepository.findOne(id);
			if (!tripFeedback) {
				throw new ApiError(`Feedback with ID '${id}' not found.`, 404);
			}

			// Transform trip feedback to DTO
			const tripFeedbackResponseDto: TripFeedbackResponseDto =
				plainToInstance(TripFeedbackResponseDto, tripFeedback, {
					excludeExtraneousValues: true,
				});

			return tripFeedbackResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch trip feedback with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createTripFeedback(
		currentUser: CurrentUser,
		data: CreateTripFeedbackDto,
	): Promise<TripFeedbackResponseDto> {
		try {
			// Check if user has already created feedback for the trip
			const existingTripFeedback: TripFeedback | null =
				await this.tripFeedbackRepository.findByTripIdAndUserId(
					data.tripId,
					currentUser.id,
				);
			if (existingTripFeedback) {
				throw new ApiError(
					`User with ID '${currentUser.id}' already created a feedback for trip with ID '${data.tripId}'.`,
					409,
				);
			}
			// Find user and trip
			const user: User | null = await this.userRepository.findOne(
				currentUser.id,
			);
			if (!user) {
				throw new ApiError(
					`User with ID '${currentUser.id}' not found.`,
					404,
				);
			}
			const trip: Trip = await this.tripRepository.findById(data.tripId);

			// Only allow feedback for ON_GOING or COMPLETED trips
			if (
				![TripStatus.ON_GOING, TripStatus.COMPLETED].includes(
					trip.status,
				)
			) {
				throw new ApiError(
					"Feedback is only allowed for ongoing or completed trips.",
					400,
				);
			}

			// Check if trip has an assigned driver
			if (!trip.driver) {
				throw new ApiError("Trip has no assigned driver.", 400);
			}

			const result: TripFeedback = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Create a new trip feedback
					const tripFeedbackId =
						await this.idCounterService.generateId(
							EntityMap.TRIP_FEEDBACK,
							manager,
						);
					const tripFeedback = new TripFeedback(
						tripFeedbackId,
						data.rating,
						user,
						trip,
						data.comment,
					);
					await this.tripFeedbackRepository.create(
						tripFeedback,
						manager,
					);

					// Send notification for low ratings (≤ 3)
					if (data.rating <= 3) {
						const notificationBody = new NotificationBody(
							"Bad trip rating received",
							"CoordinatorBadTripRatingReceive",
							{
								driverName: trip.driver!.name,
								rating: data.rating,
								tripDate: trip.actualDepartureTime,
							},
							tripFeedbackId,
							Priority.HIGH,
						);
						await this.notificationService.sendCoordinatorAndAdminNotification(
							notificationBody,
							manager,
						);
					}

					// Fetch the created trip feedback
					const createdTripFeedback: TripFeedback | null =
						await this.tripFeedbackRepository.findOne(
							tripFeedbackId,
							manager,
						);
					if (!createdTripFeedback) {
						throw new ApiError(
							`Failed to fetch created trip feedback with ID '${tripFeedbackId}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.TRIP_FEEDBACK,
						createdTripFeedback.id,
						ActionType.CREATE,
						`User with ID '${currentUser.id}' created a feedback with ID '${createdTripFeedback.id}' for trip with ID '${trip.id}'.`,
						manager,
					);

					return createdTripFeedback;
				},
			);

			const tripFeedbackResponseDto: TripFeedbackResponseDto =
				plainToInstance(TripFeedbackResponseDto, result, {
					excludeExtraneousValues: true,
				});

			return tripFeedbackResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create trip feedback.", 500, error);
		}
	}
}

export default TripFeedbackService;
