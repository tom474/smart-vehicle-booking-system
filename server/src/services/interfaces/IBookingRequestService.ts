import BookingRequestResponseDto from "../../dtos/booking-request/booking-request-response.dto";
import CreateBookingRequestDto from "../../dtos/booking-request/create-booking-request.dto";
import UpdateBookingRequestDto from "../../dtos/booking-request/update-booking-request.dto";
import RejectBookingRequestDto from "../../dtos/booking-request/reject-booking-request.dto";
import CancelBookingRequestDto from "../../dtos/booking-request/cancel-booking-request.dto";
import DetailedVehicleResponseDto from "../../dtos/vehicle/detailed-vehicle-response.dto";
import SelectVehicleDto from "../../dtos/vehicle/select-vehicle.dto";
import CreateOutsourcedVehicleDto from "../../dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IBookingRequestService {
	/**
	 * Retrieves a list of booking requests with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of booking request DTOs.
	 */
	getBookingRequests(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<BookingRequestResponseDto[]>;

	/**
	 * Retrieves a booking request by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the booking request to retrieve.
	 * @returns A promise that resolves to the booking request DTO.
	 */
	getBookingRequestById(
		currentUser: CurrentUser,
		id: string,
	): Promise<BookingRequestResponseDto>;

	/**
	 * Creates a new booking request with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for the new booking request.
	 * @returns A promise that resolves to an array of booking request DTOs.
	 */
	createBookingRequest(
		currentUser: CurrentUser,
		data: CreateBookingRequestDto,
	): Promise<BookingRequestResponseDto[]>;

	/**
	 * Updates an existing booking request by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the booking request to update.
	 * @param data - The data to update the booking request with.
	 * @returns A promise that resolves to the updated booking request DTO.
	 */
	updateBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: UpdateBookingRequestDto,
	): Promise<BookingRequestResponseDto>;

	/**
	 * Rejects a booking request by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the booking request to reject.
	 * @param data - The data for rejecting the booking request.
	 * @returns A promise that resolves to the rejected booking request DTO.
	 */
	rejectBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: RejectBookingRequestDto,
	): Promise<BookingRequestResponseDto>;

	/**
	 * Cancels a booking request by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the booking request to cancel.
	 * @param data - The data for canceling the booking request.
	 * @returns A promise that resolves to the canceled booking request DTO.
	 */
	cancelBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: CancelBookingRequestDto,
	): Promise<BookingRequestResponseDto>;

	/**
	 * Deletes a booking request by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the booking request to delete.
	 * @returns A promise that resolves when the booking request is deleted.
	 */
	deleteBookingRequest(currentUser: CurrentUser, id: string): Promise<void>;

	/**
	 * Retrieves available vehicles for a specific booking request.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the booking request.
	 * @returns A promise that resolves to an array of available vehicle DTOs.
	 */
	getAvailableVehiclesForBookingRequest(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedVehicleResponseDto[]>;

	/**
	 * Assigns a vehicle to a specific booking request.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the booking request.
	 * @param data - The data for assigning the vehicle.
	 * @returns A promise that resolves to the updated booking request DTO.
	 */
	assignVehicleToBookingRequest(
		currentUser: CurrentUser,
		id: string,
		data: SelectVehicleDto,
	): Promise<BookingRequestResponseDto>;

	/**
	 * Assigns an outsourced vehicle to a specific booking request.
	 * @param currentUser - The current user making the request.
	 * @param bookingRequestId - The ID of the booking request.
	 * @param data - The data for the outsourced vehicle.
	 * @returns A promise that resolves to the updated booking request DTO.
	 */
	assignOutsourcedVehicleToBookingRequest(
		currentUser: CurrentUser,
		bookingRequestId: string,
		data: CreateOutsourcedVehicleDto,
	): Promise<BookingRequestResponseDto>;
}

export default IBookingRequestService;
