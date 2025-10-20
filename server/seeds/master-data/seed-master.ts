import "reflect-metadata";
import Container from "typedi";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../../src/config/database";
import SettingMap from "../../src/constants/setting-map";
import SettingService from "../../src/services/setting.service";
import RoleService from "../../src/services/role.service";
import PermissionService from "../../src/services/permission.service";
import CreateSettingDto from "../../src/dtos/setting/create-setting.dto";
import CreateRoleDto from "../../src/dtos/role/create-role.dto";
import CreatePermissionDto from "../../src/dtos/permission/create-permission.dto";
import CurrentUser from "../../src/templates/current-user";
import logger from "../../src/utils/logger";
import settings from "./data/settings.json";
import roles from "./data/roles.json";
import permissions from "./data/permissions.json";

const settingService: SettingService = Container.get(SettingService);
const roleService: RoleService = Container.get(RoleService);
const permissionService: PermissionService = Container.get(PermissionService);

const seedSettings = async (currentUser: CurrentUser) => {
	// Transform the setting data into DTOs
	const settingDtos: CreateSettingDto[] = plainToInstance(
		CreateSettingDto,
		settings,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create settings
	for (const settingDto of settingDtos) {
		await settingService.createSetting(currentUser, settingDto);
	}
};

const seedRoles = async (currentUser: CurrentUser) => {
	// Transform the role data into DTOs
	const roleDtos: CreateRoleDto[] = plainToInstance(CreateRoleDto, roles, {
		excludeExtraneousValues: true,
	});

	// Create roles
	for (const roleDto of roleDtos) {
		await roleService.createRole(currentUser, roleDto);
	}
};

const seedPermissions = async (currentUser: CurrentUser) => {
	// Transform the permission data into DTOs
	const permissionDtos: CreatePermissionDto[] = plainToInstance(
		CreatePermissionDto,
		permissions,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create permissions
	for (const permissionDto of permissionDtos) {
		await permissionService.createPermission(currentUser, permissionDto);
	}
};

const seedMasterData = async () => {
	try {
		await AppDataSource.initialize();
		const currentUser: CurrentUser = new CurrentUser("USR-1", "admin");

		// Seed master data
		await seedSettings(currentUser);
		await seedRoles(currentUser);
		await seedPermissions(currentUser);

		// Enable notification and activity log after seeding
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
		logger.info("Master data seeded successfully.");
	} catch (error: unknown) {
		logger.error("Error seeding master data.", error);
	} finally {
		await AppDataSource.destroy();
	}
};

seedMasterData();
