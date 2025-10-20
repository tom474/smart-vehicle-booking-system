export type TripOptimizerLocation = {
	id: string;
	latitude: number;
	longitude: number;
};

export type TripOptimizerUnavailability = {
	date: string;
	period: number;
};

export type TripOptimizerVehicle = {
	id: string;
	capacity: number;
	base_location: TripOptimizerLocation;
	unavailability?: TripOptimizerUnavailability[];
};

export type TripOptimizerBookingRequest = {
	id: string;
	pickup_location: TripOptimizerLocation;
	dropoff_location: TripOptimizerLocation;
	dropoff_time: Date;
	capacity_demand: number;
};

class TripOptimizerRequestDto {
	vehicles!: TripOptimizerVehicle[];

	requests!: TripOptimizerBookingRequest[];

	constructor(
		input: {
			vehicles?: TripOptimizerVehicle[];
			requests?: TripOptimizerBookingRequest[];
		} = {},
	) {
		const vehicles = input.vehicles ?? [];
		const requests = input.requests ?? [];

		// Force all unavailability.period to 0
		this.vehicles = vehicles.map((v) => ({
			...v,
			unavailability: v.unavailability?.map((u) => ({
				...u,
				period: 0 as const,
			})),
		}));

		this.requests = requests;
	}
}

export default TripOptimizerRequestDto;
