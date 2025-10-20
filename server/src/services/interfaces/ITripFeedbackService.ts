import CreateTripFeedbackDto from "../../dtos/trip-feedback/create-trip-feedback.dto";
import TripFeedbackResponseDto from "../../dtos/trip-feedback/trip-feedback-response.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface ITripFeedbackService {
	/**
	 * Retrieves a list of trip feedbacks with pagination and query parameters.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of trip feedback response DTOs.
	 */
	getTripFeedbacks(
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<TripFeedbackResponseDto[]>;

	/**
	 * Retrieves the trip feedback submitted by the current user for a specific trip.
	 * @param currentUser - The current user making the request.
	 * @param tripId - The ID of the trip for which to retrieve feedback.
	 * @returns A promise that resolves to the trip feedback response DTO.
	 */
	getOwnTripFeedbacks(
		currentUser: CurrentUser,
		tripId: string,
	): Promise<TripFeedbackResponseDto>;

	/**
	 * Retrieves a trip feedback by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the trip feedback to retrieve.
	 * @returns A promise that resolves to the trip feedback response DTO.
	 */
	getTripFeedbackById(
		currentUser: CurrentUser,
		id: string,
	): Promise<TripFeedbackResponseDto>;

	/**
	 * Creates a new trip feedback with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating a new trip feedback.
	 * @returns A promise that resolves to the created trip feedback response DTO.
	 */
	createTripFeedback(
		currentUser: CurrentUser,
		data: CreateTripFeedbackDto,
	): Promise<TripFeedbackResponseDto>;
}

export default ITripFeedbackService;
