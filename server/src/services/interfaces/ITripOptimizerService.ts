import { EntityManager } from "typeorm";
import Vehicle from "../../database/entities/Vehicle";
import Trip from "../../database/entities/Trip";

interface ITripOptimizerService {
	/**
	 * Optimizes trips using OR-Tools.
	 * This method does not return any value but performs optimization operations.
	 */
	optimizeTripsWithORTools(): Promise<void>;

	/**
	 * Optimizes a normal booking request by its ID.
	 * @param bookingRequestId - The ID of the booking request to optimize.
	 * @param manager - The EntityManager instance for database operations.
	 */
	optimizeNormalBookingRequest(
		bookingRequestId: string,
		manager: EntityManager,
	): Promise<void>;

	/**
	 * Optimizes a high-priority booking request by its ID.
	 * @param bookingRequestId - The ID of the high-priority booking request to optimize.
	 * @param manager - The EntityManager instance for database operations.
	 */
	optimizeHighPriorityBookingRequest(
		bookingRequestId: string,
		manager: EntityManager,
	): Promise<void>;

	/**
	 * Finds trips that can be combined with the given booking request.
	 * @param bookingRequestId - The ID of the booking request to check for combinable trips.
	 * @param manager - The EntityManager instance for database operations.
	 * @returns A promise that resolves to an array of combinable Trip entities.
	 */
	getCombinableTrips(
		bookingRequestId: string,
		manager: EntityManager,
	): Promise<Trip[]>;

	/**
	 * Adds a booking request to an existing trip.
	 * @param bookingRequestId - The ID of the booking request to add.
	 * @param tripId - The ID of the trip to which the booking request will be added.
	 * @param manager - The EntityManager instance for database operations.
	 */
	addBookingRequestToTrip(
		bookingRequestId: string,
		tripId: string,
		manager: EntityManager,
	): Promise<void>;

	/**
	 * Gets available vehicles for a trip based on the booking request ID.
	 * @param bookingRequestId - The ID of the booking request.
	 * @param manager - The EntityManager instance for database operations.
	 * @returns A promise that resolves to an array of available Vehicle entities.
	 */
	getAvailableVehiclesForTrip(
		bookingRequestId: string,
		manager: EntityManager,
	): Promise<Vehicle[]>;
}

export default ITripOptimizerService;
