import { EntityManager } from "typeorm";
import ActivityLogResponseDto from "../../dtos/activity-log/activity-log-response.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IActivityLogService {
	/**
	 * Retrieves a list of activity logs with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of activity log response DTOs.
	 */
	getActivityLogs(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<ActivityLogResponseDto[]>;

	/**
	 * Retrieves an activity log by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the activity log to retrieve.
	 * @returns A promise that resolves to the activity log response DTO.
	 */
	getActivityLogById(
		currentUser: CurrentUser,
		id: string,
	): Promise<ActivityLogResponseDto>;

	/**
	 * Creates a new activity log entry.
	 * @param currentUser - The current user performing the action.
	 * @param entityName - The name of the entity involved in the action.
	 * @param entityId - The ID of the entity involved in the action.
	 * @param actionType - The type of action performed.
	 * @param actionDetails - Details about the action performed.
	 * @param manager - The EntityManager to use for the operation.
	 * @param metadata - Optional metadata associated with the action.
	 * @returns A promise that resolves when the activity log is created.
	 */
	createActivityLog(
		currentUser: CurrentUser,
		entityName: string,
		entityId: string,
		actionType: string,
		actionDetails: string,
		manager: EntityManager,
		metadata?: Record<string, unknown> | null,
	): Promise<void>;
}

export default IActivityLogService;
