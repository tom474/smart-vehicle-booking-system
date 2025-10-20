import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import Vendor from "../database/entities/Vendor";
import Schedule from "../database/entities/Schedule";
import Trip from "../database/entities/Trip";
import VendorStatus from "../database/enums/VendorStatus";
import UserStatus from "../database/enums/UserStatus";
import VehicleAvailability from "../database/enums/VehicleAvailability";
import TripStatus from "../database/enums/TripStatus";
import ActionType from "../database/enums/ActionType";
import VendorRepository from "../repositories/vendor.repository";
import DriverRepository from "../repositories/driver.repository";
import VehicleRepository from "../repositories/vehicle.repository";
import ScheduleRepository from "../repositories/schedule.repository";
import TripRepository from "../repositories/trip.repository";
import IVendorService from "./interfaces/IVendorService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import VendorResponseDto from "../dtos/vendor/vendor-response.dto";
import CreateVendorDto from "../dtos/vendor/create-vendor.dto";
import UpdateVendorDto from "../dtos/vendor/update-vendor.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class VendorService implements IVendorService {
	constructor(
		private readonly vendorRepository: VendorRepository,
		private readonly driverRepository: DriverRepository,
		private readonly vehicleRepository: VehicleRepository,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly tripRepository: TripRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getVendors(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<VendorResponseDto[]> {
		try {
			// Fetch vendors
			const vendors: Vendor[] = await this.vendorRepository.find(
				pagination,
				query,
			);

			// Transform vendors to DTOs
			const vendorResponseDtos: VendorResponseDto[] = plainToInstance(
				VendorResponseDto,
				vendors,
				{
					excludeExtraneousValues: true,
				},
			);

			return vendorResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch vendors.", 500, error);
		}
	}

	public async getVendorById(
		currentUser: CurrentUser,
		id: string,
	): Promise<VendorResponseDto> {
		try {
			// Fetch vendor by ID
			const vendor: Vendor | null =
				await this.vendorRepository.findOne(id);
			if (!vendor) {
				throw new ApiError(`Vendor with ID '${id}' not found.`, 404);
			}

			// Transform vendor to DTO
			const vendorResponseDto: VendorResponseDto = plainToInstance(
				VendorResponseDto,
				vendor,
				{
					excludeExtraneousValues: true,
				},
			);

			return vendorResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch vendor with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createVendor(
		currentUser: CurrentUser,
		data: CreateVendorDto,
	): Promise<VendorResponseDto> {
		try {
			const result: VendorResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Create a new vendor
					const vendorId: string =
						await this.idCounterService.generateId(
							EntityMap.VENDOR,
							manager,
						);
					const vendor: Vendor = new Vendor(
						vendorId,
						data.name,
						data.address,
						data.contactPerson,
						data.phoneNumber,
						data.email,
					);
					await this.vendorRepository.create(vendor, manager);

					// Fetch the created vendor
					const createdVendor: Vendor | null =
						await this.vendorRepository.findOne(vendorId, manager);
					if (!createdVendor) {
						throw new ApiError(
							`Failed to fetch created vendor with ID '${vendorId}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.VENDOR,
						createdVendor.id,
						ActionType.CREATE,
						`User with ID '${currentUser.id}' created vendor with ID '${createdVendor.id}'.`,
						manager,
					);

					// Transform the created vendor to DTO
					const vendorResponseDto: VendorResponseDto =
						plainToInstance(VendorResponseDto, createdVendor, {
							excludeExtraneousValues: true,
						});

					return vendorResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create vendor.", 500, error);
		}
	}

	public async updateVendor(
		currentUser: CurrentUser,
		id: string,
		data: UpdateVendorDto,
	): Promise<VendorResponseDto> {
		try {
			const result: VendorResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch the existing vendor by ID
					let vendor: Vendor | null =
						await this.vendorRepository.findOne(id, manager);
					if (!vendor) {
						throw new ApiError(
							`Vendor with ID '${id}' not found.`,
							404,
						);
					}

					// Update the vendor with new data if provided
					if (data.name !== undefined) {
						vendor.name = data.name;
					}
					if (data.address !== undefined) {
						vendor.address = data.address;
					}
					if (data.contactPerson !== undefined) {
						vendor.contactPerson = data.contactPerson;
					}
					if (data.email !== undefined) {
						vendor.email = data.email;
					}
					if (data.phoneNumber !== undefined) {
						vendor.phoneNumber = data.phoneNumber;
					}
					if (data.status !== undefined) {
						vendor.status = data.status;
						if (data.status === VendorStatus.ACTIVE) {
							// Update all associated vehicles to available
							for (const vehicle of vendor.vehicles) {
								vehicle.availability =
									VehicleAvailability.AVAILABLE;
								await this.vehicleRepository.update(
									vehicle,
									manager,
								);
							}

							// Update all associated drivers to active
							for (const driver of vendor.drivers) {
								driver.status = UserStatus.ACTIVE;
								await this.driverRepository.update(
									driver,
									manager,
								);
							}
						} else if (data.status === VendorStatus.INACTIVE) {
							// Update all associated vehicles to out of service
							for (const vehicle of vendor.vehicles) {
								vehicle.availability =
									VehicleAvailability.OUT_OF_SERVICE;
								await this.vehicleRepository.update(
									vehicle,
									manager,
								);

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
												`Vehicle with ID '${vehicle.id}' has a scheduled trip with ID '${trip.id}'. Please reassign or cancel the trip before setting the vendor to inactive.`,
												403,
											);
										}
									}
								}
							}

							// Update all associated drivers to inactive
							for (const driver of vendor.drivers) {
								driver.status = UserStatus.INACTIVE;
								await this.driverRepository.update(
									driver,
									manager,
								);
							}
						}
					}
					await this.vendorRepository.update(vendor, manager);

					// Fetch the updated vendor
					const updatedVendor: Vendor | null =
						await this.vendorRepository.findOne(id, manager);
					if (!updatedVendor) {
						throw new ApiError(
							`Failed to fetch updated vendor with ID '${id}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.VENDOR,
						updatedVendor.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' updated vendor with ID '${updatedVendor.id}'.`,
						manager,
					);

					// Transform the updated vendor to DTO
					const vendorResponseDto: VendorResponseDto =
						plainToInstance(VendorResponseDto, updatedVendor, {
							excludeExtraneousValues: true,
						});

					return vendorResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update vendor with ID '${id}'.`,
						500,
						error,
					);
		}
	}
}

export default VendorService;
