import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import Vehicle from "../database/entities/Vehicle";
import Driver from "../database/entities/Driver";
import Vendor from "../database/entities/Vendor";
import User from "../database/entities/User";
import Location from "../database/entities/Location";
import Schedule from "../database/entities/Schedule";
import Trip from "../database/entities/Trip";
import VehicleAvailability from "../database/enums/VehicleAvailability";
import OwnershipType from "../database/enums/OwnershipType";
import UserStatus from "../database/enums/UserStatus";
import TripStatus from "../database/enums/TripStatus";
import ActionType from "../database/enums/ActionType";
import VehicleRepository from "../repositories/vehicle.repository";
import DriverRepository from "../repositories/driver.repository";
import VendorRepository from "../repositories/vendor.repository";
import UserRepository from "../repositories/user.repository";
import LocationRepository from "../repositories/location.repository";
import ScheduleRepository from "../repositories/schedule.repository";
import TripRepository from "../repositories/trip.repository";
import IVehicleService from "./interfaces/IVehicleService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import DetailedVehicleResponseDto from "../dtos/vehicle/detailed-vehicle-response.dto";
import CreateVehicleDto from "../dtos/vehicle/create-vehicle.dto";
import UpdateVehicleDto from "../dtos/vehicle/update-vehicle.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class VehicleService implements IVehicleService {
	constructor(
		private readonly vehicleRepository: VehicleRepository,
		private readonly driverRepository: DriverRepository,
		private readonly vendorRepository: VendorRepository,
		private readonly userRepository: UserRepository,
		private readonly locationRepository: LocationRepository,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly tripRepository: TripRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getVehicles(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedVehicleResponseDto[]> {
		try {
			// Fetch vehicles
			const vehicles: Vehicle[] = await this.vehicleRepository.find(
				pagination,
				query,
			);

			// Transform vehicles to DTOs
			const vehicleResponseDtos: DetailedVehicleResponseDto[] =
				plainToInstance(DetailedVehicleResponseDto, vehicles, {
					excludeExtraneousValues: true,
				});

			return vehicleResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch vehicles.", 500, error);
		}
	}

	public async getAvailableVehicles(
		currentUser: CurrentUser,
		startTime: Date,
		endTime: Date,
		minCapacity: number,
	): Promise<DetailedVehicleResponseDto[]> {
		try {
			const result: DetailedVehicleResponseDto[] =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch all active drivers
						const drivers: Driver[] =
							await this.driverRepository.find(
								undefined,
								{ status: UserStatus.ACTIVE },
								manager,
							);

						// Filter available drivers and vehicles
						const availableVehicleIds: string[] = [];
						for (const driver of drivers) {
							if (
								driver.vehicle &&
								!driver.vehicle.executive &&
								driver.vehicle.availability !==
									VehicleAvailability.UNAVAILABLE &&
								driver.vehicle.availability !==
									VehicleAvailability.OUT_OF_SERVICE &&
								driver.vehicle.capacity >= minCapacity
							) {
								// Check driver's schedules
								if (driver.schedules.length === 0) {
									availableVehicleIds.push(driver.vehicle.id);
								} else {
									// Check if driver is available (no conflicting schedules)
									let hasConflict = false;
									for (const schedule of driver.schedules) {
										if (
											schedule.startTime < endTime &&
											schedule.endTime > startTime
										) {
											hasConflict = true;
											break;
										}
									}

									// Only add vehicle if there are no scheduling conflicts
									if (!hasConflict) {
										availableVehicleIds.push(
											driver.vehicle.id,
										);
									}
								}
							}
						}

						// Fetch the available vehicles by IDs
						const availableVehicles: Vehicle[] = [];
						for (const vehicleId of availableVehicleIds) {
							const vehicle: Vehicle | null =
								await this.vehicleRepository.findOne(
									vehicleId,
									manager,
								);
							if (!vehicle) {
								throw new ApiError(
									`Vehicle with ID '${vehicleId}' not found.`,
									404,
								);
							}
							availableVehicles.push(vehicle);
						}

						// Transform the available vehicles to DTOs
						const vehicleResponseDtos: DetailedVehicleResponseDto[] =
							plainToInstance(
								DetailedVehicleResponseDto,
								availableVehicles,
								{
									excludeExtraneousValues: true,
								},
							);

						return vehicleResponseDtos;
					},
				);
			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to fetch available vehicles.",
						500,
						error,
					);
		}
	}

	public async getVehicleById(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedVehicleResponseDto> {
		try {
			// Fetch vehicle by ID
			const vehicle: Vehicle | null =
				await this.vehicleRepository.findOne(id);
			if (!vehicle) {
				throw new ApiError(`Vehicle with ID '${id}' not found.`, 404);
			}

			// Transform vehicle to DTO
			const vehicleResponseDto: DetailedVehicleResponseDto =
				plainToInstance(DetailedVehicleResponseDto, vehicle, {
					excludeExtraneousValues: true,
				});

			return vehicleResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch vehicle with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createVehicle(
		currentUser: CurrentUser,
		data: CreateVehicleDto,
	): Promise<DetailedVehicleResponseDto> {
		try {
			const result: DetailedVehicleResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Get driver by ID if provided
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

							// Check if the driver is already assigned to a vehicle
							if (driver.vehicle) {
								throw new ApiError(
									`Driver with ID '${data.driverId}' is already assigned to a dedicated vehicle with ID '${driver.vehicle.id}'. Please unassign the driver from the current vehicle before assigning to a new one.`,
									400,
								);
							}
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

						// Get executive by ID if provided
						let executive: User | null = null;
						if (data.executiveId) {
							executive = await this.userRepository.findOne(
								data.executiveId,
								manager,
							);
							if (!executive) {
								throw new ApiError(
									`Executive with ID '${data.executiveId}' not found.`,
									404,
								);
							}

							// Check if user is an executive
							if (executive.role.key !== RoleMap.EXECUTIVE) {
								throw new ApiError(
									"Only executives can have dedicated vehicles.",
									400,
								);
							}

							// Check if the executive already has a dedicated vehicle
							if (executive.dedicatedVehicle) {
								throw new ApiError(
									`Executive with ID '${data.executiveId}' is already assigned to a dedicated vehicle with ID '${executive.dedicatedVehicle.id}'. Please unassign the executive from the current vehicle before assigning to a new one.`,
									400,
								);
							}
						}

						// Get base location by id
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

						// Create a new vehicle
						const vehicleId: string =
							await this.idCounterService.generateId(
								EntityMap.VEHICLE,
								manager,
							);
						const vehicle: Vehicle = new Vehicle(
							vehicleId,
							data.licensePlate,
							data.color,
							data.capacity,
							VehicleAvailability.AVAILABLE,
							vendor
								? OwnershipType.VENDOR
								: OwnershipType.COMPANY,
							baseLocation,
							data.model,
							driver,
							vendor,
							executive,
						);
						await this.vehicleRepository.create(vehicle, manager);

						// Fetch the created vehicle
						const createdVehicle: Vehicle | null =
							await this.vehicleRepository.findOne(
								vehicleId,
								manager,
							);
						if (!createdVehicle) {
							throw new ApiError(
								`Failed to fetch created vehicle with ID '${vehicleId}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.VEHICLE,
							createdVehicle.id,
							ActionType.CREATE,
							`User with ID '${currentUser.id}' created vehicle with ID '${createdVehicle.id}'.`,
							manager,
						);

						// Transform the created vehicle to DTO
						const vehicleResponseDto: DetailedVehicleResponseDto =
							plainToInstance(
								DetailedVehicleResponseDto,
								createdVehicle,
								{
									excludeExtraneousValues: true,
								},
							);

						return vehicleResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create vehicle.", 500, error);
		}
	}

	public async updateVehicle(
		currentUser: CurrentUser,
		id: string,
		data: UpdateVehicleDto,
	): Promise<DetailedVehicleResponseDto> {
		try {
			const result: DetailedVehicleResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch the existing vehicle by ID
						const vehicle: Vehicle | null =
							await this.vehicleRepository.findOne(id, manager);
						if (!vehicle) {
							throw new ApiError(
								`Vehicle with ID '${id}' not found.`,
								404,
							);
						}

						// Update the vehicle with new data if provided
						if (data.licensePlate !== undefined) {
							vehicle.licensePlate = data.licensePlate;
						}
						if (data.model !== undefined) {
							vehicle.model = data.model;
						}
						if (data.color !== undefined) {
							vehicle.color = data.color;
						}
						if (data.capacity !== undefined) {
							vehicle.capacity = data.capacity;
						}
						if (data.availability !== undefined) {
							if (
								data.availability !==
								VehicleAvailability.AVAILABLE
							) {
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
												`Vehicle with ID '${vehicle.id}' has a scheduled trip with ID '${trip.id}'. Please reassign or cancel the trip before changing the vehicle's availability.`,
												403,
											);
										}
									}
								}
							}
							vehicle.availability = data.availability;
						}
						if (data.driverId !== undefined) {
							if (data.driverId === null) {
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
												`Vehicle with ID '${vehicle.id}' has a scheduled trip with ID '${trip.id}'. Please reassign or cancel the trip before unassigning the driver.`,
												403,
											);
										}
									}
								}
								vehicle.driver = null;
							} else {
								// Get driver by ID
								const driver: Driver | null =
									await this.driverRepository.findOne(
										data.driverId,
										manager,
									);
								if (!driver) {
									throw new ApiError(
										`Driver with ID ${data.driverId} not found.`,
										404,
									);
								}

								// Check if the driver is already assigned to another vehicle
								if (
									driver.vehicle &&
									driver.vehicle.id !== vehicle.id
								) {
									throw new ApiError(
										`Driver with ID '${data.driverId}' is already assigned to a vehicle with ID '${driver.vehicle.id}'. Please unassign the driver from the current vehicle before assigning to a new one.`,
										400,
									);
								}
								vehicle.driver = driver;
							}
						}
						if (data.executiveId) {
							if (data.executiveId === null) {
								vehicle.executive = null;
								vehicle.availability =
									VehicleAvailability.AVAILABLE;
							} else {
								// Get executive by ID
								const executive: User | null =
									await this.userRepository.findOne(
										data.executiveId,
										manager,
									);
								if (!executive) {
									throw new ApiError(
										`User with ID '${data.executiveId}' not found.`,
										404,
									);
								}

								// Check if user is an executive
								if (executive.role.key !== RoleMap.EXECUTIVE) {
									throw new ApiError(
										"Only executives can have dedicated vehicles.",
										400,
									);
								}

								// Check if executive already has a dedicated vehicle
								if (
									executive.dedicatedVehicle &&
									executive.dedicatedVehicle.id !== vehicle.id
								) {
									throw new ApiError(
										`Executive with ID '${data.executiveId}' is already assigned to a dedicated vehicle with ID '${executive.dedicatedVehicle.id}'. Please unassign the executive from the current vehicle before assigning to a new one.`,
										400,
									);
								}

								vehicle.executive = executive;
								vehicle.availability =
									VehicleAvailability.IN_USE;
							}
						}
						if (data.baseLocationId !== undefined) {
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
							vehicle.baseLocation = baseLocation;
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
							vehicle.currentLocation = currentLocation;
						}
						await this.vehicleRepository.update(vehicle, manager);

						// Fetch the updated vehicle
						const updatedVehicle: Vehicle | null =
							await this.vehicleRepository.findOne(id, manager);
						if (!updatedVehicle) {
							throw new ApiError(
								`Failed to fetch updated vehicle with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.VEHICLE,
							updatedVehicle.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' updated vehicle with ID '${updatedVehicle.id}'.`,
							manager,
						);

						// Transform the updated vehicle to DTO
						const vehicleResponseDto: DetailedVehicleResponseDto =
							plainToInstance(
								DetailedVehicleResponseDto,
								updatedVehicle,
								{
									excludeExtraneousValues: true,
								},
							);

						return vehicleResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update vehicle with ID '${id}'.`,
						500,
						error,
					);
		}
	}
}

export default VehicleService;
