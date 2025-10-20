import { Service } from "typedi";
import IExecutiveVehicleActivityService from "./interfaces/IExecutiveVehicleActivityService";
import CreateExecutiveVehicleActivityDto from "../dtos/executive-vehicle-activity/create-executive-vehicle-activity.dto";
import ExecutiveVehicleActivityRepository from "../repositories/executive_vehicle_activity.repository";
import CurrentUser from "../templates/current-user";
import UserRepository from "../repositories/user.repository";
import User from "../database/entities/User";
import ApiError from "../templates/api-error";
import ExecutiveVehicleActivity from "../database/entities/ExecutiveVehicleActivity";
import IdCounterService from "./id-counter.service";
import AppDataSource from "../config/database";
import { plainToInstance } from "class-transformer";
import ExecutiveVehicleActivityDto from "../dtos/executive-vehicle-activity/executive-vehicle-activity.dto";
import NotificationService from "./notification.service";
import NotificationBody from "../dtos/notification/notification-body.dto";
import Priority from "../database/enums/Priority";
import Pagination from "../templates/pagination";
import UpdateExecutiveVehicleActivityDto from "../dtos/executive-vehicle-activity/update-executive-vehicle-activity.dto";
import ActivityStatus from "../database/enums/ActivityStatus";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import ActionType from "../database/enums/ActionType";
import ActivityLogService from "./activity-log.service";

