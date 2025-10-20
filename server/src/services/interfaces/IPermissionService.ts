import PermissionResponseDto from "../../dtos/permission/permission-response.dto";
import CreatePermissionDto from "../../dtos/permission/create-permission.dto";
import UpdatePermissionDto from "../../dtos/permission/update-permission.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IPermissionService {
	/**
	 * Retrieves a list of permissions with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of permission response DTOs.
	 */
	getPermissions(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<PermissionResponseDto[]>;

	/**
	 * Retrieves a permission by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the permission to retrieve.
	 * @returns A promise that resolves to the permission response DTO.
	 */
	getPermissionById(
		currentUser: CurrentUser,
		id: string,
	): Promise<PermissionResponseDto>;

	/**
	 * Creates a new permission with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating the permission.
	 * @returns A promise that resolves to the created permission response DTO.
	 */
	createPermission(
		currentUser: CurrentUser,
		data: CreatePermissionDto,
	): Promise<PermissionResponseDto>;

	/**
	 * Updates an existing permission with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the permission to update.
	 * @param data - The data for updating the permission.
	 * @returns A promise that resolves to the updated permission response DTO.
	 */
	updatePermission(
		currentUser: CurrentUser,
		id: string,
		data: UpdatePermissionDto,
	): Promise<PermissionResponseDto>;
}

export default IPermissionService;
