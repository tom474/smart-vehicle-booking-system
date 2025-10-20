import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import LeaveRequest from "../database/entities/LeaveRequest";
import Driver from "../database/entities/Driver";
import Schedule from "../database/entities/Schedule";
import RequestStatus from "../database/enums/RequestStatus";
import Priority from "../database/enums/Priority";
import ActionType from "../database/enums/ActionType";
import LeaveRequestRepository from "../repositories/leave-request.repository";
import DriverRepository from "../repositories/driver.repository";
import ScheduleRepository from "../repositories/schedule.repository";
import ILeaveRequestService from "./interfaces/ILeaveRequestService";
import IdCounterService from "./id-counter.service";
import NotificationService from "./notification.service";
import ActivityLogService from "./activity-log.service";
import LeaveRequestResponseDto from "../dtos/leave-request/leave-request-response.dto";
import CreateLeaveRequestDto from "../dtos/leave-request/create-leave-request.dto";
import UpdateLeaveRequestDto from "../dtos/leave-request/update-leave-request.dto";
import RejectLeaveRequestDto from "../dtos/leave-request/reject-leave-request.dto";
import NotificationBody from "../dtos/notification/notification-body.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class LeaveRequestService implements ILeaveRequestService {
	constructor(
		private readonly leaveRequestRepository: LeaveRequestRepository,
		private readonly driverRepository: DriverRepository,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly idCounterService: IdCounterService,
		private readonly notificationService: NotificationService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getLeaveRequests(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<LeaveRequestResponseDto[]> {
		try {
			// Driver role can only see their own leave requests
			if (currentUser.role === RoleMap.DRIVER) {
				query.driverId = currentUser.id;
			}

			// Fetch leave requests
			const leaveRequests: LeaveRequest[] =
				await this.leaveRequestRepository.find(pagination, query);

			// Transform leave requests to DTOs
			const leaveRequestResponseDtos: LeaveRequestResponseDto[] =
				plainToInstance(LeaveRequestResponseDto, leaveRequests, {
					excludeExtraneousValues: true,
				});

			return leaveRequestResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch leave requests.", 500, error);
		}
	}

	public async getLeaveRequestById(
		currentUser: CurrentUser,
		id: string,
	): Promise<LeaveRequestResponseDto> {
		try {
			// Fetch the leave request by ID
			const leaveRequest: LeaveRequest | null =
				await this.leaveRequestRepository.findOne(id);
			if (!leaveRequest) {
				throw new ApiError(
					`Leave request with ID '${id}' not found.`,
					404,
				);
			}

			// Driver role can only see their own leave requests
			if (
				currentUser.role === RoleMap.DRIVER &&
				leaveRequest.driver.id !== currentUser.id
			) {
				throw new ApiError(
					`User '${currentUser.id}' is not authorized to access this leave request.`,
					403,
				);
			}

			// Transform the leave request to DTO
			const leaveRequestResponseDto: LeaveRequestResponseDto =
				plainToInstance(LeaveRequestResponseDto, leaveRequest, {
					excludeExtraneousValues: true,
				});

			return leaveRequestResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch leave request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createLeaveRequest(
		currentUser: CurrentUser,
		data: CreateLeaveRequestDto,
	): Promise<LeaveRequestResponseDto> {
		try {
			const result: LeaveRequestResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Generate a new id for leave request
						const id: string =
							await this.idCounterService.generateId(
								EntityMap.LEAVE_REQUEST,
								manager,
							);

						// Get the driver by id
						let driverId: string;
						if (currentUser.role === RoleMap.DRIVER) {
							driverId = currentUser.id;
						} else {
							if (!data.driverId) {
								throw new ApiError(
									"Driver ID is required.",
									400,
								);
							}
							driverId = data.driverId;
						}
						const driver: Driver | null =
							await this.driverRepository.findOne(
								driverId,
								manager,
							);
						if (!driver) {
							throw new ApiError(
								`Driver with ID ${driverId} not found.`,
								404,
							);
						}

						// Create a new leave request entity
						const newLeaveRequest = new LeaveRequest(
							id,
							driver,
							data.startTime,
							data.endTime,
							data.reason,
							data.notes,
						);
						await this.leaveRequestRepository.create(
							newLeaveRequest,
							manager,
						);

						// Fetch the created leave request
						const createdLeaveRequest: LeaveRequest | null =
							await this.leaveRequestRepository.findOne(
								id,
								manager,
							);
						if (!createdLeaveRequest) {
							throw new ApiError(
								`Failed to fetch created leave request with ID '${id}'.`,
								500,
							);
						}

						if (currentUser.role === RoleMap.DRIVER) {
							// Send notification to all admin and coordinators.
							const notification = new NotificationBody(
								"Driver submitted leave request",
								"CoordinatorLeaveRequestSubmit",
								{
									driverName: driver.name,
									startDate: newLeaveRequest.startTime,
									endDate: newLeaveRequest.endTime,
								},
								newLeaveRequest.id,
								Priority.NORMAL,
							);
							await this.notificationService.sendCoordinatorAndAdminNotification(
								notification,
								manager,
							);
						} else if (
							currentUser.role === RoleMap.COORDINATOR ||
							currentUser.role === RoleMap.ADMIN
						) {
							// Send notification to driver if admin creates leave request on behalf of driver
							const notification = new NotificationBody(
								"Leave request submitted by coordinator",
								"DriverLeaveRequestSubmittedByCoordinator",
								{},
								newLeaveRequest.id,
								Priority.NORMAL,
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
							EntityMap.LEAVE_REQUEST,
							createdLeaveRequest.id,
							ActionType.CREATE,
							`User with ID '${currentUser.id}' created leave request with ID '${createdLeaveRequest.id}'.`,
							manager,
						);

						// Transform the new leave request to DTO
						const leaveRequestResponseDto: LeaveRequestResponseDto =
							plainToInstance(
								LeaveRequestResponseDto,
								createdLeaveRequest,
								{
									excludeExtraneousValues: true,
								},
							);

						return leaveRequestResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create leave request.", 500, error);
		}
	}

	public async updateLeaveRequest(
		currentUser: CurrentUser,
		id: string,
		data: UpdateLeaveRequestDto,
	): Promise<LeaveRequestResponseDto> {
		try {
			const result: LeaveRequestResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the existing leave request by ID
						const existingLeaveRequest: LeaveRequest | null =
							await this.leaveRequestRepository.findOne(
								id,
								manager,
							);
						if (!existingLeaveRequest) {
							throw new ApiError(
								`Leave request with ID '${id}' not found.`,
								404,
							);
						}

						// Driver role can only update their own leave requests
						if (
							currentUser.role === RoleMap.DRIVER &&
							existingLeaveRequest.driver.id !== currentUser.id
						) {
							throw new ApiError(
								`User with ID '${currentUser.id}' is not authorized to update this leave request.`,
								403,
							);
						}

						// Update the leave request with new data
						if (data.reason !== undefined) {
							existingLeaveRequest.reason = data.reason;
						}
						if (data.notes !== undefined) {
							existingLeaveRequest.notes = data.notes;
						}
						if (data.startTime !== undefined) {
							existingLeaveRequest.startTime = data.startTime;
						}
						if (data.endTime !== undefined) {
							existingLeaveRequest.endTime = data.endTime;
						}
						existingLeaveRequest.status = RequestStatus.PENDING;
						await this.leaveRequestRepository.update(
							existingLeaveRequest,
							manager,
						);

						// Delete the associated schedule if exists
						if (existingLeaveRequest.schedule) {
							await this.scheduleRepository.delete(
								existingLeaveRequest.schedule.id,
								manager,
							);
						}

						// Fetch the updated leave request
						const updatedLeaveRequest: LeaveRequest | null =
							await this.leaveRequestRepository.findOne(
								id,
								manager,
							);
						if (!updatedLeaveRequest) {
							throw new ApiError(
								`Failed to fetch updated leave request with ID '${id}'.`,
								500,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.LEAVE_REQUEST,
							updatedLeaveRequest.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' updated leave request with ID '${updatedLeaveRequest.id}'.`,
							manager,
						);

						// Transform the updated leave request to DTO
						const leaveRequestResponseDto: LeaveRequestResponseDto =
							plainToInstance(
								LeaveRequestResponseDto,
								updatedLeaveRequest,
								{
									excludeExtraneousValues: true,
								},
							);

						return leaveRequestResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update leave request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async approveLeaveRequest(
		currentUser: CurrentUser,
		id: string,
	): Promise<LeaveRequestResponseDto> {
		try {
			const result: LeaveRequestResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the existing leave request by ID
						const existingLeaveRequest: LeaveRequest | null =
							await this.leaveRequestRepository.findOne(
								id,
								manager,
							);
						if (!existingLeaveRequest) {
							throw new ApiError(
								`Leave request with ID '${id}' not found.`,
								404,
							);
						}

						// Update the leave request status to approved
						existingLeaveRequest.status = RequestStatus.APPROVED;

						// Create a schedule for the approved leave request
						const schedule: Schedule =
							await this.processApprovedLeaveRequest(
								existingLeaveRequest,
								manager,
							);
						existingLeaveRequest.schedule = schedule;

						// Update the leave request status and schedule
						await this.leaveRequestRepository.update(
							existingLeaveRequest,
							manager,
						);

						// Fetch the approved leave request
						const approvedLeaveRequest: LeaveRequest | null =
							await this.leaveRequestRepository.findOne(
								existingLeaveRequest.id,
								manager,
							);
						if (!approvedLeaveRequest) {
							throw new ApiError(
								`Failed to fetch approved leave request with ID '${existingLeaveRequest.id}'.`,
								500,
							);
						}

						// Send notification to driver
						const notification = new NotificationBody(
							"Leave schedule approved ",
							"DriverLeaveApproved",
							{
								startDate: schedule.startTime,
								endDate: schedule.endTime,
							},
							existingLeaveRequest.id,
							Priority.HIGH,
						);
						await this.notificationService.sendUserNotification(
							notification,
							existingLeaveRequest.driver.id,
							"driver",
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.LEAVE_REQUEST,
							approvedLeaveRequest.id,
							ActionType.APPROVE,
							`User with ID '${currentUser.id}' approved leave request with ID '${approvedLeaveRequest.id}'.`,
							manager,
						);

						// Transform the approved leave request to DTO
						const leaveRequestResponseDto: LeaveRequestResponseDto =
							plainToInstance(
								LeaveRequestResponseDto,
								approvedLeaveRequest,
								{
									excludeExtraneousValues: true,
								},
							);

						return leaveRequestResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to approve leave request with ID ${id}.`,
						500,
						error,
					);
		}
	}

	private async processApprovedLeaveRequest(
		leaveRequest: LeaveRequest,
		manager: EntityManager,
	): Promise<Schedule> {
		// Create a schedule for the approved leave request
		const scheduleId: string = await this.idCounterService.generateId(
			EntityMap.SCHEDULE,
			manager,
		);
		const title = `Leave Request #${leaveRequest.id}`;
		const description = `Reason: ${leaveRequest.reason}\nNotes: ${leaveRequest.notes}`;
		const schedule = new Schedule(
			scheduleId,
			title,
			leaveRequest.startTime,
			leaveRequest.endTime,
			description,
			leaveRequest.driver,
			null,
			null,
			leaveRequest,
			null,
		);
		await this.scheduleRepository.create(schedule, manager);

		// Fetch the created schedule
		const createdSchedule: Schedule | null =
			await this.scheduleRepository.findOne(scheduleId, manager);
		if (!createdSchedule) {
			throw new ApiError(
				`Failed to create schedule for leave request '${leaveRequest.id}'.`,
				500,
			);
		}

		return createdSchedule;
	}

	public async rejectLeaveRequest(
		currentUser: CurrentUser,
		id: string,
		data: RejectLeaveRequestDto,
	): Promise<LeaveRequestResponseDto> {
		try {
			const result: LeaveRequestResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the existing leave request by ID
						const existingLeaveRequest: LeaveRequest | null =
							await this.leaveRequestRepository.findOne(
								id,
								manager,
							);
						if (!existingLeaveRequest) {
							throw new ApiError(
								`Leave request with ID '${id}' not found.`,
								404,
							);
						}

						// Update the leave request status
						existingLeaveRequest.rejectReason = data.reason;
						existingLeaveRequest.status = RequestStatus.REJECTED;

						// Delete the associated schedule if exists
						if (existingLeaveRequest.schedule) {
							await this.scheduleRepository.delete(
								existingLeaveRequest.schedule.id,
								manager,
							);
						}
						existingLeaveRequest.schedule = null;

						// Update the leave request
						await this.leaveRequestRepository.update(
							existingLeaveRequest,
							manager,
						);

						// Fetch the rejected leave request
						const rejectedLeaveRequest: LeaveRequest | null =
							await this.leaveRequestRepository.findOne(
								id,
								manager,
							);
						if (!rejectedLeaveRequest) {
							throw new ApiError(
								`Failed to fetch rejected leave request with ID '${id}'.`,
								500,
							);
						}

						// Send notification to driver
						const notification = new NotificationBody(
							"Leave schedule rejected",
							"DriverLeaveRejected",
							{
								startDate: existingLeaveRequest.startTime,
								endDate: existingLeaveRequest.endTime,
								reason: existingLeaveRequest.reason,
							},
							existingLeaveRequest.id,
							Priority.HIGH,
						);
						await this.notificationService.sendUserNotification(
							notification,
							existingLeaveRequest.driver.id,
							"driver",
							manager,
						);

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.LEAVE_REQUEST,
							rejectedLeaveRequest.id,
							ActionType.REJECT,
							`User with ID '${currentUser.id}' rejected leave request with ID '${rejectedLeaveRequest.id}'.`,
							manager,
						);

						// Transform the rejected leave request to DTO
						const leaveRequestResponseDto: LeaveRequestResponseDto =
							plainToInstance(
								LeaveRequestResponseDto,
								rejectedLeaveRequest,
								{
									excludeExtraneousValues: true,
								},
							);

						return leaveRequestResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to reject leave request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async cancelLeaveRequest(
		currentUser: CurrentUser,
		id: string,
	): Promise<LeaveRequestResponseDto> {
		try {
			const result: LeaveRequestResponseDto =
				await AppDataSource.transaction(async (manager) => {
					// Fetch the existing leave request by ID
					const existingLeaveRequest: LeaveRequest | null =
						await this.leaveRequestRepository.findOne(id, manager);
					if (!existingLeaveRequest) {
						throw new ApiError(
							`Leave request with ID '${id}' not found.`,
							404,
						);
					}

					// Driver role can only cancel their own leave requests
					if (
						currentUser.role === RoleMap.DRIVER &&
						existingLeaveRequest.driver.id !== currentUser.id
					) {
						throw new ApiError(
							`User with ID '${currentUser.id}' is not authorized to cancel this leave request.`,
							403,
						);
					}

					// Update the leave request status to cancelled
					existingLeaveRequest.status = RequestStatus.CANCELLED;

					// Delete the associated schedule if it exists
					if (existingLeaveRequest.schedule) {
						await this.scheduleRepository.delete(
							existingLeaveRequest.schedule.id,
							manager,
						);
					}
					existingLeaveRequest.schedule = null;

					// Update the leave request
					await this.leaveRequestRepository.update(
						existingLeaveRequest,
						manager,
					);

					// Fetch the cancelled leave request
					const cancelledLeaveRequest: LeaveRequest | null =
						await this.leaveRequestRepository.findOne(id, manager);
					if (!cancelledLeaveRequest) {
						throw new ApiError(
							`Failed to fetch cancelled leave request with ID '${id}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.LEAVE_REQUEST,
						cancelledLeaveRequest.id,
						ActionType.CANCEL,
						`User with ID '${currentUser.id}' cancelled leave request with ID '${cancelledLeaveRequest.id}'.`,
						manager,
					);

					// Transform the cancelled leave request to LeaveRequestResponseDto
					const leaveRequestResponseDto: LeaveRequestResponseDto =
						plainToInstance(
							LeaveRequestResponseDto,
							cancelledLeaveRequest,
							{
								excludeExtraneousValues: true,
							},
						);

					return leaveRequestResponseDto;
				});

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to cancel leave request with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async deleteLeaveRequest(
		currentUser: CurrentUser,
		id: string,
	): Promise<void> {
		try {
			await AppDataSource.transaction(async (manager: EntityManager) => {
				// Fetch the existing leave request by ID
				const existingLeaveRequest: LeaveRequest | null =
					await this.leaveRequestRepository.findOne(id, manager);
				if (!existingLeaveRequest) {
					throw new ApiError(
						`Leave request with ID '${id}' not found.`,
						404,
					);
				}

				// Driver role can only delete their own leave requests
				if (
					currentUser.role === RoleMap.DRIVER &&
					existingLeaveRequest.driver.id !== currentUser.id
				) {
					throw new ApiError(
						`User with ID '${currentUser.id}' is not authorized to delete this leave request.`,
						403,
					);
				}

				// User cannot delete approved leave requests
				if (existingLeaveRequest.status === RequestStatus.APPROVED) {
					throw new ApiError(
						"User cannot delete approved leave requests.",
						403,
					);
				}

				// Delete the associated schedule if it exists
				if (existingLeaveRequest.schedule) {
					await this.scheduleRepository.delete(
						existingLeaveRequest.schedule.id,
						manager,
					);
				}

				// Delete the leave request
				await this.leaveRequestRepository.delete(id, manager);

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.LEAVE_REQUEST,
					existingLeaveRequest.id,
					ActionType.DELETE,
					`User with ID '${currentUser.id}' deleted leave request with ID '${existingLeaveRequest.id}'.`,
					manager,
				);
			});
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to delete leave request with ID ${id}.`,
						500,
						error,
					);
		}
	}
}

export default LeaveRequestService;
