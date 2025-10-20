import RoleResponseDto from "../../dtos/role/role-response.dto";
import CreateRoleDto from "../../dtos/role/create-role.dto";
import UpdateRoleDto from "../../dtos/role/update-role.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IRoleService {
	/**
	 * Retrieves a list of roles with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of role response DTOs.
	 */
	getRoles(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<RoleResponseDto[]>;

	/**
	 * Retrieves a role by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the role to retrieve.
	 * @returns A promise that resolves to the role response DTO.
	 */
	getRoleById(currentUser: CurrentUser, id: string): Promise<RoleResponseDto>;

	/**
	 * Creates a new role with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating the role.
	 * @returns A promise that resolves to the created role response DTO.
	 */
	createRole(
		currentUser: CurrentUser,
		data: CreateRoleDto,
	): Promise<RoleResponseDto>;

	/**
	 * Updates an existing role with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the role to update.
	 * @param data - The data for updating the role.
	 * @returns A promise that resolves to the updated role response DTO.
	 */
	updateRole(
		currentUser: CurrentUser,
		id: string,
		data: UpdateRoleDto,
	): Promise<RoleResponseDto>;
}

export default IRoleService;
