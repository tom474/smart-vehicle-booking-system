import LeaveRequestResponseDto from "../../dtos/leave-request/leave-request-response.dto";
import CreateLeaveRequestDto from "../../dtos/leave-request/create-leave-request.dto";
import UpdateLeaveRequestDto from "../../dtos/leave-request/update-leave-request.dto";
import RejectLeaveRequestDto from "../../dtos/leave-request/reject-leave-request.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface ILeaveRequestService {
	/**
	 * Retrieves a list of leave requests with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of leave request DTOs.
	 */
	getLeaveRequests(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<LeaveRequestResponseDto[]>;

	/**
	 * Retrieves a leave request by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the leave request to retrieve.
	 * @returns A promise that resolves to the leave request DTO.
	 */
	getLeaveRequestById(
		currentUser: CurrentUser,
		id: string,
	): Promise<LeaveRequestResponseDto>;

	/**
	 * Creates a new leave request with the provided data.
	 * @param currentUser - The current user creating the leave request.
	 * @param data - The data for the new leave request.
	 * @returns A promise that resolves to the created leave request DTO.
	 */
	createLeaveRequest(
		currentUser: CurrentUser,
		data: CreateLeaveRequestDto,
	): Promise<LeaveRequestResponseDto>;

	/**
	 * Updates an existing leave request by its ID.
	 * @param currentUser - The current user updating the leave request.
	 * @param id - The ID of the leave request to update.
	 * @param data - The data for updating the leave request.
	 * @returns A promise that resolves to the updated leave request DTO.
	 */
	updateLeaveRequest(
		currentUser: CurrentUser,
		id: string,
		data: UpdateLeaveRequestDto,
	): Promise<LeaveRequestResponseDto>;

	/**
	 * Approves a leave request by its ID.
	 * @param currentUser - The current user approving the leave request.
	 * @param id - The ID of the leave request to approve.
	 * @returns A promise that resolves to the approved leave request DTO.
	 */
	approveLeaveRequest(
		currentUser: CurrentUser,
		id: string,
	): Promise<LeaveRequestResponseDto>;

	/**
	 * Rejects a leave request by its ID.
	 * @param currentUser - The current user rejecting the leave request.
	 * @param id - The ID of the leave request to reject.
	 * @returns A promise that resolves to the rejected leave request DTO.
	 */
	rejectLeaveRequest(
		currentUser: CurrentUser,
		id: string,
		data: RejectLeaveRequestDto,
	): Promise<LeaveRequestResponseDto>;

	/**
	 * Cancels a leave request by its ID.
	 * @param currentUser - The current user canceling the leave request.
	 * @param id - The ID of the leave request to cancel.
	 * @returns A promise that resolves to the cancelled leave request DTO.
	 */
	cancelLeaveRequest(
		currentUser: CurrentUser,
		id: string,
	): Promise<LeaveRequestResponseDto>;

	/**
	 * Deletes a leave request by its ID.
	 * @param currentUser - The current user deleting the leave request.
	 * @param id - The ID of the leave request to delete.
	 * @returns A promise that resolves when the leave request is deleted.
	 */
	deleteLeaveRequest(currentUser: CurrentUser, id: string): Promise<void>;
}

export default ILeaveRequestService;
