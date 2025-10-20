import "reflect-metadata";
import Container from "typedi";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../../src/config/database";
import SettingMap from "../../src/constants/setting-map";
import Role from "../../src/database/entities/Role";
import Permission from "../../src/database/entities/Permission";
import Setting from "../../src/database/entities/Setting";
import RoleRepository from "../../src/repositories/role.repository";
import PermissionRepository from "../../src/repositories/permission.repository";
import SettingRepository from "../../src/repositories/setting.repository";
import RoleService from "../../src/services/role.service";
import PermissionService from "../../src/services/permission.service";
import SettingService from "../../src/services/setting.service";
import CreateRoleDto from "../../src/dtos/role/create-role.dto";
import UpdateRoleDto from "../../src/dtos/role/update-role.dto";
import CreatePermissionDto from "../../src/dtos/permission/create-permission.dto";
import UpdatePermissionDto from "../../src/dtos/permission/update-permission.dto";
import CreateSettingDto from "../../src/dtos/setting/create-setting.dto";
import UpdateSettingDto from "../../src/dtos/setting/update-setting.dto";
import CurrentUser from "../../src/templates/current-user";
import logger from "../../src/utils/logger";
import roles from "./data/roles.json";
import permissions from "./data/permissions.json";
import settings from "./data/settings.json";

const roleRepository: RoleRepository = Container.get(RoleRepository);
const permissionRepository: PermissionRepository =
	Container.get(PermissionRepository);
const settingRepository: SettingRepository = Container.get(SettingRepository);
const roleService: RoleService = Container.get(RoleService);
const permissionService: PermissionService = Container.get(PermissionService);
const settingService: SettingService = Container.get(SettingService);

const updateRoles = async (currentUser: CurrentUser) => {
	for (const role of roles) {
		const existingRole: Role | null = await roleRepository.findOneByKey(
			role.key,
		);
		if (existingRole) {
			// Update role if it exists
			const roleDto: UpdateRoleDto = plainToInstance(
				UpdateRoleDto,
				role,
				{
					excludeExtraneousValues: true,
				},
			);
			await roleService.updateRole(currentUser, existingRole.id, roleDto);
		} else {
			// Create role if it does not exist
			const roleDto: CreateRoleDto = plainToInstance(
				CreateRoleDto,
				role,
				{
					excludeExtraneousValues: true,
				},
			);
			await roleService.createRole(currentUser, roleDto);
		}
	}
};

const updatePermissions = async (currentUser: CurrentUser) => {
	for (const permission of permissions) {
		const existingPermission: Permission | null =
			await permissionRepository.findOneByKey(permission.key);
		if (existingPermission) {
			// Update permission if it exists
			const permissionDto: UpdatePermissionDto = plainToInstance(
				UpdatePermissionDto,
				permission,
				{
					excludeExtraneousValues: true,
				},
			);
			await permissionService.updatePermission(
				currentUser,
				existingPermission.id,
				permissionDto,
			);
		} else {
			// If the permission does not exist, create it
			const permissionDto: CreatePermissionDto = plainToInstance(
				CreatePermissionDto,
				permission,
				{
					excludeExtraneousValues: true,
				},
			);
			await permissionService.createPermission(
				currentUser,
				permissionDto,
			);
		}
	}
};

const updateSettings = async (currentUser: CurrentUser) => {
	for (const setting of settings) {
		const existingSetting: Setting | null =
			await settingRepository.findOneByKey(setting.key);
		if (existingSetting) {
			// Update setting if it exists
			const settingDto: UpdateSettingDto = plainToInstance(
				UpdateSettingDto,
				setting,
				{
					excludeExtraneousValues: true,
				},
			);
			await settingService.updateSetting(
				currentUser,
				existingSetting.id,
				settingDto,
			);
		} else {
			// If the setting does not exist, create it
			const settingDto: CreateSettingDto = plainToInstance(
				CreateSettingDto,
				setting,
				{
					excludeExtraneousValues: true,
				},
			);
			await settingService.createSetting(currentUser, settingDto);
		}
	}
};

const updateMasterData = async () => {
	try {
		await AppDataSource.initialize();
		const currentUser: CurrentUser = new CurrentUser("USR-1", "admin");

		// Update master data
		await updateRoles(currentUser);
		await updatePermissions(currentUser);
		await updateSettings(currentUser);

		// Enable notification and activity log after updating
		const notificationEnabled = await settingService.getSettingByKey(
			SettingMap.NOTIFICATION_ENABLED,
		);
		await settingService.updateSetting(
			currentUser,
			notificationEnabled.id,
			{ value: "true" },
		);
		const activityLogEnabled = await settingService.getSettingByKey(
			SettingMap.ACTIVITY_LOG_ENABLED,
		);
		await settingService.updateSetting(currentUser, activityLogEnabled.id, {
			value: "true",
		});
		logger.info("Master data updated successfully.");
	} catch (error: unknown) {
		logger.error("Error updating master data:", error);
	} finally {
		await AppDataSource.destroy();
	}
};

updateMasterData();
