import { Service } from "typedi";
import {
	Client,
	DistanceMatrixResponse,
	DistanceMatrixResponseData,
} from "@googlemaps/google-maps-services-js";
import { GOOGLE_MAPS_API_KEY } from "../config/env";
import Location from "../database/entities/Location";
import ApiError from "../templates/api-error";
import IGoogleMapsService from "./interfaces/IGoogleMapsService";

@Service()
class GoogleMapsService implements IGoogleMapsService {
	constructor() {}

	private readonly client: Client = new Client({});

	private async getDistanceMatrix(
		origin: Location,
		destination: Location,
	): Promise<DistanceMatrixResponseData> {
		// Get the distance matrix from the Google Maps API
		const response: DistanceMatrixResponse =
			await this.client.distancematrix({
				params: {
					origins: [{ lat: origin.latitude, lng: origin.longitude }],
					destinations: [
						{
							lat: destination.latitude,
							lng: destination.longitude,
						},
					],
					key: GOOGLE_MAPS_API_KEY!,
				},
			});

		if (response.data.status !== "OK") {
			throw new ApiError(
				`Google Maps API Error: ${response.data.error_message}.`,
				500,
			);
		}

		return response.data;
	}

	public async estimateRouteDetails(
		origin: Location,
		destination: Location,
	): Promise<{
		distance: number;
		duration: number;
	}> {
		try {
			// Get the distance matrix for the origin and destination
			const distanceMatrix = await this.getDistanceMatrix(
				origin,
				destination,
			);
			const element = distanceMatrix.rows[0].elements[0];

			if (element.status !== "OK") {
				throw new ApiError(
					`Failed to find a route between the locations.`,
					404,
				);
			}

			// Calculate distance, duration, and cost
			const distance = element.distance.value / 1000;
			const duration = element.duration.value / 60;

			return {
				distance,
				duration,
			};
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to estimate route details.", 500, error);
		}
	}
}

export default GoogleMapsService;
