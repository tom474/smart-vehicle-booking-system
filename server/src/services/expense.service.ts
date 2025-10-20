import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import Expense from "../database/entities/Expense";
import Driver from "../database/entities/Driver";
import Trip from "../database/entities/Trip";
import VehicleService from "../database/entities/VehicleService";
import RequestStatus from "../database/enums/RequestStatus";
import Priority from "../database/enums/Priority";
import ActionType from "../database/enums/ActionType";
import ExpenseRepository from "../repositories/expense.repository";
import DriverRepository from "../repositories/driver.repository";
import TripRepository from "../repositories/trip.repository";
import VehicleServiceRepository from "../repositories/vehicle-service.repository";
import IExpenseService from "./interfaces/IExpenseService";
import IdCounterService from "./id-counter.service";
import BlobUploadService from "./upload.service";
import NotificationService from "./notification.service";
import ActivityLogService from "./activity-log.service";
import ExpenseResponseDto from "../dtos/expense/expense-response.dto";
import CreateExpenseDto from "../dtos/expense/create-expense.dto";
import UpdateExpenseDto from "../dtos/expense/update-expense.dto";
import RejectExpenseDto from "../dtos/expense/reject-expense.dto";
import NotificationBody from "../dtos/notification/notification-body.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class ExpenseService implements IExpenseService {
	constructor(
		private readonly expenseRepository: ExpenseRepository,
		private readonly driverRepository: DriverRepository,
		private readonly tripRepository: TripRepository,
		private readonly vehicleServiceRepository: VehicleServiceRepository,
		private readonly idCounterService: IdCounterService,
		private readonly uploadService: BlobUploadService,
		private readonly notificationService: NotificationService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getExpenses(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<ExpenseResponseDto[]> {
		try {
			// Driver role can only view their own expenses
			if (currentUser.role === RoleMap.DRIVER) {
				query.driverId = currentUser.id;
			}

			// Fetch expenses
			const expenses: Expense[] = await this.expenseRepository.find(
				pagination,
				query,
			);

			// Transform expenses to DTOs
			const expenseResponseDtos: ExpenseResponseDto[] = plainToInstance(
				ExpenseResponseDto,
				expenses,
				{ excludeExtraneousValues: true },
			);

			return expenseResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch expenses", 500, error);
		}
	}

	public async getExpenseById(
		currentUser: CurrentUser,
		id: string,
	): Promise<ExpenseResponseDto> {
		try {
			// Fetch the expense by ID
			const expense: Expense | null =
				await this.expenseRepository.findOne(id);
			if (!expense) {
				throw new ApiError(`Expense with ID '${id}' not found.`, 404);
			}

			// Driver role can only view their own expenses
			if (
				currentUser.role === RoleMap.DRIVER &&
				expense.driver.id !== currentUser.id
			) {
				throw new ApiError(
					`User with ID '${currentUser.id}' is not authorized to access this expense`,
					403,
				);
			}

			// Transform the expense to DTO
			const expenseResponseDto: ExpenseResponseDto = plainToInstance(
				ExpenseResponseDto,
				expense,
				{ excludeExtraneousValues: true },
			);

			return expenseResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch expense with ID '${id}'`,
						500,
						error,
					);
		}
	}

	public async createExpense(
		currentUser: CurrentUser,
		data: CreateExpenseDto,
		receipt?: Express.Multer.File,
	): Promise<ExpenseResponseDto> {
		try {
			const result: ExpenseResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Generate a new ID for the expense
					const id: string = await this.idCounterService.generateId(
						EntityMap.EXPENSE,
						manager,
					);

					// Get the trip by ID if provided
					let trip: Trip | null = null;
					if (data.tripId) {
						trip = await this.tripRepository.findOne(
							data.tripId,
							manager,
						);
						if (!trip) {
							throw new ApiError(
								`Trip with ID '${data.tripId}' not found.`,
								404,
							);
						}
					}

					// Get the vehicle service by ID if provided
					let vehicleService: VehicleService | null = null;
					if (data.vehicleServiceId) {
						vehicleService =
							await this.vehicleServiceRepository.findOne(
								data.vehicleServiceId,
								manager,
							);
						if (!vehicleService) {
							throw new ApiError(
								`Vehicle service with ID '${data.vehicleServiceId}' not found.`,
								404,
							);
						}
					}

					// One of trip or vehicleService must be provided, but not both
					if (trip && vehicleService) {
						throw new ApiError(
							"Expense cannot be associated with both a trip and a vehicle service.",
							400,
						);
					}

					// Get the driver by ID
					let driverId: string;
					if (currentUser.role === RoleMap.DRIVER) {
						driverId = currentUser.id;
					} else {
						if (trip) {
							if (trip.driver) {
								driverId = trip.driver.id;
							} else {
								throw new ApiError(
									`Trip with ID '${trip.id}' does not have an associated driver.`,
									400,
								);
							}
						} else if (vehicleService) {
							driverId = vehicleService.driver.id;
						} else {
							throw new ApiError(
								"Unable to determine driver for the expense.",
								400,
							);
						}
					}
					const driver: Driver | null =
						await this.driverRepository.findOne(driverId, manager);
					if (!driver) {
						throw new ApiError(
							`Driver with ID '${driverId}' not found.`,
							404,
						);
					}

					// Upload receipt if provided
					let receiptImageKey: string | null = null;
					if (receipt) {
						receiptImageKey = await this.uploadService.upload(
							id,
							receipt,
							{ overwrite: true },
						);
					}

					// Create a new expense
					const newExpense: Expense = new Expense(
						id,
						data.type,
						data.amount,
						driver,
						data.description,
						receiptImageKey,
						trip,
						vehicleService,
					);
					await this.expenseRepository.create(newExpense, manager);

					// Fetch the created expense
					const createdExpense: Expense | null =
						await this.expenseRepository.findOne(id, manager);
					if (!createdExpense) {
						throw new ApiError(
							`Failed to fetch created expense with ID '${id}'.`,
							500,
						);
					}

					if (currentUser.role === RoleMap.DRIVER) {
						// Notify coordinators
						const notification = new NotificationBody(
							"Driver submitted expenses",
							"CoordinatorExpenseReview",
							{
								driverName: driver.name,
								tripDate: newExpense.createdAt,
							},
							newExpense.id,
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
						// Notify driver if expenses are logged by coordinator or admin
						const notification = new NotificationBody(
							"Expenses submitted by coordinator",
							"DriverExpenseSubmittedByCoordinator",
							{},
							newExpense.id,
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
						EntityMap.EXPENSE,
						createdExpense.id,
						ActionType.CREATE,
						`User with ID '${currentUser.id}' created expense with ID '${createdExpense.id}'.`,
						manager,
					);

					// Transform the created expense to DTO
					const expenseResponseDto = plainToInstance(
						ExpenseResponseDto,
						createdExpense,
						{
							excludeExtraneousValues: true,
						},
					);

					return expenseResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create expense", 500, error);
		}
	}

	public async updateExpense(
		currentUser: CurrentUser,
		id: string,
		data: UpdateExpenseDto,
		receipt?: Express.Multer.File,
	): Promise<ExpenseResponseDto> {
		try {
			const result: ExpenseResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch the existing expense by ID
					const existingExpense: Expense | null =
						await this.expenseRepository.findOne(id, manager);
					if (!existingExpense) {
						throw new ApiError(
							`Expense with ID '${id}' not found.`,
							404,
						);
					}

					// Driver role can only update their own expenses
					if (
						currentUser.role === RoleMap.DRIVER &&
						existingExpense.driver.id !== currentUser.id
					) {
						throw new ApiError(
							`User with ID '${currentUser.id}' is not authorized to update this expense.`,
							403,
						);
					}

					// Update the expense with the new data
					if (data.type !== undefined) {
						existingExpense.type = data.type;
					}
					if (data.description !== undefined) {
						existingExpense.description = data.description;
					}
					if (data.amount !== undefined) {
						existingExpense.amount = data.amount;
					}
					if (data.tripId !== undefined) {
						if (data.tripId !== null) {
							const trip: Trip | null =
								await this.tripRepository.findOne(
									data.tripId,
									manager,
								);
							if (!trip) {
								throw new ApiError(
									`Trip with ID '${data.tripId}' not found.`,
									404,
								);
							}
							existingExpense.trip = trip;
						} else {
							existingExpense.trip = null;
						}
					}
					if (data.vehicleServiceId !== undefined) {
						if (data.vehicleServiceId !== null) {
							const vehicleService: VehicleService | null =
								await this.vehicleServiceRepository.findOne(
									data.vehicleServiceId,
									manager,
								);
							if (!vehicleService) {
								throw new ApiError(
									`Vehicle service with ID '${data.vehicleServiceId}' not found.`,
									404,
								);
							}
							existingExpense.vehicleService = vehicleService;
						} else {
							existingExpense.vehicleService = null;
						}
					}

					// One of trip or vehicleService must be provided, but not both
					if (
						!existingExpense.trip &&
						!existingExpense.vehicleService
					) {
						throw new ApiError(
							"Expense must be associated with either a trip or a vehicle service.",
							400,
						);
					}
					if (
						existingExpense.trip &&
						existingExpense.vehicleService
					) {
						throw new ApiError(
							"Expense cannot be associated with both a trip and a vehicle service.",
							400,
						);
					}

					// Upload receipt if provided
					let receiptImageKey: string | null = null;
					if (receipt) {
						receiptImageKey = await this.uploadService.upload(
							id,
							receipt,
							{ overwrite: true },
						);
					}

					existingExpense.status = RequestStatus.PENDING;
					existingExpense.receiptImageUrl = receiptImageKey;
					await this.expenseRepository.update(
						existingExpense,
						manager,
					);

					// Fetch the updated expense
					const updatedExpense: Expense | null =
						await this.expenseRepository.findOne(id, manager);
					if (!updatedExpense) {
						throw new ApiError(
							`Failed to fetch updated expense with ID '${id}'`,
							404,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.EXPENSE,
						updatedExpense.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' updated expense with ID '${updatedExpense.id}'.`,
						manager,
					);

					// Transform the updated expense to DTO
					const expenseResponseDto: ExpenseResponseDto =
						plainToInstance(ExpenseResponseDto, updatedExpense, {
							excludeExtraneousValues: true,
						});

					return expenseResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update expense with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async approveExpense(
		currentUser: CurrentUser,
		id: string,
	): Promise<ExpenseResponseDto> {
		try {
			const result: ExpenseResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch the existing expense by ID
					const existingExpense: Expense | null =
						await this.expenseRepository.findOne(id, manager);
					if (!existingExpense) {
						throw new ApiError(
							`Expense with ID '${id}' not found.`,
							404,
						);
					}

					// Update the expense status to approved
					existingExpense.status = RequestStatus.APPROVED;
					await this.expenseRepository.update(
						existingExpense,
						manager,
					);

					// Fetch the approved expense
					const approvedExpense: Expense | null =
						await this.expenseRepository.findOne(id, manager);
					if (!approvedExpense) {
						throw new ApiError(
							`Failed to fetch approved expense with ID '${id}'.`,
							404,
						);
					}

					// Send notification to driver
					const driverNotification = new NotificationBody(
						"Logged expenses approved",
						"DriverExpensesApproved",
						{ date: new Date() },
						existingExpense.id,
						Priority.HIGH,
					);
					await this.notificationService.sendUserNotification(
						driverNotification,
						existingExpense.driver.id,
						"driver",
						manager,
					);

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.EXPENSE,
						approvedExpense.id,
						ActionType.APPROVE,
						`User with ID '${currentUser.id}' approved expense with ID '${approvedExpense.id}'.`,
						manager,
					);

					// Transform the updated expense to DTO
					const expenseResponseDto: ExpenseResponseDto =
						plainToInstance(ExpenseResponseDto, approvedExpense, {
							excludeExtraneousValues: true,
						});

					return expenseResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to approve expense with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async rejectExpense(
		currentUser: CurrentUser,
		id: string,
		data: RejectExpenseDto,
	): Promise<ExpenseResponseDto> {
		try {
			const result: ExpenseResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch the existing expense by ID
					const existingExpense: Expense | null =
						await this.expenseRepository.findOne(id, manager);
					if (!existingExpense) {
						throw new ApiError(
							`Expense with ID '${id}' not found.`,
							404,
						);
					}

					// Update the expense
					existingExpense.rejectReason = data.reason;
					existingExpense.status = RequestStatus.REJECTED;
					await this.expenseRepository.update(
						existingExpense,
						manager,
					);

					// Fetch the rejected expense
					const rejectedExpense: Expense | null =
						await this.expenseRepository.findOne(id, manager);
					if (!rejectedExpense) {
						throw new ApiError(
							`Failed to fetch rejected expense with ID '${id}'.`,
							404,
						);
					}

					// Send notification to driver
					const driverNotification = new NotificationBody(
						"Logged expenses rejected",
						"DriverExpensesRejected",
						{ date: new Date() },
						existingExpense.id,
						Priority.HIGH,
					);
					await this.notificationService.sendUserNotification(
						driverNotification,
						existingExpense.driver.id,
						"driver",
						manager,
					);

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.EXPENSE,
						rejectedExpense.id,
						ActionType.REJECT,
						`User with ID '${currentUser.id}' rejected expense with ID '${rejectedExpense.id}'.`,
						manager,
					);

					// Transform the updated expense to DTO
					const expenseResponseDto: ExpenseResponseDto =
						plainToInstance(ExpenseResponseDto, rejectedExpense, {
							excludeExtraneousValues: true,
						});

					return expenseResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to reject expense with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async cancelExpense(
		currentUser: CurrentUser,
		id: string,
	): Promise<ExpenseResponseDto> {
		try {
			const result: ExpenseResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch the existing expense by ID
					const existingExpense: Expense | null =
						await this.expenseRepository.findOne(id, manager);
					if (!existingExpense) {
						throw new ApiError(
							`Expense with ID '${id}' not found.`,
							404,
						);
					}

					// Driver role can only cancel their own expenses
					if (
						currentUser.role === RoleMap.DRIVER &&
						existingExpense.driver.id !== currentUser.id
					) {
						throw new ApiError(
							`User '${currentUser.id}' is not authorized to cancel this expense.`,
							403,
						);
					}

					// Update the expense status to cancelled
					existingExpense.status = RequestStatus.CANCELLED;
					await this.expenseRepository.update(
						existingExpense,
						manager,
					);

					// Fetch the cancelled expense
					const canceledExpense: Expense | null =
						await this.expenseRepository.findOne(id, manager);
					if (!canceledExpense) {
						throw new ApiError(
							`Failed to fetch cancelled expense with ID '${id}'.`,
							404,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.EXPENSE,
						canceledExpense.id,
						ActionType.CANCEL,
						`User with ID '${currentUser.id}' canceled expense with ID '${canceledExpense.id}'.`,
						manager,
					);

					// Transform the updated expense to DTO
					const expenseResponseDto: ExpenseResponseDto =
						plainToInstance(ExpenseResponseDto, canceledExpense, {
							excludeExtraneousValues: true,
						});

					return expenseResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to cancel expense with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async deleteExpense(
		currentUser: CurrentUser,
		id: string,
	): Promise<void> {
		try {
			await AppDataSource.transaction(async (manager: EntityManager) => {
				// Fetch the existing expense by ID
				const existingExpense: Expense | null =
					await this.expenseRepository.findOne(id, manager);
				if (!existingExpense) {
					throw new ApiError(
						`Expense with ID '${id}' not found.`,
						404,
					);
				}

				// Driver role can only delete their own expenses
				if (
					currentUser.role === RoleMap.DRIVER &&
					existingExpense.driver.id !== currentUser.id
				) {
					throw new ApiError(
						`User '${currentUser.id}' is not authorized to delete this expense.`,
						403,
					);
				}

				// User cannot delete approved expenses
				if (existingExpense.status === RequestStatus.APPROVED) {
					throw new ApiError(
						`User cannot delete approved expenses`,
						403,
					);
				}

				// Delete the expense
				await this.expenseRepository.delete(id, manager);

				// Log the activity
				await this.activityLogService.createActivityLog(
					currentUser,
					EntityMap.EXPENSE,
					id,
					ActionType.DELETE,
					`User with ID '${currentUser.id}' deleted expense with ID '${id}'.`,
					manager,
				);
			});
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to delete expense with ID '${id}'.`,
						500,
						error,
					);
		}
	}
}

export default ExpenseService;
