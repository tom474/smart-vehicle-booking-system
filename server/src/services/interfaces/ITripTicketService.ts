import DetailedTripTicketResponseDto from "../../dtos/trip-ticket/detailed-trip-ticket-response.dto";
import BasicUserResponseDto from "../../dtos/user/basic-user-response.dto";
import NoShowReasonDto from "../../dtos/trip-ticket/no-show-reason.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface ITripTicketService {
	/**
	 * Retrieves a list of trip tickets with pagination and query parameters.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of detailed trip ticket response DTOs.
	 */
	getTripTickets(
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedTripTicketResponseDto[]>;

	/**
	 * Retrieves a trip ticket by its ID.
	 * @param id - The ID of the trip ticket to retrieve.
	 * @returns A promise that resolves to the detailed trip ticket response DTO.
	 */
	getTicketById(id: string): Promise<DetailedTripTicketResponseDto>;

	/**
	 * Confirms the pickup of passengers for a specific booking request and trip.
	 * @param currentUser - The current user making the request.
	 * @param bookingRequestId - The ID of the booking request.
	 * @param tripId - The ID of the trip.
	 * @returns A promise that resolves to an array of detailed trip ticket response DTOs after confirming pickup.
	 */
	confirmPickUp(
		currentUser: CurrentUser,
		bookingRequestId: string,
		tripId: string,
	): Promise<DetailedTripTicketResponseDto[]>;

	/**
	 * Confirms the absence of passengers for a specific booking request and trip, along with a reason.
	 * @param currentUser - The current user making the request.
	 * @param bookingRequestId - The ID of the booking request.
	 * @param tripId - The ID of the trip.
	 * @param data - The reason for the passengers' absence.
	 * @returns A promise that resolves to an array of detailed trip ticket response DTOs after confirming absence.
	 */
	confirmPassengersNoShow(
		currentUser: CurrentUser,
		bookingRequestId: string,
		tripId: string,
		data: NoShowReasonDto,
	): Promise<DetailedTripTicketResponseDto[]>;

	/**
	 * Confirms the drop-off of passengers for a specific booking request and trip.
	 * @param currentUser - The current user making the request.
	 * @param bookingRequestId - The ID of the booking request.
	 * @param tripId - The ID of the trip.
	 * @returns A promise that resolves to an array of detailed trip ticket response DTOs after confirming drop-off.
	 */
	confirmDroppedOff(
		currentUser: CurrentUser,
		bookingRequestId: string,
		tripId: string,
	): Promise<DetailedTripTicketResponseDto[]>;

	/**
	 * Retrieves passenger information associated with a specific trip ticket.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the trip ticket.
	 * @returns A promise that resolves to the basic user response DTO of the passenger.
	 */
	getPassengerInformation(
		currentUser: CurrentUser,
		id: string,
	): Promise<BasicUserResponseDto>;
}

export default ITripTicketService;
