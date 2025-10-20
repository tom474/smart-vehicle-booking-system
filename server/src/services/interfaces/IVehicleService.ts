import DetailedVehicleResponseDto from "../../dtos/vehicle/detailed-vehicle-response.dto";
import CreateVehicleDto from "../../dtos/vehicle/create-vehicle.dto";
import UpdateVehicleDto from "../../dtos/vehicle/update-vehicle.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IVehicleService {
	/**
	 * Retrieves a list of vehicles with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of vehicle response DTOs.
	 */
	getVehicles(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedVehicleResponseDto[]>;

	/**
	 * Retrieves a list of available vehicles within a specified time range and capacity.
	 * @param currentUser - The current user making the request.
	 * @param startTime - The start time of the availability window.
	 * @param endTime - The end time of the availability window.
	 * @param minCapacity - The minimum capacity required.
	 * @returns A promise that resolves to an array of available vehicle response DTOs.
	 */
	getAvailableVehicles(
		currentUser: CurrentUser,
		startTime: Date,
		endTime: Date,
		minCapacity: number,
	): Promise<DetailedVehicleResponseDto[]>;

	/**
	 * Retrieves a vehicle by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the vehicle to retrieve.
	 * @returns A promise that resolves to the vehicle response DTO.
	 */
	getVehicleById(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedVehicleResponseDto>;

	/**
	 * Creates a new vehicle with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating a new vehicle.
	 * @returns A promise that resolves to the created vehicle response DTO.
	 */
	createVehicle(
		currentUser: CurrentUser,
		data: CreateVehicleDto,
	): Promise<DetailedVehicleResponseDto>;

	/**
	 * Updates an existing vehicle by its ID with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the vehicle to update.
	 * @param data - The data for updating the vehicle.
	 * @returns A promise that resolves to the updated vehicle response DTO.
	 */
	updateVehicle(
		currentUser: CurrentUser,
		id: string,
		data: UpdateVehicleDto,
	): Promise<DetailedVehicleResponseDto>;
}

export default IVehicleService;
