import { EntityManager } from "typeorm";
import Trip from "../../database/entities/Trip";
import TripTicket from "../../database/entities/TripTicket";
import BookingRequest from "../../database/entities/BookingRequest";
import Vehicle from "../../database/entities/Vehicle";
import OutsourcedVehicle from "../../database/entities/OutsourcedVehicle";
import DetailedTripResponseDto from "../../dtos/trip/detailed-trip-response.dto";
import DetailedVehicleResponseDto from "../../dtos/vehicle/detailed-vehicle-response.dto";
import SelectVehicleDto from "../../dtos/vehicle/select-vehicle.dto";
import CreateOutsourcedVehicleDto from "../../dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import CreateCombinedTripDto from "../../dtos/trip/create-combined-trip.dto";
import BookingRequestResponseDto from "../../dtos/booking-request/booking-request-response.dto";
import SelectBookingRequestDto from "../../dtos/booking-request/select-booking-request.dto";
import DriverCurrentLocationDto from "../../dtos/trip/driver-current-location.dto";
import UpdateDriverCurrentLocationDto from "../../dtos/trip/update-driver-current-location.dto";
import PublicTripAccessDto from "../../dtos/trip/public-trip-access.dto";
import TripOptimizerResultDto from "../../dtos/trip-optimizer/trip-optimizer-result.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface ITripService {
	/**
	 * Retrieves a list of trips based on the provided pagination and query parameters.
	 * @param currentUser The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @return A promise that resolves to an array of trip response DTOs.
	 */
	getTrips(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<DetailedTripResponseDto[]>;

	/**
	 * Retrieves a trip by its ID.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to retrieve.
	 * @return A promise that resolves to the trip response DTO.
	 */
	getTripById(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Creates a trip from a booking request with scheduling.
	 * @param bookingRequest The booking request to create the trip from.
	 * @param vehicle The vehicle or outsourced vehicle to assign to the trip.
	 * @param manager The entity manager for database operations.
	 * @return A promise that resolves to an array of trip tickets created.
	 */
	createSchedulingTripFromBookingRequest(
		bookingRequest: BookingRequest,
		vehicle: Vehicle | OutsourcedVehicle,
		manager: EntityManager,
	): Promise<TripTicket[]>;

	/**
	 * Creates a scheduled trip from a booking request without scheduling.
	 * @param bookingRequest The booking request to create the trip from.
	 * @param vehicle The vehicle or outsourced vehicle to assign to the trip.
	 * @param manager The entity manager for database operations.
	 * @return A promise that resolves to an array of trip tickets created.
	 */
	createScheduledTripFromBookingRequest(
		bookingRequest: BookingRequest,
		vehicle: Vehicle | OutsourcedVehicle,
		manager: EntityManager,
	): Promise<TripTicket[]>;

	/**
	 * Fetches available vehicles for a specific trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to fetch available vehicles for.
	 * @return A promise that resolves to an array of detailed vehicle response DTOs.
	 */
	getAvailableVehiclesForTrip(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedVehicleResponseDto[]>;

	/**
	 * Assigns a vehicle to a trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to assign the vehicle to.
	 * @param data The data containing the vehicle ID to assign.
	 * @return A promise that resolves to the updated trip response DTO.
	 */
	assignVehicleToTrip(
		currentUser: CurrentUser,
		id: string,
		data: SelectVehicleDto,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Assigns an outsourced vehicle to a trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to assign the outsourced vehicle to.
	 * @param data The data for creating the outsourced vehicle.
	 * @return A promise that resolves to the updated trip response DTO.
	 */
	assignOutSourcedVehicleToTrip(
		currentUser: CurrentUser,
		id: string,
		data: CreateOutsourcedVehicleDto,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Creates a combined trip from multiple booking requests.
	 * @param currentUser The current user making the request.
	 * @param data The data for creating the combined trip.
	 * @return A promise that resolves to the created trip response DTO.
	 */
	createCombinedTrip(
		currentUser: CurrentUser,
		data: CreateCombinedTripDto,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Uncombines a combined trip back into individual trips.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the combined trip to uncombine.
	 * @return A promise that resolves when the operation is complete.
	 */
	uncombineTrip(currentUser: CurrentUser, id: string): Promise<void>;

	/**
	 * Retrieves booking requests that can be combined with the specified trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to find combinable booking requests for.
	 * @return A promise that resolves to an array of booking request response DTOs.
	 */
	getCombinableBookingRequests(
		currentUser: CurrentUser,
		id: string,
	): Promise<BookingRequestResponseDto[]>;

	/**
	 * Adds a booking request to an existing trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to add the booking request to.
	 * @param data The data containing the booking request ID to add.
	 * @return A promise that resolves to the updated trip response DTO.
	 */
	addBookingRequestToTrip(
		currentUser: CurrentUser,
		id: string,
		data: SelectBookingRequestDto,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Removes a booking request from an existing trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to remove the booking request from.
	 * @param data The data containing the booking request ID to remove.
	 * @return A promise that resolves to the updated trip response DTO.
	 */
	removeBookingRequestFromTrip(
		currentUser: CurrentUser,
		id: string,
		data: SelectBookingRequestDto,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Handles the internal logic of removing a booking request from a combined trip.
	 * @param bookingRequest The booking request to be removed.
	 * @param trip The trip from which the booking request is to be removed.
	 * @param manager The entity manager for database operations.
	 * @return A promise that resolves when the operation is complete.
	 */
	handleRemoveBookingRequestFromCombinedTrip(
		bookingRequest: BookingRequest,
		trip: Trip,
		manager: EntityManager,
	): Promise<void>;

	/**
	 * Approves a scheduling trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to approve.
	 * @return A promise that resolves to the approved trip response DTO.
	 */
	approveSchedulingTrip(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Driver confirms the start of the trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to confirm start.
	 * @return A promise that resolves to the updated trip response DTO.
	 */
	driverConfirmTripStart(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Driver confirms the end of the trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to confirm end.
	 * @return A promise that resolves to the updated trip response DTO.
	 */
	driverConfirmEndTrip(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Outsourced driver confirms the start of the trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to confirm start.
	 * @return A promise that resolves to the updated trip response DTO.
	 */
	outsourcedConfirmTripStart(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Outsourced driver confirms the end of the trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to confirm end.
	 * @return A promise that resolves to the updated trip response DTO.
	 */
	outsourcedConfirmEndTrip(
		currentUser: CurrentUser,
		id: string,
	): Promise<DetailedTripResponseDto>;

	/**
	 * Generates a public URL for accessing trip details.
	 * @param id The ID of the trip to generate the public URL for.
	 * @return A promise that resolves to the public trip access DTO.
	 */
	generatePublicUrl(id: string): Promise<PublicTripAccessDto>;

	/**
	 * Retrieves the public URL details for a trip.
	 * @param id The ID of the trip to retrieve the public URL for.
	 * @return A promise that resolves to the public trip access DTO.
	 */
	getPublicUrl(id: string): Promise<PublicTripAccessDto>;

	/**
	 * Retrieves the current location of the driver for a specific trip.
	 * @param id The ID of the trip to retrieve the driver's current location for.
	 * @return A promise that resolves to the driver's current location DTO.
	 */
	getDriverCurrentLocation(id: string): Promise<DriverCurrentLocationDto>;

	/**
	 * Updates the current location of the driver for a specific trip.
	 * @param currentUser The current user making the request.
	 * @param id The ID of the trip to update the driver's current location for.
	 * @param data The data containing the new driver current location.
	 * @return A promise that resolves to the updated driver's current location DTO.
	 */
	updateDriverCurrentLocation(
		currentUser: CurrentUser,
		id: string,
		data: UpdateDriverCurrentLocationDto,
	): Promise<DriverCurrentLocationDto>;

	/**
	 * Creates a trip based on the optimization result.
	 * @param result The optimization result containing trip details.
	 * @param manager The entity manager for database operations.
	 * @return The created Trip entity.
	 */
	createTripByOptimizerResult(
		result: TripOptimizerResultDto,
		manager: EntityManager,
	): Promise<Trip>;
}

export default ITripService;
