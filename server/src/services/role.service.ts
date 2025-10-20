import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import Role from "../database/entities/Role";
import Permission from "../database/entities/Permission";
import ActionType from "../database/enums/ActionType";
import RoleRepository from "../repositories/role.repository";
import PermissionRepository from "../repositories/permission.repository";
import IRoleService from "./interfaces/IRoleService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import RoleResponseDto from "../dtos/role/role-response.dto";
import CreateRoleDto from "../dtos/role/create-role.dto";
import UpdateRoleDto from "../dtos/role/update-role.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class RoleService implements IRoleService {
	constructor(
		private readonly roleRepository: RoleRepository,
		private readonly permissionRepository: PermissionRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getRoles(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<RoleResponseDto[]> {
		try {
			// Fetch roles
			const roles: Role[] = await this.roleRepository.find(
				pagination,
				query,
			);

			// Transform roles to DTOs
			const roleResponseDtos: RoleResponseDto[] = plainToInstance(
				RoleResponseDto,
				roles,
				{
					excludeExtraneousValues: true,
				},
			);

			return roleResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch roles.", 500, error);
		}
	}

	public async getRoleById(
		currentUser: CurrentUser,
		id: string,
	): Promise<RoleResponseDto> {
		try {
			// Fetch role by ID
			const role: Role | null = await this.roleRepository.findOne(id);
			if (!role) {
				throw new ApiError(`Role with ID '${id}' not found.`, 404);
			}

			// Transform role to DTO
			const roleResponseDto: RoleResponseDto = plainToInstance(
				RoleResponseDto,
				role,
				{
					excludeExtraneousValues: true,
				},
			);

			return roleResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch role with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createRole(
		currentUser: CurrentUser,
		data: CreateRoleDto,
	): Promise<RoleResponseDto> {
		try {
			const result: RoleResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Get the permissions by IDs
					const permissions: Permission[] = [];
					if (data.permissionIds && data.permissionIds.length > 0) {
						for (const permissionId of data.permissionIds) {
							const permission: Permission | null =
								await this.permissionRepository.findOne(
									permissionId,
									manager,
								);
							if (!permission) {
								throw new ApiError(
									`Permission with ID '${permissionId}' not found.`,
									404,
								);
							}
							permissions.push(permission);
						}
					}

					// Create a new role
					const roleId: string =
						await this.idCounterService.generateId(
							EntityMap.ROLE,
							manager,
						);
					const role: Role = new Role(
						roleId,
						data.title,
						data.key,
						data.description,
					);
					role.permissions = permissions;
					await this.roleRepository.create(role, manager);

					// Fetch the created role
					const createdRole: Role | null =
						await this.roleRepository.findOne(roleId, manager);
					if (!createdRole) {
						throw new ApiError(
							`Failed to fetch created role with ID '${roleId}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.ROLE,
						createdRole.id,
						ActionType.CREATE,
						`User with ID '${currentUser.id}' created role with ID '${createdRole.id}'.`,
						manager,
					);

					// Transform the created role to DTO
					const roleResponseDto: RoleResponseDto = plainToInstance(
						RoleResponseDto,
						createdRole,
						{
							excludeExtraneousValues: true,
						},
					);

					return roleResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create role.", 500, error);
		}
	}

	async updateRole(
		currentUser: CurrentUser,
		id: string,
		data: UpdateRoleDto,
	): Promise<RoleResponseDto> {
		try {
			const result: RoleResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch role by ID
					const role: Role | null = await this.roleRepository.findOne(
						id,
						manager,
					);
					if (!role) {
						throw new ApiError(
							`Role with ID '${id}' not found.`,
							404,
						);
					}

					// Update role with new data if provided
					if (data.title !== undefined) {
						role.title = data.title;
					}
					if (data.description !== undefined) {
						role.description = data.description;
					}
					if (data.permissionIds !== undefined) {
						const permissions: Permission[] = [];
						for (const permissionId of data.permissionIds) {
							const permission: Permission | null =
								await this.permissionRepository.findOne(
									permissionId,
									manager,
								);
							if (!permission) {
								throw new ApiError(
									`Permission with ID '${permissionId}' not found.`,
									404,
								);
							}
							permissions.push(permission);
						}
						role.permissions = permissions;
					}
					await this.roleRepository.update(role, manager);

					// Fetch the updated role
					const updatedRole: Role | null =
						await this.roleRepository.findOne(id, manager);
					if (!updatedRole) {
						throw new ApiError(
							`Failed to fetch updated role with ID '${id}'.`,
							500,
						);
					}

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.ROLE,
						updatedRole.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' updated role with ID '${updatedRole.id}'.`,
						manager,
					);

					// Transform the updated role to DTO
					const roleResponseDto: RoleResponseDto = plainToInstance(
						RoleResponseDto,
						updatedRole,
						{
							excludeExtraneousValues: true,
						},
					);

					return roleResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update role with ID '${id}'.`,
						500,
						error,
					);
		}
	}
}

export default RoleService;