@Service()
class ExecutiveVehicleActivityService
	implements IExecutiveVehicleActivityService
{
	constructor(
		private readonly executiveVehicleActivityRepository: ExecutiveVehicleActivityRepository,
		private readonly userRepository: UserRepository,
		private readonly idCounterService: IdCounterService,
		private readonly notificationService: NotificationService,
		private readonly activityLogService: ActivityLogService,
	) {}

	async executiveGetActivities(
		executiveId: string,
		pagination: Pagination,
		status?: "pending" | "approved" | "rejected",
	): Promise<ExecutiveVehicleActivityDto[]> {
		const logs =
			await this.executiveVehicleActivityRepository.findByExecutiveId(
				executiveId,
				pagination,
				status,
			);

		const dto = plainToInstance(ExecutiveVehicleActivityDto, logs, {
			excludeExtraneousValues: true,
		});

		return dto;
	}

	async getById(
		user: CurrentUser,
		activityId: string,
	): Promise<ExecutiveVehicleActivityDto> {
		try {
			const log =
				await this.executiveVehicleActivityRepository.findOne(
					activityId,
				);

			// Verify access control based on user role
			if (user.role === RoleMap.DRIVER) {
				if (user.id !== log.vehicle.driver?.id) {
					throw new ApiError(
						"Access denied: You are not assigned to this vehicle activity.",
						403,
					);
				}
			} else if (user.role === RoleMap.EXECUTIVE) {
				if (user.id !== log.executive.id) {
					throw new ApiError(
						"Access denied: This activity does not belong to you.",
						403,
					);
				}
			} else {
				throw new ApiError(
					"Access denied: This activity does not belong to you.",
					400,
				);
			}

			const dto = plainToInstance(ExecutiveVehicleActivityDto, log, {
				excludeExtraneousValues: true,
			});

			return dto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to retrieve vehicle activity.",
						500,
						error,
					);
		}
	}

	async driverGetActivities(
		executiveId: string,
		pagination: Pagination,
		status?: "pending" | "approved" | "rejected",
	): Promise<ExecutiveVehicleActivityDto[]> {
		const logs =
			await this.executiveVehicleActivityRepository.findByDriverId(
				executiveId,
				pagination,
				status,
			);

		const dto = plainToInstance(ExecutiveVehicleActivityDto, logs, {
			excludeExtraneousValues: true,
		});

		return dto;
	}

	async createByDriver(
		currentUser: CurrentUser,
		executiveId: string,
		request: CreateExecutiveVehicleActivityDto,
	): Promise<ExecutiveVehicleActivityDto> {
		const executive: User | null =
			await this.userRepository.findExecutiveById(executiveId);

		if (!executive) {
			throw new ApiError(
				`Executive with id '${executiveId}' not found.`,
				404,
			);
		}

		if (!executive.dedicatedVehicle) {
			throw new ApiError(
				"This executive has no dedicated vehicle assigned.",
				400,
			);
		}

		if (executive.dedicatedVehicle.driver?.id !== currentUser.id) {
			throw new ApiError(
				"You are not authorized to submit a log for this executive.",
				403,
			);
		}

		// const hasConflict =
		// 	await this.executiveVehicleActivityRepository.hasOverlappingLog(
		// 		executiveId,
		// 		request.startTime,
		// 		request.endTime,
		// 	);

		// if (hasConflict) {
		// 	throw new ApiError(
		// 		"This executive already has an overlapping activity log for the selected time range.",
		// 		409,
		// 	);
		// }

		try {
			const newActivity = await AppDataSource.transaction(
				async (manager) => {
					// Create new executive vehicle activity
					const id = await this.idCounterService.generateId(
						EntityMap.EXECUTIVE_VEHICLE_ACTIVITY,
						manager,
					);

					const activity = new ExecutiveVehicleActivity(
						id,
						request.startTime,
						request.endTime,
						executive.dedicatedVehicle!,
						executive,
						request.notes,
					);

					await this.executiveVehicleActivityRepository.create(
						activity,
						manager,
					);

					// Send notification to executive
					const notification = new NotificationBody(
						"Executive Receive Activity Log ",
						"ExecutiveReceiveActivityLog",
						{
							name: executive.dedicatedVehicle!.driver!.name,
							startTime: request.startTime,
							endTime: request.endTime,
						},
						activity.id,
						Priority.HIGH,
					);

					await this.notificationService.sendUserNotification(
						notification,
						executive.id,
						executive.role.key,
						manager,
					);

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.EXECUTIVE_VEHICLE_ACTIVITY,
						activity.id,
						ActionType.CREATE,
						`User with ID '${currentUser.id}' created an executive vehicle activity log with ID '${activity.id}'.`,
						manager,
					);

					return activity;
				},
			);

			const dto = plainToInstance(
				ExecutiveVehicleActivityDto,
				newActivity,
				{
					excludeExtraneousValues: true,
				},
			);

			return dto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to log activity", 500, error);
		}
	}

	async updateByDriver(
		currentUser: CurrentUser,
		activityId: string,
		request: UpdateExecutiveVehicleActivityDto,
	): Promise<ExecutiveVehicleActivityDto> {
		try {
			const activity =
				await this.executiveVehicleActivityRepository.findOne(
					activityId,
				);

			if (activity.status !== ActivityStatus.PENDING) {
				throw new ApiError("This activity log is read-only", 400);
			}

			if (activity.vehicle!.driver!.id !== currentUser.id) {
				throw new ApiError(
					"You are not authorized to update this activity log",
					403,
				);
			}

			const updatedActivity = await AppDataSource.transaction(
				async (manager) => {
					Object.assign(activity, request);

					// Recalculate workedMinutes if either time is updated
					if (request.startTime || request.endTime) {
						const start = new Date(activity.startTime).getTime();
						const end = new Date(activity.endTime).getTime();

						if (end <= start) {
							throw new ApiError(
								"End time must be after start time",
								400,
							);
						}

						activity.workedMinutes = Math.floor(
							(end - start) / (1000 * 60),
						);
					}

					await this.executiveVehicleActivityRepository.update(
						activity,
						manager,
					);

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.EXECUTIVE_VEHICLE_ACTIVITY,
						activity.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' updated an executive vehicle activity log with ID '${activity.id}'.`,
						manager,
					);

					return activity;
				},
			);

			return plainToInstance(
				ExecutiveVehicleActivityDto,
				updatedActivity,
				{
					excludeExtraneousValues: true,
				},
			);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to update activity", 500, error);
		}
	}

	async updateConfirmationStatus(
		executive: CurrentUser,
		activityId: string,
		isConfirmed: boolean,
	): Promise<ExecutiveVehicleActivityDto> {
		try {
			const activity =
				await this.executiveVehicleActivityRepository.findOne(
					activityId,
				);

			if (executive.id !== activity.executive.id) {
				throw new ApiError(
					"You are not authorized to update this activity log",
				);
			}

			if (activity.status !== ActivityStatus.PENDING) {
				throw new ApiError(
					"You can only update pending activity log",
					400,
				);
			}

			activity.status = isConfirmed
				? ActivityStatus.APPROVED
				: ActivityStatus.REJECTED;

			const updatedActivity = await AppDataSource.transaction(
				async (manager) => {
					await this.executiveVehicleActivityRepository.update(
						activity,
						manager,
					);

					let notification;
					if (isConfirmed) {
						notification = new NotificationBody(
							"Activity log approved by executive",
							"ActivityLogApproved",
							{},
							activity.id,
							Priority.HIGH,
						);
					} else {
						notification = new NotificationBody(
							"Activity log rejected by executive",
							"ActivityLogRejected",
							{},
							activity.id,
							Priority.URGENT,
						);
					}

					await this.notificationService.sendUserNotification(
						notification,
						activity.vehicle!.driver!.id,
						"driver",
						manager,
					);

					// Log the activity
					await this.activityLogService.createActivityLog(
						executive,
						EntityMap.EXECUTIVE_VEHICLE_ACTIVITY,
						activity.id,
						ActionType.UPDATE,
						`User with ID '${executive.id}' updated an executive vehicle activity log with ID '${activity.id}'.`,
						manager,
					);

					return activity;
				},
			);

			return plainToInstance(
				ExecutiveVehicleActivityDto,
				updatedActivity,
				{
					excludeExtraneousValues: true,
				},
			);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to update confirmation status",
						500,
						error,
					);
		}
	}
}

export default ExecutiveVehicleActivityService;
