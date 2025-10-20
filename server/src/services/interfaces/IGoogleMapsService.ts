import Location from "../../database/entities/Location";

interface IGoogleMapsService {
	/**
	 * Estimates the distance, duration, and cost of a route between two locations.
	 * @param origin - The starting location.
	 * @param destination - The destination location.
	 * @return A promise that resolves to an object containing distance, duration, and cost.
	 */
	estimateRouteDetails(
		origin: Location,
		destination: Location,
	): Promise<{
		distance: number;
		duration: number;
	}>;
}

export default IGoogleMapsService;
