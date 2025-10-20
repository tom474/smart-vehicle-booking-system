import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import Permission from "../database/entities/Permission";
import Role from "../database/entities/Role";
import ActionType from "../database/enums/ActionType";
import PermissionRepository from "../repositories/permission.repository";
import RoleRepository from "../repositories/role.repository";
import IPermissionService from "./interfaces/IPermissionService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import PermissionResponseDto from "../dtos/permission/permission-response.dto";
import CreatePermissionDto from "../dtos/permission/create-permission.dto";
import UpdatePermissionDto from "../dtos/permission/update-permission.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class PermissionService implements IPermissionService {
	constructor(
		private readonly permissionRepository: PermissionRepository,
		private readonly roleRepository: RoleRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getPermissions(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<PermissionResponseDto[]> {
		try {
			// Fetch permissions
			const permissions: Permission[] =
				await this.permissionRepository.find(pagination, query);

			// Transform permissions to DTOs
			const permissionResponseDtos: PermissionResponseDto[] =
				plainToInstance(PermissionResponseDto, permissions, {
					excludeExtraneousValues: true,
				});

			return permissionResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch permissions.", 500, error);
		}
	}

	public async getPermissionById(
		currentUser: CurrentUser,
		id: string,
	): Promise<PermissionResponseDto> {
		try {
			// Fetch permission by ID
			const permission: Permission | null =
				await this.permissionRepository.findOne(id);
			if (!permission) {
				throw new ApiError(
					`Permission with ID '${id}' not found.`,
					404,
				);
			}

			// Transform permission to DTO
			const permissionResponseDto: PermissionResponseDto =
				plainToInstance(PermissionResponseDto, permission, {
					excludeExtraneousValues: true,
				});

			return permissionResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch permission with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createPermission(
		currentUser: CurrentUser,
		data: CreatePermissionDto,
	): Promise<PermissionResponseDto> {
		try {
			const result: PermissionResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Get roles by IDs
						const roles: Role[] = [];
						if (data.roleIds && data.roleIds.length > 0) {
							for (const roleId of data.roleIds) {
								const role: Role | null =
									await this.roleRepository.findOne(
										roleId,
										manager,
									);
								if (!role) {
									throw new ApiError(
										`Role with ID '${roleId}' not found.`,
										404,
									);
								}
								roles.push(role);
							}
						}

						// Create a new permission
						const permissionId: string =
							await this.idCounterService.generateId(
								EntityMap.PERMISSION,
								manager,
							);
						const permission: Permission = new Permission(
							permissionId,
							data.title,
							data.key,
							data.description,
						);
						permission.roles = roles;
						await this.permissionRepository.create(
							permission,
							manager,
						);

						// Fetch the created permission
						const createdPermission: Permission | null =
							await this.permissionRepository.findOne(
								permissionId,
								manager,
							);
						if (!createdPermission) {
							throw new ApiError(
								`Failed to fetch created permission with ID '${permissionId}'.`,
								500,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.PERMISSION,
							createdPermission.id,
							ActionType.CREATE,
							`User with ID '${currentUser.id}' created permission with ID '${createdPermission.id}'.`,
							manager,
						);

						// Transform the created permission to DTO
						const permissionResponseDto: PermissionResponseDto =
							plainToInstance(
								PermissionResponseDto,
								createdPermission,
								{
									excludeExtraneousValues: true,
								},
							);

						return permissionResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create permission.", 500, error);
		}
	}

	public async updatePermission(
		currentUser: CurrentUser,
		id: string,
		data: UpdatePermissionDto,
	): Promise<PermissionResponseDto> {
		try {
			const result: PermissionResponseDto =
				await AppDataSource.transaction(
					async (manager: EntityManager) => {
						// Fetch permission by ID
						const permission: Permission | null =
							await this.permissionRepository.findOne(
								id,
								manager,
							);
						if (!permission) {
							throw new ApiError(
								`Permission with ID '${id}' not found.`,
								404,
							);
						}

						// Update permission with new data if provided
						if (data.title !== undefined) {
							permission.title = data.title;
						}
						if (data.description !== undefined) {
							permission.description = data.description;
						}
						if (data.roleIds !== undefined) {
							const roles: Role[] = [];
							for (const roleId of data.roleIds) {
								const role: Role | null =
									await this.roleRepository.findOne(
										roleId,
										manager,
									);
								if (!role) {
									throw new ApiError(
										`Role with ID '${roleId}' not found.`,
										404,
									);
								}
								roles.push(role);
							}
							permission.roles = roles;
						}
						await this.permissionRepository.update(
							permission,
							manager,
						);

						// Fetch the updated permission
						const updatedPermission: Permission | null =
							await this.permissionRepository.findOne(
								id,
								manager,
							);
						if (!updatedPermission) {
							throw new ApiError(
								`Failed to fetch updated permission with ID '${id}'.`,
								500,
							);
						}

						// Log the activity
						await this.activityLogService.createActivityLog(
							currentUser,
							EntityMap.PERMISSION,
							updatedPermission.id,
							ActionType.UPDATE,
							`User with ID '${currentUser.id}' updated permission with ID '${updatedPermission.id}'.`,
							manager,
						);

						// Transform the updated permission to DTO
						const permissionResponseDto: PermissionResponseDto =
							plainToInstance(
								PermissionResponseDto,
								updatedPermission,
								{
									excludeExtraneousValues: true,
								},
							);

						return permissionResponseDto;
					},
				);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update permission with ID '${id}'.`,
						500,
						error,
					);
		}
	}
}

export default PermissionService;
