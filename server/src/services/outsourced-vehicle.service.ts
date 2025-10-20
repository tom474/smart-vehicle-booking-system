import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import OutsourcedVehicle from "../database/entities/OutsourcedVehicle";
import Vendor from "../database/entities/Vendor";
import ActionType from "../database/enums/ActionType";
import OutsourcedVehicleRepository from "../repositories/outsourced-vehicle.repository";
import VendorRepository from "../repositories/vendor.repository";
import IOutsourcedVehicleService from "./interfaces/IOutsourcedVehicleService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import OutsourcedVehicleResponseDto from "../dtos/outsourced-vehicle/outsourced-vehicle-response.dto";
import CreateOutsourcedVehicleDto from "../dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import UpdateOutsourcedVehicleDto from "../dtos/outsourced-vehicle/update-outsourced-vehicle.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class OutsourcedVehicleService implements IOutsourcedVehicleService {
	constructor(
		private readonly outsourcedVehicleRepository: OutsourcedVehicleRepository,
		private readonly vendorRepository: VendorRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getOutsourcedVehicles(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<OutsourcedVehicleResponseDto[]> {
		try {
			// Fetch outsourced vehicles
			const outsourcedVehicles: OutsourcedVehicle[] =
				await this.outsourcedVehicleRepository.find(pagination, query);

			// Transform outsourced vehicles to DTOs
			const outsourcedVehicleResponseDtos: OutsourcedVehicleResponseDto[] =
				plainToInstance(
					OutsourcedVehicleResponseDto,
					outsourcedVehicles,
					{ excludeExtraneousValues: true },
				);

			return outsourcedVehicleResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to fetch outsourced vehicles.",
						500,
						error,
					);
		}
	}

	public async getOutsourcedVehicleById(
		currentUser: CurrentUser,
		id: string,
	): Promise<OutsourcedVehicleResponseDto> {
		try {
			// Fetch the outsourced vehicle by ID
			const outsourcedVehicle: OutsourcedVehicle | null =
				await this.outsourcedVehicleRepository.findOne(id);
			if (!outsourcedVehicle) {
				throw new ApiError(
					`Outsourced vehicle with ID '${id}' not found.`,
					404,
				);
			}

			// Transform the outsourced vehicle to DTO
			const outsourcedVehicleResponseDto: OutsourcedVehicleResponseDto =
				plainToInstance(
					OutsourcedVehicleResponseDto,
					outsourcedVehicle,
					{
						excludeExtraneousValues: true,
					},
				);

			return outsourcedVehicleResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch outsourced vehicle with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createOutsourcedVehicle(
		currentUser: CurrentUser,
		data: CreateOutsourcedVehicleDto,
	): Promise<OutsourcedVehicleResponseDto> {
		try {
			const result: OutsourcedVehicleResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
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

						// Create a new outsourced vehicle
						const outsourcedVehicleId: string =
							await this.idCounterService.generateId(
								EntityMap.OUTSOURCED_VEHICLE,
								manager,
							);
						const outsourcedVehicle: OutsourcedVehicle =
							new OutsourcedVehicle(
								outsourcedVehicleId,
								data.driverName,
								data.phoneNumber,
								data.licensePlate,
								data.color,
								data.capacity,
								data.model,
								vendor,
							);
						await this.outsourcedVehicleRepository.create(
							outsourcedVehicle,
							manager,
						);

						// Fetch the created outsourced vehicle
						const createdOutsourcedVehicle: OutsourcedVehicle | null =
							await this.outsourcedVehicleRepository.findOne(
								outsourcedVehicleId,
								manager,
							);
						if (!createdOutsourcedVehicle) {
							throw new ApiError(
								`Failed to fetch created outsourced vehicle with ID '${outsourcedVehicleId}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.OUTSOURCED_VEHICLE,
							createdOutsourcedVehicle.id,
							ActionType.CREATE,
							`User with ID '${currentUser.id}' created outsourced vehicle with ID '${createdOutsourcedVehicle.id}'.`,
							manager,
						);

						// Transform the created outsourced vehicle to DTO
						const createdOutsourcedVehicleResponseDto: OutsourcedVehicleResponseDto =
							plainToInstance(
								OutsourcedVehicleResponseDto,
								createdOutsourcedVehicle,
								{
									excludeExtraneousValues: true,
								},
							);

						return createdOutsourcedVehicleResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to create outsourced vehicle.",
						500,
						error,
					);
		}
	}

	public async updateOutsourcedVehicle(
		currentUser: CurrentUser,
		id: string,
		data: UpdateOutsourcedVehicleDto,
	): Promise<OutsourcedVehicleResponseDto> {
		try {
			const result: OutsourcedVehicleResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch outsourced vehicle by ID
						const outsourcedVehicle: OutsourcedVehicle | null =
							await this.outsourcedVehicleRepository.findOne(
								id,
								manager,
							);
						if (!outsourcedVehicle) {
							throw new ApiError(
								`Outsourced vehicle with ID '${id}' not found.`,
								404,
							);
						}

						// Update the outsourced vehicle with new data if provided
						if (data.driverName !== undefined) {
							outsourcedVehicle.driverName = data.driverName;
						}
						if (data.phoneNumber !== undefined) {
							outsourcedVehicle.phoneNumber = data.phoneNumber;
						}
						if (data.licensePlate !== undefined) {
							outsourcedVehicle.licensePlate = data.licensePlate;
						}
						if (data.model !== undefined) {
							outsourcedVehicle.model = data.model;
						}
						if (data.color !== undefined) {
							outsourcedVehicle.color = data.color;
						}
						if (data.capacity !== undefined) {
							outsourcedVehicle.capacity = data.capacity;
						}
						if (data.vendorId !== undefined) {
							if (data.vendorId === null) {
								outsourcedVehicle.vendor = null;
							} else {
								const vendor: Vendor | null =
									await this.vendorRepository.findOne(
										data.vendorId,
										manager,
									);
								if (!vendor) {
									throw new ApiError(
										`Vendor with ID '${data.vendorId}' not found.`,
										404,
									);
								}
								outsourcedVehicle.vendor = vendor;
							}
						}
						await this.outsourcedVehicleRepository.update(
							outsourcedVehicle,
							manager,
						);

						// Fetch the updated outsourced vehicle
						const updatedOutsourcedVehicle: OutsourcedVehicle | null =
							await this.outsourcedVehicleRepository.findOne(
								id,
								manager,
							);
						if (!updatedOutsourcedVehicle) {
							throw new ApiError(
								`Failed to fetch updated outsourced vehicle with ID '${id}'.`,
								404,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.OUTSOURCED_VEHICLE,
							updatedOutsourcedVehicle.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' updated outsourced vehicle with ID '${updatedOutsourcedVehicle.id}'.`,
							manager,
						);

						// Transform the updated outsourced vehicle to DTO
						const updatedOutsourcedVehicleResponseDto: OutsourcedVehicleResponseDto =
							plainToInstance(
								OutsourcedVehicleResponseDto,
								outsourcedVehicle,
								{
									excludeExtraneousValues: true,
								},
							);

						return updatedOutsourcedVehicleResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update outsourced vehicle with ID '${id}'.`,
						500,
						error,
					);
		}
	}
}

export default OutsourcedVehicleService;
