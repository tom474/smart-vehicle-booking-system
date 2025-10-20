import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import Location from "../database/entities/Location";
import LocationType from "../database/enums/LocationType";
import ActionType from "../database/enums/ActionType";
import LocationRepository from "../repositories/location.repository";
import ILocationService from "./interfaces/ILocationService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import LocationResponseDto from "../dtos/location/location-response.dto";
import CreateLocationDto from "../dtos/location/create-location.dto";
import UpdateLocationDto from "../dtos/location/update-location.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class LocationService implements ILocationService {
	constructor(
		private readonly locationRepository: LocationRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getLocations(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<LocationResponseDto[]> {
		try {
			// Fetch locations
			const locations: Location[] = await this.locationRepository.find(
				pagination,
				query,
			);

			// Transform locations to DTOs
			const locationResponseDtos: LocationResponseDto[] = plainToInstance(
				LocationResponseDto,
				locations,
				{
					excludeExtraneousValues: true,
				},
			);

			return locationResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch locations.", 500, error);
		}
	}

	public async getLocationById(
		currentUser: CurrentUser,
		id: string,
	): Promise<LocationResponseDto> {
		try {
			// Fetch location by ID
			const location: Location | null =
				await this.locationRepository.findOne(id);
			if (!location) {
				throw new ApiError(`Location with ID '${id}' not found.`, 404);
			}

			// Transform location to DTO
			const locationResponseDto: LocationResponseDto = plainToInstance(
				LocationResponseDto,
				location,
				{
					excludeExtraneousValues: true,
				},
			);

			return locationResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch location with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createLocation(
		currentUser: CurrentUser,
		data: CreateLocationDto,
	): Promise<LocationResponseDto> {
		try {
			const result: LocationResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Create a new location
					const locationId: string =
						await this.idCounterService.generateId(
							EntityMap.LOCATION,
							manager,
						);
					const location: Location = new Location(
						locationId,
						data.type,
						data.name,
						data.address,
						data.latitude,
						data.longitude,
					);
					await this.locationRepository.create(location, manager);

					// Fetch the created location
					const createdLocation: Location | null =
						await this.locationRepository.findOne(
							locationId,
							manager,
						);
					if (!createdLocation) {
						throw new ApiError(
							`Failed to fetch created location with ID '${locationId}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.LOCATION,
						createdLocation.id,
						ActionType.CREATE,
						`User with ID '${currentUser.id}' created location with ID '${createdLocation.id}'.`,
						manager,
					);

					// Transform the created location to DTO
					const locationResponseDto: LocationResponseDto =
						plainToInstance(LocationResponseDto, createdLocation, {
							excludeExtraneousValues: true,
						});

					return locationResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create location.", 500, error);
		}
	}

	public async updateLocation(
		currentUser: CurrentUser,
		id: string,
		data: UpdateLocationDto,
	): Promise<LocationResponseDto> {
		try {
			const result: LocationResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch location by ID
					const location: Location | null =
						await this.locationRepository.findOne(id, manager);
					if (!location) {
						throw new ApiError(
							`Location with ID '${id}' not found.`,
							404,
						);
					}

					// Update the location with new data if provided
					if (data.name !== undefined) {
						location.name = data.name;
					}
					if (data.address !== undefined) {
						location.address = data.address;
					}
					if (data.latitude !== undefined) {
						location.latitude = data.latitude;
					}
					if (data.longitude !== undefined) {
						location.longitude = data.longitude;
					}
					await this.locationRepository.update(location, manager);

					// Fetch the updated location
					const updatedLocation: Location | null =
						await this.locationRepository.findOne(id, manager);
					if (!updatedLocation) {
						throw new ApiError(
							`Failed to fetch updated location with ID ${id}.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.LOCATION,
						updatedLocation.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' updated location with ID '${updatedLocation.id}'.`,
						manager,
					);

					// Transform the updated location to DTO
					const locationResponseDto: LocationResponseDto =
						plainToInstance(LocationResponseDto, updatedLocation, {
							excludeExtraneousValues: true,
						});

					return locationResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update location with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async loadLocation(
		input: string | CreateLocationDto,
		manager: EntityManager,
	): Promise<Location> {
		try {
			// If the input is a string, get the location by ID
			if (typeof input === "string") {
				const location: Location | null =
					await this.locationRepository.findOne(input, manager);
				if (!location) {
					throw new ApiError(
						`Location with ID '${input}' not found.`,
						404,
					);
				}
				return location;
			}

			// If the input is a CreateLocationDto, check if the location already exists by coordinates
			const existingLocation: Location | null =
				await this.locationRepository.findOneByCoordinates(
					input.latitude,
					input.longitude,
					manager,
				);

			// If the location exists, return it
			if (existingLocation) {
				return existingLocation;
			}

			// If the location does not exist, create a new one.
			const id: string = await this.idCounterService.generateId(
				EntityMap.LOCATION,
				manager,
			);
			const newLocation = new Location(
				id,
				LocationType.CUSTOM,
				input.name,
				input.address,
				input.latitude,
				input.longitude,
			);
			await this.locationRepository.create(newLocation, manager);

			// Fetch the created location
			const createdLocation: Location | null =
				await this.locationRepository.findOne(id, manager);
			if (!createdLocation) {
				throw new ApiError(
					`Failed to fetch created location with ID '${id}'.`,
					500,
				);
			}

			return createdLocation;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to load location.", 500, error);
		}
	}
}

export default LocationService;
