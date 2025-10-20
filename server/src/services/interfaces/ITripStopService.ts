import TripStopResponseDto from "../../dtos/trip-stop/trip-stop-response.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface ITripStopService {
	/**
	 * Retrieves a list of trip stops with pagination and query parameters.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of trip stop response DTOs.
	 */
	getTripStops(
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<TripStopResponseDto[]>;

	/**
	 * Retrieves a trip stop by its ID.
	 * @param id - The ID of the trip stop to retrieve.
	 * @returns A promise that resolves to the trip stop response DTO.
	 */
	getTripStop(id: string): Promise<TripStopResponseDto>;

	/**
	 * Marks a trip stop as arrived.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the trip stop to mark as arrived.
	 * @returns A promise that resolves to the updated trip stop response DTO.
	 */
	arriveTripStop(
		currentUser: CurrentUser,
		id: string,
	): Promise<TripStopResponseDto>;
}

export default ITripStopService;
