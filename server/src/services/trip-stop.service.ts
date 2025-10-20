import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import TripStop from "../database/entities/TripStop";
import ActionType from "../database/enums/ActionType";
import TripStopRepository from "../repositories/trip-stop.repository";
import ITripStopService from "./interfaces/ITripStopService";
import ActivityLogService from "./activity-log.service";
import TripStopResponseDto from "../dtos/trip-stop/trip-stop-response.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class TripStopService implements ITripStopService {
	constructor(
		private readonly tripStopRepository: TripStopRepository,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getTripStops(
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<TripStopResponseDto[]> {
		try {
			// Fetch trip stops
			const tripStops: TripStop[] = await this.tripStopRepository.find(
				pagination,
				query,
			);

			// Transform trip stops to DTOs
			const tripStopResponseDtos: TripStopResponseDto[] = plainToInstance(
				TripStopResponseDto,
				tripStops,
				{
					excludeExtraneousValues: true,
				},
			);

			return tripStopResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch trip stops.", 500, error);
		}
	}

	public async getTripStop(id: string): Promise<TripStopResponseDto> {
		try {
			// Fetch trip stop by ID
			const tripStop: TripStop | null =
				await this.tripStopRepository.findOne(id);
			if (!tripStop) {
				throw new ApiError(`Trip stop with ID ${id} not found.`, 404);
			}

			// Transform trip stop to DTO
			const tripStopResponseDto: TripStopResponseDto = plainToInstance(
				TripStopResponseDto,
				tripStop,
				{
					excludeExtraneousValues: true,
				},
			);

			return tripStopResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch trip stop with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async arriveTripStop(
		currentUser: CurrentUser,
		id: string,
	): Promise<TripStopResponseDto> {
		try {
			const result: TripStopResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch trip stop by ID
					const tripStop: TripStop | null =
						await this.tripStopRepository.findOne(id, manager);
					if (!tripStop) {
						throw new ApiError(
							`Trip stop with ID '${id}' not found.`,
							404,
						);
					}

					// Ensure the current user is the assigned driver for the trip
					if (
						!tripStop.trip.driver ||
						tripStop.trip.driver.id !== currentUser.id
					) {
						throw new ApiError(
							"You are not the assigned driver for this trip.",
							403,
						);
					}

					// Update actual arrival time
					tripStop.actualArrivalTime = new Date();
					await this.tripStopRepository.update(tripStop, manager);

					// Fetch the updated trip stop
					const updatedTripStop: TripStop | null =
						await this.tripStopRepository.findOne(id, manager);
					if (!updatedTripStop) {
						throw new ApiError(
							`Failed to fetch updated trip stop with ID '${id}'.`,
							404,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.TRIP_STOP,
						tripStop.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' marked trip stop with ID '${tripStop.id}' as arrived.`,
						manager,
					);

					// Transform the updated trip stop to DTO
					const tripStopResponseDto: TripStopResponseDto =
						plainToInstance(TripStopResponseDto, updatedTripStop, {
							excludeExtraneousValues: true,
						});

					return tripStopResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to mark the trip stop with ID '${id}' as arrived.`,
						500,
						error,
					);
		}
	}
}

export default TripStopService;
