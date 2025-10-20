import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import VehicleService from "../database/entities/VehicleService";
import Driver from "../database/entities/Driver";
import Vehicle from "../database/entities/Vehicle";
import Schedule from "../database/entities/Schedule";
import RequestStatus from "../database/enums/RequestStatus";
import Priority from "../database/enums/Priority";
import ActionType from "../database/enums/ActionType";
import VehicleServiceRepository from "../repositories/vehicle-service.repository";
import DriverRepository from "../repositories/driver.repository";
import VehicleRepository from "../repositories/vehicle.repository";
import ScheduleRepository from "../repositories/schedule.repository";
import ExpenseRepository from "../repositories/expense.repository";
import IVehicleServiceService from "./interfaces/IVehicleServiceService";
import IdCounterService from "./id-counter.service";
import NotificationService from "./notification.service";
import ActivityLogService from "./activity-log.service";
import VehicleServiceResponseDto from "../dtos/vehicle-service/vehicle-service-response.dto";
import CreateVehicleServiceDto from "../dtos/vehicle-service/create-vehicle-service.dto";
import UpdateVehicleServiceDto from "../dtos/vehicle-service/update-vehicle-service.dto";
import RejectVehicleServiceDto from "../dtos/vehicle-service/reject-vehicle-service.dto";
import NotificationBody from "../dtos/notification/notification-body.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class VehicleServiceService implements IVehicleServiceService {
	constructor(
		private readonly vehicleServiceRepository: VehicleServiceRepository,
		private readonly driverRepository: DriverRepository,
		private readonly vehicleRepository: VehicleRepository,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly expenseRepository: ExpenseRepository,
		private readonly idCounterService: IdCounterService,
		private readonly notificationService: NotificationService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getVehicleServices(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<VehicleServiceResponseDto[]> {
		try {
			// Driver role can only see their own vehicle services
			if (currentUser.role === RoleMap.DRIVER) {
				query.driverId = currentUser.id;
			}

			// Fetch vehicle services
			const vehicleServices: VehicleService[] =
				await this.vehicleServiceRepository.find(pagination, query);

			// Transform vehicle services to DTOs
			const vehicleServiceResponseDtos: VehicleServiceResponseDto[] =
				plainToInstance(VehicleServiceResponseDto, vehicleServices, {
					excludeExtraneousValues: true,
				});

			return vehicleServiceResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch vehicle services.", 500, error);
		}
	}

	public async getVehicleServiceById(
		currentUser: CurrentUser,
		id: string,
	): Promise<VehicleServiceResponseDto> {
		try {
			// Fetch vehicle service by ID
			const vehicleService: VehicleService | null =
				await this.vehicleServiceRepository.findOne(id);
			if (!vehicleService) {
				throw new ApiError(
					`Vehicle service with ID '${id}' not found.`,
					404,
				);
			}

			// Driver role can only see their own vehicle services
			if (
				currentUser.role === RoleMap.DRIVER &&
				vehicleService.driver.id !== currentUser.id
			) {
				throw new ApiError(
					`User with ID '${currentUser.id}' is not authorized to access this vehicle service.`,
					403,
				);
			}

			// Transform vehicle service to DTO
			const vehicleServiceResponseDto: VehicleServiceResponseDto =
				plainToInstance(VehicleServiceResponseDto, vehicleService, {
					excludeExtraneousValues: true,
				});

			return vehicleServiceResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch vehicle service with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createVehicleService(
		currentUser: CurrentUser,
		data: CreateVehicleServiceDto,
	): Promise<VehicleServiceResponseDto> {
		try {
			const result: VehicleServiceResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Generate a new ID for vehicle service
						const id: string =
							await this.idCounterService.generateId(
								EntityMap.VEHICLE_SERVICE,
								manager,
							);

						// Get the vehicle by id
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

						// Check if the vehicle has a driver
						if (!vehicle.driver) {
							throw new ApiError(
								`Vehicle with ID '${data.vehicleId}' must have an assigned driver to create a vehicle service.`,
								400,
							);
						}

						// Get the driver by ID
						const driver: Driver | null =
							await this.driverRepository.findOne(
								vehicle.driver.id,
								manager,
							);
						if (!driver) {
							throw new ApiError(
								`Driver with ID '${vehicle.driver.id}' not found.`,
								404,
							);
						}

						// Create a new vehicle service entity
						const newVehicleService = new VehicleService(
							id,
							driver,
							vehicle,
							data.serviceType,
							data.startTime,
							data.endTime,
							data.reason,
							data.description,
						);
						await this.vehicleServiceRepository.create(
							newVehicleService,
							manager,
						);

						// Fetch the created vehicle service
						const createdVehicleService: VehicleService | null =
							await this.vehicleServiceRepository.findOne(
								id,
								manager,
							);
						if (!createdVehicleService) {
							throw new ApiError(
								`Vehicle service with ID '${id}' not found.`,
								404,
							);
						}

						// Send notification to all coordinator if requester is driver
						if (currentUser.role === RoleMap.DRIVER) {
							const notification = new NotificationBody(
								"Vehicle service request submitted",
								"CoordinatorVehicleServiceReview",
								{
									driverName: driver.name,
									vehicleCode: vehicle.licensePlate,
								},
								id,
								Priority.HIGH,
							);
							await this.notificationService.sendCoordinatorAndAdminNotification(
								notification,
								manager,
							);
						} else if (
							currentUser.role === RoleMap.COORDINATOR ||
							currentUser.role === RoleMap.ADMIN
						) {
							// Send notification to driver if requester is coordinator or admin
							const notification = new NotificationBody(
								"Vehicle service request submitted by coordinator",
								"DriverVehicleServiceSubmittedByCoordinator",
								{},
								id,
								Priority.HIGH,
							);
							await this.notificationService.sendUserNotification(
								notification,
								driver.id,
								RoleMap.DRIVER,
								manager,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.VEHICLE_SERVICE,
							createdVehicleService.id,
							ActionType.CREATE,
							`User with ID '${currentUser.id}' created vehicle service with ID '${createdVehicleService.id}'.`,
							manager,
						);

						// Transform the new vehicle service to DTO
						const vehicleServiceResponseDto: VehicleServiceResponseDto =
							plainToInstance(
								VehicleServiceResponseDto,
								createdVehicleService,
								{
									excludeExtraneousValues: true,
								},
							);

						return vehicleServiceResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create vehicle service.", 500, error);
		}
	}

	public async updateVehicleService(
		currentUser: CurrentUser,
		id: string,
		data: UpdateVehicleServiceDto,
	): Promise<VehicleServiceResponseDto> {
		try {
			const result: VehicleServiceResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the existing vehicle service by ID
						const existingVehicleService: VehicleService | null =
							await this.vehicleServiceRepository.findOne(
								id,
								manager,
							);
						if (!existingVehicleService) {
							throw new ApiError(
								`Vehicle service with ID '${id}' not found.`,
								404,
							);
						}

						// Driver role can only update their own vehicle services
						if (
							currentUser.role === RoleMap.DRIVER &&
							existingVehicleService.driver.id !== currentUser.id
						) {
							throw new ApiError(
								`User with ID '${currentUser.id}' is not authorized to update this vehicle service.`,
								403,
							);
						}

						// Update the vehicle service with the new data
						if (data.reason !== undefined) {
							existingVehicleService.reason = data.reason;
						}
						if (data.description !== undefined) {
							existingVehicleService.description =
								data.description;
						}
						if (data.serviceType !== undefined) {
							existingVehicleService.serviceType =
								data.serviceType;
						}
						if (data.startTime !== undefined) {
							existingVehicleService.startTime = data.startTime;
						}
						if (data.endTime !== undefined) {
							existingVehicleService.endTime = data.endTime;
						}
						existingVehicleService.status = RequestStatus.PENDING;
						await this.vehicleServiceRepository.update(
							existingVehicleService,
							manager,
						);

						// Delete the associated schedule if it exists
						if (existingVehicleService.schedule) {
							await this.scheduleRepository.delete(
								existingVehicleService.schedule.id,
								manager,
							);
						}

						// Fetch the updated vehicle service
						const updatedVehicleService: VehicleService | null =
							await this.vehicleServiceRepository.findOne(
								id,
								manager,
							);
						if (!updatedVehicleService) {
							throw new ApiError(
								`Vehicle service with ID '${id}' not found.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.VEHICLE_SERVICE,
							updatedVehicleService.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' updated vehicle service with ID '${updatedVehicleService.id}'.`,
							manager,
						);

						// Transform the updated vehicle service to DTO
						const vehicleServiceResponseDto: VehicleServiceResponseDto =
							plainToInstance(
								VehicleServiceResponseDto,
								updatedVehicleService,
								{
									excludeExtraneousValues: true,
								},
							);

						return vehicleServiceResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update vehicle service with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async approveVehicleService(
		currentUser: CurrentUser,
		id: string,
	): Promise<VehicleServiceResponseDto> {
		try {
			const result: VehicleServiceResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the existing vehicle service by ID
						const existingVehicleService: VehicleService | null =
							await this.vehicleServiceRepository.findOne(
								id,
								manager,
							);
						if (!existingVehicleService) {
							throw new ApiError(
								`Vehicle service with ID '${id}' not found.`,
								404,
							);
						}

						// Update the vehicle service status to approved
						existingVehicleService.status = RequestStatus.APPROVED;

						// Create a schedule for the approved vehicle service
						const schedule: Schedule =
							await this.processApprovedVehicleService(
								existingVehicleService,
								manager,
							);
						existingVehicleService.schedule = schedule;

						// Update the vehicle service status and schedule
						await this.vehicleServiceRepository.update(
							existingVehicleService,
							manager,
						);

						// Fetch the approved vehicle service
						const approvedVehicleService: VehicleService | null =
							await this.vehicleServiceRepository.findOne(
								existingVehicleService.id,
								manager,
							);
						if (!approvedVehicleService) {
							throw new ApiError(
								`Failed to fetch approved vehicle service with ID '${existingVehicleService.id}'.`,
								500,
							);
						}

						// Send notification to driver
						const notification = new NotificationBody(
							"Vehicle service approved ",
							"DriverVehicleServiceApproved",
							{ date: new Date() },
							existingVehicleService.id,
							Priority.HIGH,
						);
						await this.notificationService.sendUserNotification(
							notification,
							existingVehicleService.driver.id,
							"driver",
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.VEHICLE_SERVICE,
							approvedVehicleService.id,
							ActionType.APPROVE,
							`User with ID '${currentUser.id}' approved vehicle service with ID '${approvedVehicleService.id}'.`,
							manager,
						);

						// Transform the approved vehicle service to DTO
						const vehicleServiceResponseDto: VehicleServiceResponseDto =
							plainToInstance(
								VehicleServiceResponseDto,
								approvedVehicleService,
								{
									excludeExtraneousValues: true,
								},
							);

						return vehicleServiceResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to approve vehicle service with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	private async processApprovedVehicleService(
		vehicleService: VehicleService,
		manager: EntityManager,
	): Promise<Schedule> {
		// Create a schedule for the approved vehicle service
		const scheduleId: string = await this.idCounterService.generateId(
			EntityMap.SCHEDULE,
			manager,
		);
		const title = `Vehicle Service #${vehicleService.id}`;
		const description = `Reason: ${vehicleService.reason}\nDescription: ${vehicleService.description}`;
		const schedule: Schedule = new Schedule(
			scheduleId,
			title,
			vehicleService.startTime,
			vehicleService.endTime,
			description,
			vehicleService.driver,
			vehicleService.vehicle,
			null,
			null,
			vehicleService,
		);
		await this.scheduleRepository.create(schedule, manager);

		// Fetch the created schedule
		const createdSchedule: Schedule | null =
			await this.scheduleRepository.findOne(scheduleId, manager);
		if (!createdSchedule) {
			throw new ApiError(
				`Failed to fetch created schedule with ID '${scheduleId}'.`,
				500,
			);
		}

		return createdSchedule;
	}

	public async rejectVehicleService(
		currentUser: CurrentUser,
		id: string,
		data: RejectVehicleServiceDto,
	): Promise<VehicleServiceResponseDto> {
		try {
			const result: VehicleServiceResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the existing vehicle service by ID
						const existingVehicleService: VehicleService | null =
							await this.vehicleServiceRepository.findOne(
								id,
								manager,
							);
						if (!existingVehicleService) {
							throw new ApiError(
								`Vehicle service with ID '${id}' not found.`,
								404,
							);
						}

						// Update the vehicle service
						existingVehicleService.rejectReason = data.reason;
						existingVehicleService.status = RequestStatus.REJECTED;

						// Update the associated expenses status
						if (existingVehicleService.expenses.length > 0) {
							for (const expense of existingVehicleService.expenses) {
								expense.status = RequestStatus.REJECTED;
								await this.expenseRepository.update(
									expense,
									manager,
								);
							}
						}

						// Delete the associated schedule if it exists
						if (existingVehicleService.schedule) {
							await this.scheduleRepository.delete(
								existingVehicleService.schedule.id,
								manager,
							);
						}
						existingVehicleService.schedule = null;

						// Update the vehicle service status
						await this.vehicleServiceRepository.update(
							existingVehicleService,
							manager,
						);

						// Fetch the rejected vehicle service
						const rejectedVehicleService: VehicleService | null =
							await this.vehicleServiceRepository.findOne(
								id,
								manager,
							);
						if (!rejectedVehicleService) {
							throw new ApiError(
								`Failed to fetch rejected vehicle service with ID '${id}'.`,
								500,
							);
						}

						// Send notification to driver
						const notification = new NotificationBody(
							"Vehicle service rejected ",
							"DriverVehicleServiceRejected",
							{ date: new Date() },
							existingVehicleService.id,
							Priority.HIGH,
						);
						await this.notificationService.sendUserNotification(
							notification,
							existingVehicleService.driver.id,
							"driver",
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.VEHICLE_SERVICE,
							rejectedVehicleService.id,
							ActionType.REJECT,
							`User with ID '${currentUser.id}' rejected vehicle service with ID '${rejectedVehicleService.id}'.`,
							manager,
						);

						// Transform the rejected vehicle service to DTO
						const vehicleServiceResponseDto: VehicleServiceResponseDto =
							plainToInstance(
								VehicleServiceResponseDto,
								rejectedVehicleService,
								{
									excludeExtraneousValues: true,
								},
							);

						return vehicleServiceResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to reject vehicle service with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async cancelVehicleService(
		currentUser: CurrentUser,
		id: string,
	): Promise<VehicleServiceResponseDto> {
		try {
			const result: VehicleServiceResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the existing vehicle service by ID
						const existingVehicleService: VehicleService | null =
							await this.vehicleServiceRepository.findOne(
								id,
								manager,
							);
						if (!existingVehicleService) {
							throw new ApiError(
								`Vehicle service with ID '${id}' not found.`,
								404,
							);
						}

						// Driver role can only cancel their own vehicle services
						if (
							currentUser.role === RoleMap.DRIVER &&
							existingVehicleService.driver.id !== currentUser.id
						) {
							throw new ApiError(
								`User '${currentUser.id}' is not authorized to cancel this vehicle service.`,
								403,
							);
						}

						// Update the vehicle service status to cancelled
						existingVehicleService.status = RequestStatus.CANCELLED;

						// Update the associated expenses status
						if (existingVehicleService.expenses.length > 0) {
							for (const expense of existingVehicleService.expenses) {
								expense.status = RequestStatus.CANCELLED;
								await this.expenseRepository.update(
									expense,
									manager,
								);
							}
						}

						// Delete the associated schedule if it exists
						if (existingVehicleService.schedule) {
							await this.scheduleRepository.delete(
								existingVehicleService.schedule.id,
								manager,
							);
						}
						existingVehicleService.schedule = null;

						// Update the vehicle service status
						await this.vehicleServiceRepository.update(
							existingVehicleService,
							manager,
						);

						// Fetch the cancelled vehicle service
						const cancelledVehicleService: VehicleService | null =
							await this.vehicleServiceRepository.findOne(
								id,
								manager,
							);
						if (!cancelledVehicleService) {
							throw new ApiError(
								`Failed to fetch cancelled vehicle service with ID '${id}'.`,
								500,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.VEHICLE_SERVICE,
							cancelledVehicleService.id,
							ActionType.CANCEL,
							`User with ID '${currentUser.id}' cancelled vehicle service with ID '${cancelledVehicleService.id}'.`,
							manager,
						);

						// Transform the cancelled vehicle service to DTO
						const vehicleServiceResponseDto: VehicleServiceResponseDto =
							plainToInstance(
								VehicleServiceResponseDto,
								cancelledVehicleService,
								{
									excludeExtraneousValues: true,
								},
							);

						return vehicleServiceResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to cancel vehicle service with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async deleteVehicleService(
		currentUser: CurrentUser,
		id: string,
	): Promise<void> {
		try {
			await AppDataSource.transaction(async (manager: EntityManager) => {
				// Fetch the existing vehicle service by ID
				const existingVehicleService: VehicleService | null =
					await this.vehicleServiceRepository.findOne(id, manager);
				if (!existingVehicleService) {
					throw new ApiError(
						`Vehicle service with ID '${id}' not found.`,
						404,
					);
				}

				// Driver role can only delete their own vehicle services
				if (
					currentUser.role === RoleMap.DRIVER &&
					existingVehicleService.driver.id !== currentUser.id
				) {
					throw new ApiError(
						`User '${currentUser.id}' is not authorized to delete this vehicle service.`,
						403,
					);
				}

				// User cannot delete approved vehicle services
				if (existingVehicleService.status === RequestStatus.APPROVED) {
					throw new ApiError(
						`User cannot delete approved vehicle services.`,
						403,
					);
				}

				// Delete the associated expenses if they exist
				if (existingVehicleService.expenses.length > 0) {
					for (const expense of existingVehicleService.expenses) {
						await this.expenseRepository.delete(
							expense.id,
							manager,
						);
					}
				}

				// Delete the associated schedule if it exists
				if (existingVehicleService.schedule) {
					await this.scheduleRepository.delete(
						existingVehicleService.schedule.id,
						manager,
					);
				}

				// Delete the vehicle service by id
				await this.vehicleServiceRepository.delete(id, manager);

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.VEHICLE_SERVICE,
					id,
					ActionType.DELETE,
					`User with ID '${currentUser.id}' deleted vehicle service with ID '${id}'.`,
					manager,
				);
			});
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to delete vehicle service with ID ${id}.`,
						500,
						error,
					);
		}
	}
}

export default VehicleServiceService;
