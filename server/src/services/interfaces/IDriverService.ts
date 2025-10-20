import DetailedDriverResponseDto from "../../dtos/driver/detailed-driver-response.dto";
import CreateDriverDto from "../../dtos/driver/create-driver.dto";
import UpdateDriverDto from "../../dtos/driver/update-driver.dto";
import ResetPasswordDto from "../../dtos/authentication/reset-password.dto";
import SelectLocationDto from "../../dtos/location/select-location.dto";
import SelectVehicleDto from "../../dtos/vehicle/select-vehicle.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IDriverService {
	/**
	 * Retrieves a list of drivers with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of driver response DTOs.
	 */
	getDrivers(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedDriverResponseDto[]>;

	/**
	 * Retrieves a driver by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the driver to retrieve.
	 * @returns A promise that resolves to the driver response DTO.
	 */
	getDriverById(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedDriverResponseDto>;

	/**
	 * Creates a new driver with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating a new driver.
	 * @param avatar - Optional avatar file for the driver.
	 * @returns A promise that resolves to the created driver response DTO.
	 */
	createDriver(
		currentUser: CurrentUser,
		data: CreateDriverDto,
		avatar?: Express.Multer.File,
	): Promise<DetailedDriverResponseDto>;

	/**
	 * Updates an existing driver by their ID with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the driver to update.
	 * @param data - The data for updating the driver.
	 * @param avatar - Optional avatar file for the driver.
	 * @returns A promise that resolves to the updated driver response DTO.
	 */
	updateDriver(
		currentUser: CurrentUser,
		id: string,
		data: UpdateDriverDto,
		avatar?: Express.Multer.File,
	): Promise<DetailedDriverResponseDto>;

	/**
	 * Resets the password for a driver by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the driver whose password is to be reset.
	 * @param data - The data for resetting the driver's password.
	 * @returns A promise that resolves to the updated driver response DTO.
	 */
	resetPassword(
		currentUser: CurrentUser,
		id: string,
		data: ResetPasswordDto,
	): Promise<DetailedDriverResponseDto>;

	/**
	 * Changes the base location for a driver by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the driver whose base location is to be changed.
	 * @param data - The data for changing the driver's base location.
	 * @returns A promise that resolves to the updated driver response DTO.
	 */
	changeBaseLocation(
		currentUser: CurrentUser,
		id: string,
		data: SelectLocationDto,
	): Promise<DetailedDriverResponseDto>;

	/**
	 * Activates a driver by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the driver to activate.
	 * @returns A promise that resolves to the activated driver response DTO.
	 */
	activateDriver(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedDriverResponseDto>;

	/**
	 * Deactivates a driver by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the driver to deactivate.
	 * @returns A promise that resolves to the deactivated driver response DTO.
	 */
	deactivateDriver(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedDriverResponseDto>;

	/**
	 * Suspends a driver by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the driver to suspend.
	 * @returns A promise that resolves to the suspended driver response DTO.
	 */
	suspendDriver(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedDriverResponseDto>;

	/**
	 * Assigns a vehicle to a driver by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the driver to assign the vehicle to.
	 * @param data - The data for assigning the vehicle.
	 * @returns A promise that resolves to the updated driver response DTO.
	 */
	assignVehicle(
		currentUser: CurrentUser,
		id: string,
		data: SelectVehicleDto,
	): Promise<DetailedDriverResponseDto>;
}

export default IDriverService;
