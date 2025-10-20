import { Service } from "typedi";
import { EntityManager } from "typeorm";
import { plainToInstance } from "class-transformer";
import EntityMap from "../constants/entity-map";
import SettingMap from "../constants/setting-map";
import ActivityLog from "../database/entities/ActivityLog";
import Setting from "../database/entities/Setting";
import ActionType from "../database/enums/ActionType";
import ActivityLogRepository from "../repositories/activity-log.repository";
import SettingRepository from "../repositories/setting.repository";
import IActivityLogService from "./interfaces/IActivityLogService";
import IdCounterService from "./id-counter.service";
import ActivityLogResponseDto from "../dtos/activity-log/activity-log-response.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class ActivityLogService implements IActivityLogService {
	constructor(
		private readonly activityLogRepository: ActivityLogRepository,
		private readonly settingRepository: SettingRepository,
		private readonly idCounterService: IdCounterService,
	) {}

	public async getActivityLogs(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<ActivityLogResponseDto[]> {
		try {
			// Fetch activity logs
			const activityLogs: ActivityLog[] =
				await this.activityLogRepository.find(pagination, query);

			// Transform activity logs to DTOs
			const activityLogResponseDtos: ActivityLogResponseDto[] =
				plainToInstance(ActivityLogResponseDto, activityLogs, {
					excludeExtraneousValues: true,
				});

			return activityLogResponseDtos;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to fetch activity logs.", 500, error);
		}
	}

	public async getActivityLogById(
		currentUser: CurrentUser,
		id: string,
	): Promise<ActivityLogResponseDto> {
		try {
			// Fetch the activity log by ID
			const activityLog: ActivityLog | null =
				await this.activityLogRepository.findOne(id);
			if (!activityLog) {
				throw new ApiError(
					`Activity log with ID '${id}' not found.`,
					404,
				);
			}

			// Transform activity log to DTO
			const activityLogResponseDto: ActivityLogResponseDto =
				plainToInstance(ActivityLogResponseDto, activityLog, {
					excludeExtraneousValues: true,
				});

			return activityLogResponseDto;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to fetch activity log with ID '${id}'.`,
						500,
						error,
					);
		}
	}

	public async createActivityLog(
		currentUser: CurrentUser,
		entityName: string,
		entityId: string,
		actionType: ActionType,
		actionDetails: string,
		manager: EntityManager,
		metadata?: Record<string, unknown> | null,
	): Promise<void> {
		try {
			// Check if activity logging is enabled
			const activityLogEnabledSetting: Setting | null =
				await this.settingRepository.findOneByKey(
					SettingMap.ACTIVITY_LOG_ENABLED,
					manager,
				);
			if (!activityLogEnabledSetting) {
				throw new ApiError(
					`Setting with key '${SettingMap.ACTIVITY_LOG_ENABLED}' not found.`,
					404,
				);
			}
			if (activityLogEnabledSetting.value === "false") {
				return;
			}

			// Create new activity log
			const activityLogId: string =
				await this.idCounterService.generateId(
					EntityMap.ACTIVITY_LOG,
					manager,
				);
			const newActivityLog: ActivityLog = new ActivityLog(
				activityLogId,
				currentUser.role,
				currentUser.id,
				entityName,
				entityId,
				actionType,
				actionDetails,
				metadata,
			);
			await this.activityLogRepository.create(newActivityLog, manager);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to create activity log.", 500, error);
		}
	}
}

export default ActivityLogService;
