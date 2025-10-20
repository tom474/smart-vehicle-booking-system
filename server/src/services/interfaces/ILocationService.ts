import { EntityManager } from "typeorm";
import Location from "../../database/entities/Location";
import LocationResponseDto from "../../dtos/location/location-response.dto";
import CreateLocationDto from "../../dtos/location/create-location.dto";
import UpdateLocationDto from "../../dtos/location/update-location.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface ILocationService {
	/**
	 * Retrieves a list of locations with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of location response DTOs.
	 */
	getLocations(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<LocationResponseDto[]>;

	/**
	 * Retrieves a location by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the location to retrieve.
	 * @returns A promise that resolves to the location response DTO.
	 */
	getLocationById(
		currentUser: CurrentUser,
		id: string,
	): Promise<LocationResponseDto>;

	/**
	 * Creates a new location with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating a new location.
	 * @returns A promise that resolves to the created location DTO.
	 */
	createLocation(
		currentUser: CurrentUser,
		data: CreateLocationDto,
	): Promise<LocationResponseDto>;

	/**
	 * Updates an existing location by its ID with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the location to update.
	 * @param data - The data for updating the location.
	 * @returns A promise that resolves to the updated location DTO.
	 */
	updateLocation(
		currentUser: CurrentUser,
		id: string,
		data: UpdateLocationDto,
	): Promise<LocationResponseDto>;

	/**
	 * Loads a location by its ID or creates a new one if it doesn't exist.
	 * @param input - The ID of the location to load or the data for a new location.
	 * @param manager - The entity manager to use for database operations.
	 * @returns A promise that resolves to the loaded or created location.
	 */
	loadLocation(
		input: string | CreateLocationDto,
		manager: EntityManager,
	): Promise<Location>;
}

export default ILocationService;
