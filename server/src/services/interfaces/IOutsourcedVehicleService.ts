import OutsourcedVehicleResponseDto from "../../dtos/outsourced-vehicle/outsourced-vehicle-response.dto";
import CreateOutsourcedVehicleDto from "../../dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import UpdateOutsourcedVehicleDto from "../../dtos/outsourced-vehicle/update-outsourced-vehicle.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IOutsourcedVehicleService {
	/**
	 * Retrieves a list of outsourced vehicles with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of outsourced vehicle response DTOs.
	 */
	getOutsourcedVehicles(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<OutsourcedVehicleResponseDto[]>;

	/**
	 * Retrieves an outsourced vehicle by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the outsourced vehicle to retrieve.
	 * @returns A promise that resolves to the outsourced vehicle response DTO.
	 */
	getOutsourcedVehicleById(
		currentUser: CurrentUser,
		id: string,
	): Promise<OutsourcedVehicleResponseDto>;

	/**
	 * Creates a new outsourced vehicle with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating a new outsourced vehicle.
	 * @returns A promise that resolves to the created outsourced vehicle response DTO.
	 */
	createOutsourcedVehicle(
		currentUser: CurrentUser,
		data: CreateOutsourcedVehicleDto,
	): Promise<OutsourcedVehicleResponseDto>;

	/**
	 * Updates an existing outsourced vehicle by its ID with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the outsourced vehicle to update.
	 * @param data - The data for updating the outsourced vehicle.
	 * @returns A promise that resolves to the updated outsourced vehicle response DTO.
	 */
	updateOutsourcedVehicle(
		currentUser: CurrentUser,
		id: string,
		data: UpdateOutsourcedVehicleDto,
	): Promise<OutsourcedVehicleResponseDto>;
}

export default IOutsourcedVehicleService;
