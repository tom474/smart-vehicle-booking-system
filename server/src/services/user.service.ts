import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import User from "../database/entities/User";
import Role from "../database/entities/Role";
import Vehicle from "../database/entities/Vehicle";
import Schedule from "../database/entities/Schedule";
import Trip from "../database/entities/Trip";
import UserStatus from "../database/enums/UserStatus";
import TripStatus from "../database/enums/TripStatus";
import ActionType from "../database/enums/ActionType";
import VehicleAvailability from "../database/enums/VehicleAvailability";
import UserRepository from "../repositories/user.repository";
import RoleRepository from "../repositories/role.repository";
import VehicleRepository from "../repositories/vehicle.repository";
import ScheduleRepository from "../repositories/schedule.repository";
import TripRepository from "../repositories/trip.repository";
import IUserService from "./interfaces/IUserService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import BlobUploadService from "./upload.service";
import DetailedUserResponseDto from "../dtos/user/detailed-user-response.dto";
import CreateUserDto from "../dtos/user/create-user.dto";
import UpdateUserDto from "../dtos/user/update-user.dto";
import SelectRoleDto from "../dtos/role/select-role.dto";
import SelectVehicleDto from "../dtos/vehicle/select-vehicle.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class UserService implements IUserService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly roleRepository: RoleRepository,
		private readonly vehicleRepository: VehicleRepository,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly tripRepository: TripRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
		private readonly uploadService: BlobUploadService,
	) {}

	public async getUsers(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedUserResponseDto[]> {
		try {
			// Fetch users
			const users: User[] = await this.userRepository.find(
				pagination,
				query,
			);

			// Transform users to DTOs
			const userResponseDtos: DetailedUserResponseDto[] = plainToInstance(
				DetailedUserResponseDto,
				users,
				{
					excludeExtraneousValues: true,
				},
			);

			return userResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch users.", 500, error);
		}
	}

	public async getUserById(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedUserResponseDto> {
		try {
			// Fetch user by ID
			const user: User | null = await this.userRepository.findOne(id);
			if (!user) {
				throw new ApiError(`User with ID '${id}' not found.`, 404);
			}

			// Transform the user to DTO
			const userResponseDto: DetailedUserResponseDto = plainToInstance(
				DetailedUserResponseDto,
				user,
				{
					excludeExtraneousValues: true,
				},
			);

			return userResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch user with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createUser(
		currentUser: CurrentUser,
		data: CreateUserDto,
		avatar?: Express.Multer.File,
	): Promise<DetailedUserResponseDto> {
		try {
			const result: DetailedUserResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Generate an ID for the new user
						const userId: string =
							await this.idCounterService.generateId(
								EntityMap.USER,
								manager,
							);

						// Fetch the role by ID
						const role: Role | null =
							await this.roleRepository.findOne(
								data.roleId,
								manager,
							);
						if (!role) {
							throw new ApiError(
								`Role with ID '${data.roleId}' not found.`,
								404,
							);
						}

						// Upload avatar if provided
						let profileImageKey: string | null = null;
						if (avatar) {
							profileImageKey = await this.uploadService.upload(
								userId,
								avatar,
								{
									overwrite: true,
								},
							);
						}

						// Create a new user
						const user: User = new User(
							userId,
							data.microsoftId,
							data.name,
							data.email,
							role,
							data.phoneNumber,
							profileImageKey,
						);
						await this.userRepository.create(user, manager);

						// Process dedicated vehicle by id if provided
						if (data.dedicatedVehicleId) {
							// Check if the role is Executive
							if (role.key !== RoleMap.EXECUTIVE) {
								throw new ApiError(
									`User is not an '${RoleMap.EXECUTIVE}' to assign a dedicated vehicle.`,
									400,
								);
							}

							// Fetch the dedicated vehicle by ID
							const dedicatedVehicle: Vehicle | null =
								await this.vehicleRepository.findOne(
									data.dedicatedVehicleId,
									manager,
								);
							if (!dedicatedVehicle) {
								throw new ApiError(
									`Vehicle with ID '${data.dedicatedVehicleId}' not found.`,
									404,
								);
							}

							// Assign the dedicated vehicle to the user
							dedicatedVehicle.executive = user;
							await this.vehicleRepository.update(
								dedicatedVehicle,
								manager,
							);
						}

						// Fetch the created user
						const createdUser: User | null =
							await this.userRepository.findOne(userId, manager);
						if (!createdUser) {
							throw new ApiError(
								`Failed to fetch created user with ID '${userId}'.`,
								500,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.USER,
							createdUser.id,
							ActionType.CREATE,
							`User with ID '${currentUser.id}' created user with ID '${createdUser.id}'.`,
							manager,
						);

						// Transform the created user to DTO
						const userResponseDto: DetailedUserResponseDto =
							plainToInstance(
								DetailedUserResponseDto,
								createdUser,
								{
									excludeExtraneousValues: true,
								},
							);

						return userResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create user.", 500, error);
		}
	}

	public async updateUser(
		currentUser: CurrentUser,
		id: string,
		data: UpdateUserDto,
		avatar?: Express.Multer.File,
	): Promise<DetailedUserResponseDto> {
		try {
			// Non-admin users can only update their own information
			if (currentUser.role !== RoleMap.ADMIN && currentUser.id !== id) {
				throw new ApiError(
					"User is not authorized to update this profile.",
					403,
				);
			}

			const result: DetailedUserResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch user by ID
						const user: User | null =
							await this.userRepository.findOne(id, manager);
						if (!user) {
							throw new ApiError(
								`User with ID '${id}' not found.`,
								404,
							);
						}

						// Update the user with new data if provided
						if (data.name !== undefined) {
							user.name = data.name;
						}
						if (data.phoneNumber !== undefined) {
							user.phoneNumber = data.phoneNumber;
						}
						if (avatar !== undefined) {
							if (avatar === null) {
								user.profileImageUrl = null;
							} else {
								user.profileImageUrl =
									await this.uploadService.upload(
										user.id,
										avatar,
										{
											overwrite: true,
										},
									);
							}
						}
						await this.userRepository.update(user, manager);

						// Fetch the updated user
						const updatedUser: User | null =
							await this.userRepository.findOne(user.id, manager);
						if (!updatedUser) {
							throw new ApiError(
								`Failed to fetch updated user with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.USER,
							updatedUser.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' updated user with ID '${updatedUser.id}'.`,
							manager,
						);

						// Transform the updated user to DTO
						const userResponseDto: DetailedUserResponseDto =
							plainToInstance(
								DetailedUserResponseDto,
								updatedUser,
								{
									excludeExtraneousValues: true,
								},
							);

						return userResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update user with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async changeUserRole(
		currentUser: CurrentUser,
		id: string,
		data: SelectRoleDto,
	): Promise<DetailedUserResponseDto> {
		try {
			const result = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch user by ID
					const user: User | null = await this.userRepository.findOne(
						id,
						manager,
					);
					if (!user) {
						throw new ApiError(
							`User with ID '${id}' not found.`,
							404,
						);
					}

					// If the new role is the same as the old role, no need to update
					if (data.roleId === user.role.id) {
						const userResponseDto: DetailedUserResponseDto =
							plainToInstance(DetailedUserResponseDto, user, {
								excludeExtraneousValues: true,
							});
						return userResponseDto;
					}

					// Get the new role by ID
					const role: Role | null = await this.roleRepository.findOne(
						data.roleId,
						manager,
					);
					if (!role) {
						throw new ApiError(
							`Role with ID '${data.roleId}' not found.`,
							404,
						);
					}

					// If the user is changing from Executive to another role, clear the dedicated vehicle
					if (
						user.role.key === RoleMap.EXECUTIVE &&
						role.key !== RoleMap.EXECUTIVE
					) {
						user.dedicatedVehicle = null;
					}

					// Update the user's role
					user.role = role;
					await this.userRepository.update(user, manager);

					// Fetch the updated user
					const updatedUser: User | null =
						await this.userRepository.findOne(user.id, manager);
					if (!updatedUser) {
						throw new ApiError(
							`Failed to fetch updated user with ID '${id}'.`,
							404,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.USER,
						updatedUser.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' changed role of user with ID '${updatedUser.id}' to role with ID '${role.id}'.`,
						manager,
					);

					// Transform the updated user to DTO
					const userResponseDto: DetailedUserResponseDto =
						plainToInstance(DetailedUserResponseDto, updatedUser, {
							excludeExtraneousValues: true,
						});

					return userResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to change role of user with ID '${id}' to role with ID '${data.roleId}'.`,
						500,
						error,
					);
		}
	}

	public async activateUser(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedUserResponseDto> {
		try {
			const result = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch user by ID
					const user: User | null = await this.userRepository.findOne(
						id,
						manager,
					);
					if (!user) {
						throw new ApiError(
							`User with ID '${id}' not found.`,
							404,
						);
					}

					// If the user is already active, no need to update
					if (user.status === UserStatus.ACTIVE) {
						const userResponseDto: DetailedUserResponseDto =
							plainToInstance(DetailedUserResponseDto, user, {
								excludeExtraneousValues: true,
							});
						return userResponseDto;
					}

					// If the user is suspended, only admin user can activate
					if (
						user.status === UserStatus.SUSPENDED &&
						currentUser.role !== RoleMap.ADMIN
					) {
						throw new ApiError(
							`User with ID '${id}' is suspended and can only be activated by an admin.`,
							403,
						);
					}

					// Activate the user
					user.status = UserStatus.ACTIVE;
					await this.userRepository.update(user, manager);

					// Fetch the updated user
					const updatedUser: User | null =
						await this.userRepository.findOne(user.id, manager);
					if (!updatedUser) {
						throw new ApiError(
							`Failed to fetch updated user with ID '${id}'.`,
							404,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.USER,
						updatedUser.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' activated user with ID '${updatedUser.id}'.`,
						manager,
					);

					// Transform the updated user to DTO
					const userResponseDto: DetailedUserResponseDto =
						plainToInstance(DetailedUserResponseDto, updatedUser, {
							excludeExtraneousValues: true,
						});

					return userResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to activate user with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async deactivateUser(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedUserResponseDto> {
		try {
			const result = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch user by ID
					const user: User | null = await this.userRepository.findOne(
						id,
						manager,
					);
					if (!user) {
						throw new ApiError(
							`User with ID '${id}' not found.`,
							404,
						);
					}

					// If the user is already inactive, no need to update
					if (user.status === UserStatus.INACTIVE) {
						const userResponseDto: DetailedUserResponseDto =
							plainToInstance(DetailedUserResponseDto, user, {
								excludeExtraneousValues: true,
							});
						return userResponseDto;
					}

					// If the user is suspended, only admin user can deactivate
					if (
						user.status === UserStatus.SUSPENDED &&
						currentUser.role !== RoleMap.ADMIN
					) {
						throw new ApiError(
							`User with ID '${id}' is suspended and can only be deactivated by an admin.`,
							403,
						);
					}

					// Deactivate the user
					user.status = UserStatus.INACTIVE;
					await this.userRepository.update(user, manager);

					// Fetch the updated user
					const updatedUser: User | null =
						await this.userRepository.findOne(user.id, manager);
					if (!updatedUser) {
						throw new ApiError(
							`Failed to fetch updated user with ID '${id}'.`,
							404,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.USER,
						updatedUser.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' deactivated user with ID '${updatedUser.id}'.`,
						manager,
					);

					// Transform the updated user to DTO
					const userResponseDto: DetailedUserResponseDto =
						plainToInstance(DetailedUserResponseDto, updatedUser, {
							excludeExtraneousValues: true,
						});

					return userResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to deactivate user with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async suspendUser(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedUserResponseDto> {
		try {
			const result = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch user by ID
					const user: User | null = await this.userRepository.findOne(
						id,
						manager,
					);
					if (!user) {
						throw new ApiError(
							`User with ID '${id}' not found.`,
							404,
						);
					}

					// If the user is already suspended, no need to update
					if (user.status === UserStatus.SUSPENDED) {
						const userResponseDto: DetailedUserResponseDto =
							plainToInstance(DetailedUserResponseDto, user, {
								excludeExtraneousValues: true,
							});
						return userResponseDto;
					}

					// Suspend the user
					user.status = UserStatus.SUSPENDED;
					await this.userRepository.update(user, manager);

					// Fetch the updated user
					const updatedUser: User | null =
						await this.userRepository.findOne(user.id, manager);
					if (!updatedUser) {
						throw new ApiError(
							`Failed to fetch updated user with ID '${id}'.`,
							404,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.USER,
						updatedUser.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' suspended user with ID '${updatedUser.id}'.`,
						manager,
					);

					// Transform the updated user to DTO
					const userResponseDto: DetailedUserResponseDto =
						plainToInstance(DetailedUserResponseDto, updatedUser, {
							excludeExtraneousValues: true,
						});

					return userResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to suspend user with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async assignDedicatedVehicle(
		currentUser: CurrentUser,
		id: string,
		data: SelectVehicleDto,
	): Promise<DetailedUserResponseDto> {
		try {
			const result = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch user by ID
					const user: User | null = await this.userRepository.findOne(
						id,
						manager,
					);
					if (!user) {
						throw new ApiError(
							`User with ID '${id}' not found.`,
							404,
						);
					}

					// Check if the user is an Executive
					if (user.role.key !== RoleMap.EXECUTIVE) {
						throw new ApiError(
							`User with ID '${id}' is not an '${RoleMap.EXECUTIVE}' to assign a dedicated vehicle.`,
							403,
						);
					}

					if (data.vehicleId === null) {
						// Update the executive's old dedicated vehicle
						if (user.dedicatedVehicle) {
							const oldVehicle: Vehicle | null =
								await this.vehicleRepository.findOne(
									user.dedicatedVehicle.id,
									manager,
								);
							if (!oldVehicle) {
								throw new ApiError(
									`Failed to fetch executive's old dedicated vehicle with ID '${user.dedicatedVehicle.id}'.`,
									404,
								);
							}
							oldVehicle.executive = null;
							oldVehicle.availability =
								VehicleAvailability.AVAILABLE;
							await this.vehicleRepository.update(
								oldVehicle,
								manager,
							);
						}
					} else {
						if (user.dedicatedVehicle) {
							if (user.dedicatedVehicle.id === data.vehicleId) {
								// If the executive is already assigned to the same vehicle, no need to update
								const userResponseDto: DetailedUserResponseDto =
									plainToInstance(
										DetailedUserResponseDto,
										user,
										{
											excludeExtraneousValues: true,
										},
									);
								return userResponseDto;
							} else {
								// Update the executive's old dedicated vehicle
								const oldVehicle: Vehicle | null =
									await this.vehicleRepository.findOne(
										user.dedicatedVehicle.id,
										manager,
									);
								if (!oldVehicle) {
									throw new ApiError(
										`Vehicle with ID '${user.dedicatedVehicle.id}' not found.`,
										404,
									);
								}
								oldVehicle.executive = null;
								oldVehicle.availability =
									VehicleAvailability.AVAILABLE;
								await this.vehicleRepository.update(
									oldVehicle,
									manager,
								);

								// Clear the user's dedicated vehicle
								user.dedicatedVehicle = null;
							}
						}

						// Get vehicle by ID
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

						// Check if the vehicle is already assigned to another executive
						if (vehicle.executive) {
							throw new ApiError(
								`Vehicle with ID '${data.vehicleId}' is already assigned to executive with ID '${vehicle.executive.id}'. Please unassign the vehicle from the current executive before reassigning it.`,
								403,
							);
						}

						// Assign the new dedicated vehicle to the user
						vehicle.executive = user;
						vehicle.availability = VehicleAvailability.IN_USE;
						await this.vehicleRepository.update(vehicle, manager);

						// Handle vehicle's associated trips
						const schedules: Schedule[] =
							await this.scheduleRepository.find(
								undefined,
								{
									vehicleId: vehicle.id,
									startTimeFrom: Date.now(),
								},
								manager,
							);
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
										`Vehicle with ID '${vehicle.id}' has a scheduled trip with ID '${trip.id}'. Please reassign or cancel the trip before assigning this vehicle to an executive.`,
										403,
									);
								}
							}
						}
					}

					// Fetch the updated user
					const updatedUser: User | null =
						await this.userRepository.findOne(user.id, manager);
					if (!updatedUser) {
						throw new ApiError(
							`Failed to fetch updated user with ID '${id}'.`,
							404,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.USER,
						updatedUser.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' assigned vehicle with ID '${data.vehicleId}' to executive with ID '${updatedUser.id}'.`,
						manager,
					);

					// Transform the updated user to DTO
					const userResponseDto: DetailedUserResponseDto =
						plainToInstance(DetailedUserResponseDto, updatedUser, {
							excludeExtraneousValues: true,
						});

					return userResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to assign vehicle with ID '${data.vehicleId}' to user with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async loadUserById(
		id: string,
		manager?: EntityManager,
	): Promise<User> {
		try {
			const user: User | null = await this.userRepository.findOne(
				id,
				manager,
			);
			if (!user) {
				throw new ApiError(`User with ID '${id}' not found.`, 404);
			}
			return user;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to load user with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async loadUsersByIds(
		ids: string[],
		manager?: EntityManager,
	): Promise<User[]> {
		try {
			const users: User[] = [];
			for (const id of ids) {
				const user: User | null = await this.loadUserById(id, manager);
				users.push(user);
			}
			return users;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to load users with IDs '${ids.join(", ")}'.`,
						500,
						error,
					);
		}
	}
}

export default UserService;
