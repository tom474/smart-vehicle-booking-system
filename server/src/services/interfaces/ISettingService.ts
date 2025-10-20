import Setting from "../../database/entities/Setting";
import SettingResponseDto from "../../dtos/setting/setting-response.dto";
import CreateSettingDto from "../../dtos/setting/create-setting.dto";
import UpdateSettingDto from "../../dtos/setting/update-setting.dto";
import CurrentUser from "../../templates/current-user";
import { EntityManager } from "typeorm";

interface ISettingService {
	/**
	 * Retrieves a list of settings with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of setting response DTOs.
	 */
	getSettings(
		currentUser: CurrentUser,
		query: Record<string, unknown>,
	): Promise<SettingResponseDto[]>;

	/**
	 * Retrieves support contact settings.
	 * @returns A promise that resolves to an array of setting response DTOs for support contacts.
	 */
	getSupportContactSettings(): Promise<SettingResponseDto[]>;

	/**
	 * Retrieves a setting by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the setting to retrieve.
	 * @returns A promise that resolves to the setting response DTO.
	 */
	getSettingById(
		currentUser: CurrentUser,
		id: string,
	): Promise<SettingResponseDto>;

	/**
	 * Creates a new setting with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating the setting.
	 * @returns A promise that resolves to the created setting response DTO.
	 */
	createSetting(
		currentUser: CurrentUser,
		data: CreateSettingDto,
	): Promise<SettingResponseDto>;

	/**
	 * Updates an existing setting with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the setting to update.
	 * @param data - The data for updating the setting.
	 * @returns A promise that resolves to the updated setting response DTO.
	 */
	updateSetting(
		currentUser: CurrentUser,
		id: string,
		data: UpdateSettingDto,
	): Promise<SettingResponseDto>;

	/**
	 * Retrieves a setting by its key.
	 * @param key - The key of the setting to retrieve.
	 * @param manager - Optional EntityManager for transactional operations.
	 * @returns A promise that resolves to the setting entity.
	 */
	getSettingByKey(key: string, manager?: EntityManager): Promise<Setting>;
}

export default ISettingService;
