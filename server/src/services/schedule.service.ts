import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import Schedule from "../database/entities/Schedule";
import Driver from "../database/entities/Driver";
import Vehicle from "../database/entities/Vehicle";
import ActionType from "../database/enums/ActionType";
import ScheduleRepository from "../repositories/schedule.repository";
import DriverRepository from "../repositories/driver.repository";
import VehicleRepository from "../repositories/vehicle.repository";
import IScheduleService from "./interfaces/IScheduleService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import ScheduleResponseDto from "../dtos/schedule/schedule-response.dto";
import CreateScheduleDto from "../dtos/schedule/create-schedule.dto";
import UpdateScheduleDto from "../dtos/schedule/update-schedule.dto";
import CheckConflictScheduleDto from "../dtos/schedule/check-conflict-schedule.dto";
import CheckConflictScheduleResponseDto from "../dtos/schedule/check-conflict-schedule-response.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class ScheduleService implements IScheduleService {
	constructor(
		private readonly scheduleRepository: ScheduleRepository,
		private readonly driverRepository: DriverRepository,
		private readonly vehicleRepository: VehicleRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getSchedules(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<ScheduleResponseDto[]> {
		try {
			// Driver role can only view their own schedules
			if (currentUser.role === RoleMap.DRIVER) {
				query.driverId = currentUser.id;
			}

			// Fetch schedules
			const schedules: Schedule[] = await this.scheduleRepository.find(
				pagination,
				query,
			);

			// Transform schedules to DTOs
			const scheduleResponseDtos: ScheduleResponseDto[] = plainToInstance(
				ScheduleResponseDto,
				schedules,
				{
					excludeExtraneousValues: true,
				},
			);

			return scheduleResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch schedules.", 500, error);
		}
	}

	public async getScheduleById(
		currentUser: CurrentUser,
		id: string,
	): Promise<ScheduleResponseDto> {
		try {
			// Fetch the schedule by ID
			const schedule: Schedule | null =
				await this.scheduleRepository.findOne(id);
			if (!schedule) {
				throw new ApiError(`Schedule with ID '${id}' not found.`, 404);
			}

			// Driver role can only view their own schedules
			if (
				currentUser.role === RoleMap.DRIVER &&
				schedule.driver &&
				schedule.driver.id !== currentUser.id
			) {
				throw new ApiError(
					`User ${currentUser.id} is not authorized to access this schedule.`,
					403,
				);
			}

			// Transform the schedule to DTO
			const scheduleResponseDto: ScheduleResponseDto = plainToInstance(
				ScheduleResponseDto,
				schedule,
				{
					excludeExtraneousValues: true,
				},
			);

			return scheduleResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch schedule with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createSchedule(
		currentUser: CurrentUser,
		data: CreateScheduleDto,
	): Promise<ScheduleResponseDto> {
		try {
			const result: ScheduleResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Generate a new id for schedule
					const id: string = await this.idCounterService.generateId(
						EntityMap.SCHEDULE,
						manager,
					);

					// Get the driver by ID if provided
					let driver: Driver | null = null;
					if (data.driverId) {
						driver = await this.driverRepository.findOne(
							data.driverId,
							manager,
						);
						if (!driver) {
							throw new ApiError(
								`Driver with ID '${data.driverId}' not found.`,
								404,
							);
						}
					}

					// Get the vehicle by ID if provided
					let vehicle: Vehicle | null = null;
					if (data.vehicleId) {
						vehicle = await this.vehicleRepository.findOne(
							data.vehicleId,
							manager,
						);
						if (!vehicle) {
							throw new ApiError(
								`Vehicle with ID '${data.vehicleId}' not found.`,
								404,
							);
						}
					}

					// Create a new schedule entity
					const newSchedule = new Schedule(
						id,
						data.title,
						data.startTime,
						data.endTime,
						data.description,
						driver,
						vehicle,
					);
					await this.scheduleRepository.create(newSchedule, manager);

					// Fetch the created schedule
					const createdSchedule: Schedule | null =
						await this.scheduleRepository.findOne(id, manager);
					if (!createdSchedule) {
						throw new ApiError(
							`Failed to fetch created schedule with ID '${id}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.SCHEDULE,
						createdSchedule.id,
						ActionType.CREATE,
						`User with ID '${currentUser.id}' created schedule with ID '${createdSchedule.id}'.`,
						manager,
					);

					// Transform the new schedule to ScheduleResponseDto
					const scheduleResponseDto: ScheduleResponseDto =
						plainToInstance(ScheduleResponseDto, createdSchedule, {
							excludeExtraneousValues: true,
						});

					return scheduleResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create schedule.", 500, error);
		}
	}

	public async updateSchedule(
		currentUser: CurrentUser,
		id: string,
		data: UpdateScheduleDto,
	): Promise<ScheduleResponseDto> {
		try {
			const result: ScheduleResponseDto = await AppDataSource.transaction(
				async (manager) => {
					// Fetch the existing schedule by ID
					const existingSchedule: Schedule | null =
						await this.scheduleRepository.findOne(id, manager);
					if (!existingSchedule) {
						throw new ApiError(
							`Schedule with ID '${id}' not found.`,
							404,
						);
					}

					// Update the schedule with new data if provided
					if (data.title !== undefined) {
						existingSchedule.title = data.title;
					}
					if (data.description !== undefined) {
						existingSchedule.description = data.description;
					}
					if (data.startTime !== undefined) {
						existingSchedule.startTime = data.startTime;
					}
					if (data.endTime !== undefined) {
						existingSchedule.endTime = data.endTime;
					}
					await this.scheduleRepository.update(
						existingSchedule,
						manager,
					);

					// Fetch the updated schedule
					const updatedSchedule: Schedule | null =
						await this.scheduleRepository.findOne(id, manager);
					if (!updatedSchedule) {
						throw new ApiError(
							`Failed to fetch updated schedule with ID '${id}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.SCHEDULE,
						updatedSchedule.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' updated schedule with ID '${updatedSchedule.id}'.`,
						manager,
					);

					// Transform the updated schedule to ScheduleResponseDto
					const scheduleResponseDto: ScheduleResponseDto =
						plainToInstance(ScheduleResponseDto, updatedSchedule, {
							excludeExtraneousValues: true,
						});

					return scheduleResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update schedule with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async deleteSchedule(
		currentUser: CurrentUser,
		id: string,
	): Promise<void> {
		try {
			await AppDataSource.transaction(async (manager) => {
				// Fetch the existing schedule by ID
				const existingSchedule: Schedule | null =
					await this.scheduleRepository.findOne(id, manager);
				if (!existingSchedule) {
					throw new ApiError(
						`Schedule with ID '${id}' not found.`,
						404,
					);
				}

				// Delete the schedule by id
				await this.scheduleRepository.delete(id, manager);

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.SCHEDULE,
					existingSchedule.id,
					ActionType.DELETE,
					`User with ID '${currentUser.id}' deleted schedule with ID '${existingSchedule.id}'.`,
					manager,
				);
			});
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to delete schedule with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async checkConflictSchedule(
		currentUser: CurrentUser,
		data: CheckConflictScheduleDto,
	): Promise<CheckConflictScheduleResponseDto> {
		try {
			const result: CheckConflictScheduleResponseDto =
				await AppDataSource.transaction(async (manager) => {
					// Build the query for fetching schedules
					const query: Record<string, unknown> = {
						driverId: data.driverId,
						startTimeFrom: Date.now(),
					};

					// Fetch all schedules for the driver
					const schedules: Schedule[] =
						await this.scheduleRepository.find(
							undefined,
							query,
							manager,
						);

					// Check for conflicting schedules
					const startTime: Date = new Date(data.startTime);
					const endTime: Date = new Date(data.endTime);
					const conflictingScheduleIds: string[] = [];
					for (const schedule of schedules) {
						// Skip the current schedule if it's the same as the one being checked
						if (data.id && schedule.id === data.id) {
							continue;
						}

						// Check for overlapping schedules
						if (
							schedule.startTime < endTime &&
							schedule.endTime > startTime
						) {
							conflictingScheduleIds.push(schedule.id);
						}
					}
					const isConflicted: boolean =
						conflictingScheduleIds.length > 0;

					// Create response DTO
					const checkConflictScheduleResponseDto: CheckConflictScheduleResponseDto =
						plainToInstance(
							CheckConflictScheduleResponseDto,
							{ isConflicted, conflictingScheduleIds },
							{ excludeExtraneousValues: true },
						);

					return checkConflictScheduleResponseDto;
				});

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to check schedule conflicts.",
						500,
						error,
					);
		}
	}
}

export default ScheduleService;
