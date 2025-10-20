import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import bcrypt from "bcrypt";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import Driver from "../database/entities/Driver";
import Role from "../database/entities/Role";
import Vehicle from "../database/entities/Vehicle";
import Location from "../database/entities/Location";
import Vendor from "../database/entities/Vendor";
import Schedule from "../database/entities/Schedule";
import Trip from "../database/entities/Trip";
import UserStatus from "../database/enums/UserStatus";
import DriverAvailability from "../database/enums/DriverAvailability";
import OwnershipType from "../database/enums/OwnershipType";
import TripStatus from "../database/enums/TripStatus";
import ActionType from "../database/enums/ActionType";
import DriverRepository from "../repositories/driver.repository";
import RoleRepository from "../repositories/role.repository";
import VehicleRepository from "../repositories/vehicle.repository";
import VendorRepository from "../repositories/vendor.repository";
import LocationRepository from "../repositories/location.repository";
import ScheduleRepository from "../repositories/schedule.repository";
import TripRepository from "../repositories/trip.repository";
import IDriverService from "./interfaces/IDriverService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import BlobUploadService from "./upload.service";
import DetailedDriverResponseDto from "../dtos/driver/detailed-driver-response.dto";
import CreateDriverDto from "../dtos/driver/create-driver.dto";
import UpdateDriverDto from "../dtos/driver/update-driver.dto";
import ResetPasswordDto from "../dtos/authentication/reset-password.dto";
import SelectLocationDto from "../dtos/location/select-location.dto";
import SelectVehicleDto from "../dtos/vehicle/select-vehicle.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class DriverService implements IDriverService {
	constructor(
		private readonly driverRepository: DriverRepository,
		private readonly roleRepository: RoleRepository,
		private readonly vehicleRepository: VehicleRepository,
		private readonly vendorRepository: VendorRepository,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly tripRepository: TripRepository,
		private readonly locationRepository: LocationRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
		private readonly uploadService: BlobUploadService,
	) {}

	public async getDrivers(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedDriverResponseDto[]> {
		try {
			// Fetch drivers
			const drivers: Driver[] = await this.driverRepository.find(
				pagination,
				query,
			);

			// Transform drivers to DTOs
			const driverResponseDtos: DetailedDriverResponseDto[] =
				plainToInstance(DetailedDriverResponseDto, drivers, {
					excludeExtraneousValues: true,
				});

			return driverResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch drivers.", 500, error);
		}
	}

	public async getDriverById(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedDriverResponseDto> {
		try {
			// Fetch driver by ID
			const driver: Driver | null =
				await this.driverRepository.findOne(id);
			if (!driver) {
				throw new ApiError(`Driver with ID '${id}' not found.`, 404);
			}

			// Transform driver to DTO
			const driverResponseDto: DetailedDriverResponseDto =
				plainToInstance(DetailedDriverResponseDto, driver, {
					excludeExtraneousValues: true,
				});

			return driverResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch driver with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createDriver(
		currentUser: CurrentUser,
		data: CreateDriverDto,
		avatar?: Express.Multer.File,
	): Promise<DetailedDriverResponseDto> {
		try {
			const result: DetailedDriverResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Get role for driver
						const role: Role | null =
							await this.roleRepository.findOneByKey(
								RoleMap.DRIVER,
								manager,
							);
						if (!role) {
							throw new ApiError(
								`Role with key '${RoleMap.DRIVER}' not found.`,
								404,
							);
						}

						// Hash the password
						const hashedPassword: string = await bcrypt.hash(
							data.password,
							10,
						);

						// Get base location by ID
						const baseLocation: Location | null =
							await this.locationRepository.findOne(
								data.baseLocationId,
								manager,
							);
						if (!baseLocation) {
							throw new ApiError(
								`Location with ID '${data.baseLocationId}' not found.`,
								404,
							);
						}

						// Get vendor by ID if provided
						let vendor: Vendor | null = null;
						if (data.vendorId) {
							vendor = await this.vendorRepository.findOne(
								data.vendorId,
								manager,
							);
							if (!vendor) {
								throw new ApiError(
									`Vendor with ID '${data.vendorId}' not found.`,
									404,
								);
							}
						}

						// Generate a new ID for driver
						const driverId: string =
							await this.idCounterService.generateId(
								EntityMap.DRIVER,
								manager,
							);

						// Upload avatar if provided
						let profileImageKey: string | null = null;
						if (avatar) {
							profileImageKey = await this.uploadService.upload(
								driverId,
								avatar,
								{
									overwrite: true,
								},
							);
						}

						// Create a new driver
						const driver: Driver = new Driver(
							driverId,
							data.name,
							data.phoneNumber,
							data.username,
							hashedPassword,
							vendor
								? OwnershipType.VENDOR
								: OwnershipType.COMPANY,
							role,
							baseLocation,
							data.email,
							profileImageKey,
							vendor,
						);
						await this.driverRepository.create(driver, manager);

						// Process vehicle by ID if provided
						if (data.vehicleId) {
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

							// Check if the vehicle is already assigned to another driver
							if (vehicle.driver) {
								throw new ApiError(
									`Vehicle with ID '${vehicle.id}' is already assigned to driver with ID '${vehicle.driver.id}'. Please unassign the vehicle from the current driver before assigning it to a new driver.`,
									409,
								);
							}

							vehicle.driver = driver;
							await this.vehicleRepository.update(
								vehicle,
								manager,
							);
						}

						// Fetch the created driver
						const createdDriver: Driver | null =
							await this.driverRepository.findOne(
								driverId,
								manager,
							);
						if (!createdDriver) {
							throw new ApiError(
								`Failed to fetch created driver with ID '${driverId}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.DRIVER,
							createdDriver.id,
							ActionType.CREATE,
							`User with ID '${currentUser.id}' created driver with ID '${createdDriver.id}'.`,
							manager,
						);

						// Transform the created driver to DTO
						const driverResponseDto: DetailedDriverResponseDto =
							plainToInstance(
								DetailedDriverResponseDto,
								createdDriver,
								{
									excludeExtraneousValues: true,
								},
							);

						return driverResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create driver.", 500, error);
		}
	}

	public async updateDriver(
		currentUser: CurrentUser,
		id: string,
		data: UpdateDriverDto,
		avatar?: Express.Multer.File,
	): Promise<DetailedDriverResponseDto> {
		try {
			// Drivers can update their own information
			if (
				currentUser.role !== RoleMap.ADMIN &&
				currentUser.role !== RoleMap.COORDINATOR &&
				currentUser.id !== id
			) {
				throw new ApiError(
					"User is not authorized to update this profile.",
					403,
				);
			}

			const result: DetailedDriverResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch driver by ID
						const driver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!driver) {
							throw new ApiError(
								`Driver with ID '${id}' not found.`,
								404,
							);
						}

						// Update the driver with new data if provided
						if (data.name !== undefined) {
							driver.name = data.name;
						}
						if (data.email !== undefined) {
							driver.email = data.email;
						}
						if (data.phoneNumber !== undefined) {
							driver.phoneNumber = data.phoneNumber;
						}
						if (data.username !== undefined) {
							driver.username = data.username;
						}
						if (data.currentLocationId !== undefined) {
							// Get current location by ID
							const currentLocation: Location | null =
								await this.locationRepository.findOne(
									data.currentLocationId,
									manager,
								);
							if (!currentLocation) {
								throw new ApiError(
									`Location with ID '${data.currentLocationId}' not found.`,
									404,
								);
							}
							driver.currentLocation = currentLocation;
						}
						if (avatar !== undefined) {
							if (avatar === null) {
								driver.profileImageUrl = null;
							} else {
								driver.profileImageUrl =
									await this.uploadService.upload(
										driver.id,
										avatar,
										{ overwrite: true },
									);
							}
						}
						await this.driverRepository.update(driver, manager);

						// Fetch the updated driver
						const updatedDriver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!updatedDriver) {
							throw new ApiError(
								`Failed to fetch updated driver with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.DRIVER,
							updatedDriver.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' updated driver with ID '${updatedDriver.id}'.`,
							manager,
						);

						// Transform the updated driver to DTO
						const driverResponseDto: DetailedDriverResponseDto =
							plainToInstance(
								DetailedDriverResponseDto,
								updatedDriver,
								{
									excludeExtraneousValues: true,
								},
							);

						return driverResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update driver with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async resetPassword(
		currentUser: CurrentUser,
		id: string,
		data: ResetPasswordDto,
	): Promise<DetailedDriverResponseDto> {
		try {
			const result: DetailedDriverResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch driver by ID
						const driver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!driver) {
							throw new ApiError(
								`Driver with ID '${id}' not found.`,
								404,
							);
						}

						// Hash the password
						const hashedPassword: string = await bcrypt.hash(
							data.password,
							10,
						);

						// If the new password is the same as the old one, no need to update
						if (driver.hashedPassword === hashedPassword) {
							return plainToInstance(
								DetailedDriverResponseDto,
								driver,
								{
									excludeExtraneousValues: true,
								},
							);
						}

						// Update the driver's password
						driver.hashedPassword = hashedPassword;
						await this.driverRepository.update(driver, manager);

						// Fetch the updated driver
						const updatedDriver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!updatedDriver) {
							throw new ApiError(
								`Failed to fetch updated driver with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.DRIVER,
							updatedDriver.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' reset password for driver with ID '${updatedDriver.id}'.`,
							manager,
						);

						// Transform the updated driver to DTO
						const driverResponseDto: DetailedDriverResponseDto =
							plainToInstance(
								DetailedDriverResponseDto,
								updatedDriver,
								{
									excludeExtraneousValues: true,
								},
							);

						return driverResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to reset password for driver with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async changeBaseLocation(
		currentUser: CurrentUser,
		id: string,
		data: SelectLocationDto,
	): Promise<DetailedDriverResponseDto> {
		try {
			const result: DetailedDriverResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch driver by ID
						const driver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!driver) {
							throw new ApiError(
								`Driver with ID '${id}' not found.`,
								404,
							);
						}

						// If the new location is the same as the old one, no need to update
						if (driver.baseLocation.id === data.locationId) {
							return plainToInstance(
								DetailedDriverResponseDto,
								driver,
								{
									excludeExtraneousValues: true,
								},
							);
						}

						// Get base location by ID
						const baseLocation: Location | null =
							await this.locationRepository.findOne(
								data.locationId,
								manager,
							);
						if (!baseLocation) {
							throw new ApiError(
								`Location with ID '${data.locationId}' not found.`,
								404,
							);
						}

						// Update the driver's base location
						driver.baseLocation = baseLocation;
						await this.driverRepository.update(driver, manager);

						// Fetch the updated driver
						const updatedDriver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!updatedDriver) {
							throw new ApiError(
								`Failed to fetch updated driver with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.DRIVER,
							updatedDriver.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' changed base location for driver with ID '${updatedDriver.id}' to location with ID '${baseLocation.id}'.`,
							manager,
						);

						// Transform the updated driver to DTO
						const driverResponseDto: DetailedDriverResponseDto =
							plainToInstance(
								DetailedDriverResponseDto,
								updatedDriver,
								{
									excludeExtraneousValues: true,
								},
							);

						return driverResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to change base location for driver with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async activateDriver(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedDriverResponseDto> {
		try {
			const result: DetailedDriverResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch driver by ID
						const driver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!driver) {
							throw new ApiError(
								`Driver with ID '${id}' not found.`,
								404,
							);
						}

						// If the driver is already active, no need to update
						if (driver.status === UserStatus.ACTIVE) {
							return plainToInstance(
								DetailedDriverResponseDto,
								driver,
								{
									excludeExtraneousValues: true,
								},
							);
						}

						// Update the driver's status to active
						driver.status = UserStatus.ACTIVE;
						driver.availability = DriverAvailability.AVAILABLE;
						await this.driverRepository.update(driver, manager);

						// Fetch the updated driver
						const updatedDriver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!updatedDriver) {
							throw new ApiError(
								`Failed to fetch updated driver with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.DRIVER,
							updatedDriver.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' activated driver with ID '${updatedDriver.id}'.`,
							manager,
						);

						// Transform the updated driver to DTO
						const driverResponseDto: DetailedDriverResponseDto =
							plainToInstance(
								DetailedDriverResponseDto,
								updatedDriver,
								{
									excludeExtraneousValues: true,
								},
							);

						return driverResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to activate driver with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async deactivateDriver(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedDriverResponseDto> {
		try {
			const result: DetailedDriverResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch driver by ID
						const driver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!driver) {
							throw new ApiError(
								`Driver with ID '${id}' not found.`,
								404,
							);
						}

						// If the driver is already inactive, no need to update
						if (driver.status === UserStatus.INACTIVE) {
							return plainToInstance(
								DetailedDriverResponseDto,
								driver,
								{
									excludeExtraneousValues: true,
								},
							);
						}

						// Update the driver's status to inactive
						driver.status = UserStatus.INACTIVE;
						driver.availability = DriverAvailability.UNAVAILABLE;
						await this.driverRepository.update(driver, manager);

						// Handle driver's associated trips
						const schedules: Schedule[] =
							await this.scheduleRepository.find(
								undefined,
								{
									driverId: driver.id,
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
										`Driver with ID '${driver.id}' has a scheduled trip with ID '${trip.id}'. Please reassign or cancel the trip before deactivating the driver.`,
										403,
									);
								}
							}
						}

						// Fetch the updated driver
						const updatedDriver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!updatedDriver) {
							throw new ApiError(
								`Failed to fetch updated driver with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.DRIVER,
							updatedDriver.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' deactivated driver with ID '${updatedDriver.id}'.`,
							manager,
						);

						// Transform the updated driver to DTO
						const driverResponseDto: DetailedDriverResponseDto =
							plainToInstance(
								DetailedDriverResponseDto,
								updatedDriver,
								{
									excludeExtraneousValues: true,
								},
							);

						return driverResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to deactivate driver with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async suspendDriver(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedDriverResponseDto> {
		try {
			const result: DetailedDriverResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch driver by ID
						const driver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!driver) {
							throw new ApiError(
								`Driver with ID '${id}' not found.`,
								404,
							);
						}

						// If the driver is already suspended, no need to update
						if (driver.status === UserStatus.SUSPENDED) {
							return plainToInstance(
								DetailedDriverResponseDto,
								driver,
								{
									excludeExtraneousValues: true,
								},
							);
						}

						// Update the driver's status to suspended
						driver.status = UserStatus.SUSPENDED;
						driver.availability = DriverAvailability.UNAVAILABLE;
						await this.driverRepository.update(driver, manager);

						// Handle driver's associated trips
						const schedules: Schedule[] =
							await this.scheduleRepository.find(
								undefined,
								{
									driverId: driver.id,
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
										`Driver with ID '${driver.id}' has a scheduled trip with ID '${trip.id}'. Please reassign or cancel the trip before suspending the driver.`,
										403,
									);
								}
							}
						}

						// Fetch the updated driver
						const updatedDriver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!updatedDriver) {
							throw new ApiError(
								`Failed to fetch updated driver with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.DRIVER,
							updatedDriver.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' suspended driver with ID '${updatedDriver.id}'.`,
							manager,
						);

						// Transform the updated driver to DTO
						const driverResponseDto: DetailedDriverResponseDto =
							plainToInstance(
								DetailedDriverResponseDto,
								updatedDriver,
								{
									excludeExtraneousValues: true,
								},
							);

						return driverResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to suspend driver with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async assignVehicle(
		currentUser: CurrentUser,
		id: string,
		data: SelectVehicleDto,
	): Promise<DetailedDriverResponseDto> {
		try {
			const result: DetailedDriverResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						if (data.vehicleId === undefined) {
							throw new ApiError(`Vehicle ID is required.`, 400);
						}

						// Fetch driver by ID
						const driver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!driver) {
							throw new ApiError(
								`Driver with ID '${id}' not found.`,
								404,
							);
						}

						if (data.vehicleId === null) {
							if (driver.vehicle) {
								// Handle driver's associated trips
								const schedules: Schedule[] =
									await this.scheduleRepository.find(
										undefined,
										{
											driverId: driver.id,
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

										if (
											trip.status ===
											TripStatus.SCHEDULING
										) {
											// If the trip is still scheduling, delete the trip
											await this.tripRepository.delete(
												trip.id,
												manager,
											);
										} else {
											throw new ApiError(
												`Driver with ID '${driver.id}' has a scheduled trip with ID '${trip.id}'. Please reassign or cancel the trip before unassigning the vehicle from the driver.`,
												403,
											);
										}
									}
								}

								// Update the driver's old vehicle
								const oldVehicle: Vehicle | null =
									await this.vehicleRepository.findOne(
										driver.vehicle.id,
										manager,
									);
								if (!oldVehicle) {
									throw new ApiError(
										`Failed to fetch driver's old vehicle with ID '${driver.vehicle.id}'.`,
										404,
									);
								}
								oldVehicle.driver = null;
								await this.vehicleRepository.update(
									oldVehicle,
									manager,
								);
							}
						} else {
							if (driver.vehicle) {
								if (driver.vehicle.id === data.vehicleId) {
									// If the driver is already assigned to the same vehicle, no need to update
									const driverResponseDto: DetailedDriverResponseDto =
										plainToInstance(
											DetailedDriverResponseDto,
											driver,
											{
												excludeExtraneousValues: true,
											},
										);
									return driverResponseDto;
								} else {
									// Update the driver's old vehicle
									const oldVehicle: Vehicle | null =
										await this.vehicleRepository.findOne(
											driver.vehicle.id,
											manager,
										);
									if (!oldVehicle) {
										throw new ApiError(
											`Failed to fetch old vehicle with ID '${driver.vehicle.id}'.`,
											404,
										);
									}
									oldVehicle.driver = null;
									await this.vehicleRepository.update(
										oldVehicle,
										manager,
									);

									// Clear the driver's vehicle
									driver.vehicle = null;
								}
							}

							// Get the vehicle by ID
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

							// Check if the vehicle is already assigned to another driver
							if (
								vehicle.driver &&
								vehicle.driver.id !== driver.id
							) {
								throw new ApiError(
									`Vehicle with ID '${vehicle.id}' is already assigned to driver with ID '${vehicle.driver.id}'. Please unassign the vehicle from the current driver before assigning it to a new driver.`,
									409,
								);
							}

							// Assign the new vehicle to the driver
							vehicle.driver = driver;
							await this.vehicleRepository.update(
								vehicle,
								manager,
							);

							// Update the driver's trip and schedule with the new vehicle
							const schedules: Schedule[] =
								await this.scheduleRepository.find(
									undefined,
									{
										driverId: driver.id,
										startTimeFrom: Date.now(),
									},
									manager,
								);
							for (const schedule of schedules) {
								schedule.vehicle = vehicle;
								await this.scheduleRepository.update(
									schedule,
									manager,
								);
								if (schedule.trip) {
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
									trip.vehicle = vehicle;
									await this.tripRepository.update(
										trip,
										manager,
									);
								}
							}
						}

						// Fetch the updated driver
						const updatedDriver: Driver | null =
							await this.driverRepository.findOne(id, manager);
						if (!updatedDriver) {
							throw new ApiError(
								`Failed to fetch updated driver with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.DRIVER,
							updatedDriver.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' assigned vehicle with ID '${data.vehicleId}' to driver with ID '${updatedDriver.id}'.`,
							manager,
						);

						// Transform the updated driver to DTO
						const driverResponseDto: DetailedDriverResponseDto =
							plainToInstance(
								DetailedDriverResponseDto,
								updatedDriver,
								{
									excludeExtraneousValues: true,
								},
							);

						return driverResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to assign vehicle to driver with ID '${id}'.`,
						500,
						error,
					);
		}
	}
}

export default DriverService;
