import Container, { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import SettingMap from "../constants/setting-map";
import Setting from "../database/entities/Setting";
import ActionType from "../database/enums/ActionType";
import SettingRepository from "../repositories/setting.repository";
import ISettingService from "./interfaces/ISettingService";
import IdCounterService from "./id-counter.service";
import ActivityLogService from "./activity-log.service";
import { CronService } from "../cron/cron.service";
import SettingResponseDto from "../dtos/setting/setting-response.dto";
import CreateSettingDto from "../dtos/setting/create-setting.dto";
import UpdateSettingDto from "../dtos/setting/update-setting.dto";
import CurrentUser from "../templates/current-user";
import ApiError from "../templates/api-error";

@Service()
class SettingService implements ISettingService {
	constructor(
		private readonly settingRepository: SettingRepository,
		private readonly idCounterService: IdCounterService,
		private readonly activityLogService: ActivityLogService,
	) {}

	public async getSettings(
		currentUser: CurrentUser,
		query: Record<string, unknown>,
	): Promise<SettingResponseDto[]> {
		try {
			// Fetch settings
			const settings: Setting[] = await this.settingRepository.find(
				undefined,
				query,
			);

			// Transform settings to DTOs
			const settingResponseDtos: SettingResponseDto[] = plainToInstance(
				SettingResponseDto,
				settings,
				{
					excludeExtraneousValues: true,
				},
			);

			return settingResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch settings.", 500, error);
		}
	}

	public async getSupportContactSettings(): Promise<SettingResponseDto[]> {
		try {
			// Fetch support contact-related settings by their keys
			const supportContactSettingKeys: string[] = [
				SettingMap.SUPPORT_CONTACT_NAME,
				SettingMap.SUPPORT_CONTACT_PHONE,
			];
			const supportContactSettings: Setting[] = [];
			for (const key of supportContactSettingKeys) {
				const setting: Setting | null =
					await this.settingRepository.findOneByKey(key);
				if (!setting) {
					throw new ApiError(
						`Setting with key '${key}' not found.`,
						500,
					);
				}
				supportContactSettings.push(setting);
			}

			// Transform settings to DTOs
			const settingResponseDtos: SettingResponseDto[] = plainToInstance(
				SettingResponseDto,
				supportContactSettings,
				{
					excludeExtraneousValues: true,
				},
			);

			return settingResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to fetch support contact settings.",
						500,
						error,
					);
		}
	}

	public async getSettingById(
		currentUser: CurrentUser,
		id: string,
	): Promise<SettingResponseDto> {
		try {
			// Fetch setting by ID
			const setting: Setting | null =
				await this.settingRepository.findOne(id);
			if (!setting) {
				throw new ApiError(`Setting with ID '${id}' not found.`, 404);
			}

			// Transform setting to DTO
			const settingResponseDto: SettingResponseDto = plainToInstance(
				SettingResponseDto,
				setting,
				{
					excludeExtraneousValues: true,
				},
			);

			return settingResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch setting with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createSetting(
		currentUser: CurrentUser,
		data: CreateSettingDto,
	): Promise<SettingResponseDto> {
		try {
			const result: SettingResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Create a new setting entity
					const settingId: string =
						await this.idCounterService.generateId(
							EntityMap.SETTING,
							manager,
						);
					const setting: Setting = new Setting(
						settingId,
						data.title,
						data.key,
						data.value,
						data.description,
					);
					await this.settingRepository.create(setting, manager);

					// Fetch the created setting
					const createdSetting: Setting | null =
						await this.settingRepository.findOne(
							settingId,
							manager,
						);
					if (!createdSetting) {
						throw new ApiError(
							`Failed to fetch created setting with ID '${settingId}'.`,
							500,
						);
					}

					// Transform the created setting to DTO
					const settingResponseDto: SettingResponseDto =
						plainToInstance(SettingResponseDto, createdSetting, {
							excludeExtraneousValues: true,
						});

					return settingResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create setting.", 500, error);
		}
	}

	public async updateSetting(
		currentUser: CurrentUser,
		id: string,
		data: UpdateSettingDto,
	): Promise<SettingResponseDto> {
		try {
			const result: SettingResponseDto = await AppDataSource.transaction(
				async (manager: EntityManager) => {
					// Fetch setting by ID
					const setting: Setting | null =
						await this.settingRepository.findOne(id, manager);
					if (!setting) {
						throw new ApiError(
							`Setting with ID '${id}' not found.`,
							404,
						);
					}

					// Update setting with new data if provided
					if (data.title !== undefined) {
						setting.title = data.title;
					}
					if (data.value !== undefined) {
						// Validate value based on setting key
						const booleanSettings: string[] = [
							SettingMap.TRIP_REMINDER_ENABLED,
							SettingMap.TRIP_FINALIZER_ENABLED,
							SettingMap.TRIP_REMINDER_ENABLED,
							SettingMap.NOTIFICATION_ENABLED,
							SettingMap.NOTIFICATION_EMAIL_ENABLED,
							SettingMap.ACTIVITY_LOG_ENABLED,
						];
						if (booleanSettings.includes(setting.key)) {
							if (
								data.value !== "true" &&
								data.value !== "false"
							) {
								throw new ApiError(
									`Invalid value for setting key '${setting.key}'. Value must be 'true' or 'false'.`,
									400,
								);
							}
						}

						const timeSettings: string[] = [
							SettingMap.TRIP_OPTIMIZER_TIME,
							SettingMap.TRIP_FINALIZER_TIME,
							SettingMap.TRIP_REMINDER_TIME,
						];
						if (timeSettings.includes(setting.key)) {
							const timeRegex: RegExp =
								/^([01]\d|2[0-3]):([0-5]\d)$/;
							if (!timeRegex.test(data.value)) {
								throw new ApiError(
									`Invalid value for setting key '${setting.key}'. Value must be in HH:mm format.`,
									400,
								);
							}
						}

						const scheduleSettings: string[] = [
							SettingMap.TRIP_OPTIMIZER_SCHEDULE,
						];
						if (scheduleSettings.includes(setting.key)) {
							const scheduleOptions: string[] = [
								"daily",
								"monday",
								"tuesday",
								"wednesday",
								"thursday",
								"friday",
								"saturday",
								"sunday",
							];
							if (!scheduleOptions.includes(data.value)) {
								throw new ApiError(
									`Invalid value for setting key '${setting.key}'. Value must be one of the following: ${scheduleOptions.join(", ")}.`,
									400,
								);
							}
						}

						const hourSettings: string[] = [
							SettingMap.TRIP_FINALIZER_LEAD_HOURS,
						];
						if (hourSettings.includes(setting.key)) {
							const hourValue: number = Number(data.value);
							if (
								isNaN(hourValue) ||
								!Number.isInteger(hourValue) ||
								hourValue < 1
							) {
								throw new ApiError(
									`Invalid value for setting key '${setting.key}'. Value must be a positive integer greater than 0.`,
									400,
								);
							}
						}

						setting.value = data.value;
					}
					if (data.description !== undefined) {
						setting.description = data.description;
					}
					await this.settingRepository.update(setting, manager);

					// Fetch the updated setting
					const updatedSetting: Setting | null =
						await this.settingRepository.findOne(id, manager);
					if (!updatedSetting) {
						throw new ApiError(
							`Failed to fetch updated setting with ID '${id}'.`,
							404,
						);
					}

					// Refresh the cron jobs based on updated setting's key if needed
					await this.restartCronJob(updatedSetting.key, manager);

					// Log the activity
					await this.activityLogService.createActivityLog(
						currentUser,
						EntityMap.SETTING,
						updatedSetting.id,
						ActionType.UPDATE,
						`User with ID '${currentUser.id}' updated setting with ID '${updatedSetting.id}'.`,
						manager,
					);

					// Transform the updated setting to DTO
					const settingResponseDto: SettingResponseDto =
						plainToInstance(SettingResponseDto, updatedSetting, {
							excludeExtraneousValues: true,
						});

					return settingResponseDto;
				},
			);

			return result;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to update setting with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async getSettingByKey(
		key: string,
		manager?: EntityManager,
	): Promise<Setting> {
		try {
			// Fetch setting by key
			const setting: Setting | null =
				await this.settingRepository.findOneByKey(key, manager);
			if (!setting) {
				throw new ApiError(`Setting with key '${key}' not found.`, 404);
			}

			return setting;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch setting with key '${key}'.`,
						500,
						error,
					);
		}
	}

	private getCronJobNameForSetting(
		settingKey: string,
	): "schedule-upcoming-trips" | "trip-reminder" | "trip-optimize" | null {
		const cronJobMappings: Record<
			string,
			"schedule-upcoming-trips" | "trip-reminder" | "trip-optimize"
		> = {
			// Schedule/Time settings - trigger restart
			[SettingMap.TRIP_FINALIZER_TIME]: "schedule-upcoming-trips",
			[SettingMap.TRIP_REMINDER_TIME]: "trip-reminder",
			[SettingMap.TRIP_OPTIMIZER_TIME]: "trip-optimize",
			[SettingMap.TRIP_OPTIMIZER_SCHEDULE]: "trip-optimize",

			// Enable/Disable settings - trigger enable/disable
			[SettingMap.TRIP_FINALIZER_ENABLED]: "schedule-upcoming-trips",
			[SettingMap.TRIP_REMINDER_ENABLED]: "trip-reminder",
			[SettingMap.TRIP_OPTIMIZER_ENABLED]: "trip-optimize",
		};

		return cronJobMappings[settingKey] || null;
	}

	private async restartCronJob(
		settingKey: string,
		manager: EntityManager,
	): Promise<void> {
		// Get the cron job name for the setting
		const jobName:
			| "schedule-upcoming-trips"
			| "trip-reminder"
			| "trip-optimize"
			| null = this.getCronJobNameForSetting(settingKey);

		// If setting doesn't affect any cron jobs, no restart needed
		if (!jobName) {
			return;
		}

		try {
			// Add a small delay to ensure database changes are visible
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Avoid circular dependency (CronService and SettingService import each other)
			const { CronService } = await import("../cron/cron.service");
			const cronService: CronService = Container.get(CronService);

			// Check if this is an enable/disable setting
			const enabledSettings: string[] = [
				SettingMap.TRIP_FINALIZER_ENABLED,
				SettingMap.TRIP_REMINDER_ENABLED,
				SettingMap.TRIP_OPTIMIZER_ENABLED,
			];

			if (enabledSettings.includes(settingKey)) {
				// Handle enable/disable
				const setting: Setting = await this.getSettingByKey(
					settingKey,
					manager,
				);
				const isEnabled: boolean = setting.value === "true";

				if (isEnabled) {
					await cronService.enable(jobName, manager);
				} else {
					await cronService.disable(jobName);
				}
			} else {
				// Handle schedule/time changes
				await cronService.restart(jobName, manager);
			}
		} catch (error: unknown) {
			throw new ApiError("Failed to restart automation job.", 500, error);
		}
	}
}

export default SettingService;
