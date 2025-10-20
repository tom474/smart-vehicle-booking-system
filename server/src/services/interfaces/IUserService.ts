import { EntityManager } from "typeorm";
import User from "../../database/entities/User";
import DetailedUserResponseDto from "../../dtos/user/detailed-user-response.dto";
import CreateUserDto from "../../dtos/user/create-user.dto";
import UpdateUserDto from "../../dtos/user/update-user.dto";
import SelectRoleDto from "../../dtos/role/select-role.dto";
import SelectVehicleDto from "../../dtos/vehicle/select-vehicle.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IUserService {
	/**
	 * Retrieves a list of users with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of user response DTOs.
	 */
	getUsers(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedUserResponseDto[]>;

	/**
	 * Retrieves a user by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the user to retrieve.
	 * @returns A promise that resolves to the user response DTO.
	 */
	getUserById(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedUserResponseDto>;

	/**
	 * Creates a new user with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating a new user.
	 * @param avatar - Optional avatar file for the user.
	 * @returns A promise that resolves to the created user response DTO.
	 */
	createUser(
		currentUser: CurrentUser,
		data: CreateUserDto,
		avatar?: Express.Multer.File,
	): Promise<DetailedUserResponseDto>;

	/**
	 * Updates an existing user by their ID with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the user to update.
	 * @param data - The data for updating the user.
	 * @param avatar - Optional avatar file for the user.
	 * @returns A promise that resolves to the updated user response DTO.
	 */
	updateUser(
		currentUser: CurrentUser,
		id: string,
		data: UpdateUserDto,
		avatar?: Express.Multer.File,
	): Promise<DetailedUserResponseDto>;

	/**
	 * Changes the role of an existing user by their ID with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the user to update.
	 * @param data - The data for changing the user's role.
	 * @returns A promise that resolves to the updated user response DTO.
	 */
	changeUserRole(
		currentUser: CurrentUser,
		id: string,
		data: SelectRoleDto,
	): Promise<DetailedUserResponseDto>;

	/**
	 * Activates a user by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the user to activate.
	 * @returns A promise that resolves to the activated user response DTO.
	 */
	activateUser(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedUserResponseDto>;

	/**
	 * Deactivates a user by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the user to deactivate.
	 * @returns A promise that resolves to the deactivated user response DTO.
	 */
	deactivateUser(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedUserResponseDto>;

	/**
	 * Suspends a user by their ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the user to suspend.
	 * @returns A promise that resolves to the suspended user response DTO.
	 */
	suspendUser(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedUserResponseDto>;

	/**
	 * Assigns a dedicated vehicle to a user.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the user to update.
	 * @param data - The data for assigning the dedicated vehicle.
	 * @returns A promise that resolves to the updated user response DTO.
	 */
	assignDedicatedVehicle(
		currentUser: CurrentUser,
		id: string,
		data: SelectVehicleDto,
	): Promise<DetailedUserResponseDto>;

	/**
	 * Loads a user by their ID.
	 * @param id - The ID of the user to load.
	 * @param manager - The entity manager to use for the query (optional).
	 * @returns A promise that resolves to the user entity.
	 */
	loadUserById(id: string, manager?: EntityManager): Promise<User>;

	/**
	 * Loads multiple users by their IDs.
	 * @param ids - The IDs of the users to load.
	 * @param manager - The entity manager to use for the query (optional).
	 * @returns A promise that resolves to an array of user entities.
	 */
	loadUsersByIds(ids: string[], manager?: EntityManager): Promise<User[]>;
}

export default IUserService;
