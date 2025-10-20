import VehicleServiceResponseDto from "../../dtos/vehicle-service/vehicle-service-response.dto";
import CreateVehicleServiceDto from "../../dtos/vehicle-service/create-vehicle-service.dto";
import UpdateVehicleServiceDto from "../../dtos/vehicle-service/update-vehicle-service.dto";
import RejectVehicleServiceDto from "../../dtos/vehicle-service/reject-vehicle-service.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IVehicleServiceService {
	/**
	 * Retrieves a list of vehicle services with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of vehicle service DTOs.
	 */
	getVehicleServices(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<VehicleServiceResponseDto[]>;

	/**
	 * Retrieves a vehicle service by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the vehicle service to retrieve.
	 * @returns A promise that resolves to the vehicle service DTO.
	 */
	getVehicleServiceById(
		currentUser: CurrentUser,
		id: string,
	): Promise<VehicleServiceResponseDto>;

	/**
	 * Creates a new vehicle service with the provided data.
	 * @param currentUser - The current user creating the vehicle service.
	 * @param data - The data for the new vehicle service.
	 * @returns A promise that resolves to the created vehicle service DTO.
	 */
	createVehicleService(
		currentUser: CurrentUser,
		data: CreateVehicleServiceDto,
	): Promise<VehicleServiceResponseDto>;

	/**
	 * Updates an existing vehicle service by its ID.
	 * @param currentUser - The current user updating the vehicle service.
	 * @param id - The ID of the vehicle service to update.
	 * @param data - The data for updating the vehicle service.
	 * @returns A promise that resolves to the updated vehicle service DTO.
	 */
	updateVehicleService(
		currentUser: CurrentUser,
		id: string,
		data: UpdateVehicleServiceDto,
	): Promise<VehicleServiceResponseDto>;

	/**
	 * Approves a vehicle service by its ID.
	 * @param currentUser - The current user approving the vehicle service.
	 * @param id - The ID of the vehicle service to approve.
	 * @returns A promise that resolves to the approved vehicle service DTO.
	 */
	approveVehicleService(
		currentUser: CurrentUser,
		id: string,
	): Promise<VehicleServiceResponseDto>;

	/**
	 * Rejects a vehicle service by its ID.
	 * @param currentUser - The current user rejecting the vehicle service.
	 * @param id - The ID of the vehicle service to reject.
	 * @param data - The data for rejecting the vehicle service.
	 * @returns A promise that resolves to the rejected vehicle service DTO.
	 */
	rejectVehicleService(
		currentUser: CurrentUser,
		id: string,
		data: RejectVehicleServiceDto,
	): Promise<VehicleServiceResponseDto>;

	/**
	 * Cancels a vehicle service by its ID.
	 * @param currentUser - The current user canceling the vehicle service.
	 * @param id - The ID of the vehicle service to cancel.
	 * @returns A promise that resolves to the cancelled vehicle service DTO.
	 */
	cancelVehicleService(
		currentUser: CurrentUser,
		id: string,
	): Promise<VehicleServiceResponseDto>;

	/**
	 * Deletes a vehicle service by its ID.
	 * @param currentUser - The current user performing the deletion.
	 * @param id - The ID of the vehicle service to delete.
	 * @returns A promise that resolves when the deletion is complete.
	 */
	deleteVehicleService(currentUser: CurrentUser, id: string): Promise<void>;
}

export default IVehicleServiceService;
