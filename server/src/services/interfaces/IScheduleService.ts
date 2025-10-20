import ScheduleResponseDto from "../../dtos/schedule/schedule-response.dto";
import CreateScheduleDto from "../../dtos/schedule/create-schedule.dto";
import UpdateScheduleDto from "../../dtos/schedule/update-schedule.dto";
import CheckConflictScheduleDto from "../../dtos/schedule/check-conflict-schedule.dto";
import CheckConflictScheduleResponseDto from "../../dtos/schedule/check-conflict-schedule-response.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IScheduleService {
	/**
	 * Retrieves a list of schedules with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of schedule response DTOs.
	 */
	getSchedules(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<ScheduleResponseDto[]>;

	/**
	 * Retrieves a schedule by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the schedule to retrieve.
	 * @returns A promise that resolves to the schedule response DTO.
	 */
	getScheduleById(
		currentUser: CurrentUser,
		id: string,
	): Promise<ScheduleResponseDto>;

	/**
	 * Creates a new schedule with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating a new schedule.
	 * @returns A promise that resolves to the created schedule response DTO.
	 */
	createSchedule(
		currentUser: CurrentUser,
		data: CreateScheduleDto,
	): Promise<ScheduleResponseDto>;

	/**
	 * Updates an existing schedule by its ID with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the schedule to update.
	 * @param data - The data for updating the schedule.
	 * @returns A promise that resolves to the updated schedule response DTO.
	 */
	updateSchedule(
		currentUser: CurrentUser,
		id: string,
		data: UpdateScheduleDto,
	): Promise<ScheduleResponseDto>;

	/**
	 * Deletes a schedule by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the schedule to delete.
	 * @returns A promise that resolves when the schedule is deleted.
	 */
	deleteSchedule(currentUser: CurrentUser, id: string): Promise<void>;

	/**
	 * Checks for conflicts in the schedule.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for checking schedule conflicts.
	 * @returns A promise that resolves to the check conflict schedule response DTO.
	 */
	checkConflictSchedule(
		currentUser: CurrentUser,
		data: CheckConflictScheduleDto,
	): Promise<CheckConflictScheduleResponseDto>;
}

export default IScheduleService;
