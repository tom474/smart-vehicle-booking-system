// trip-optimizer-result.dto.ts
import { Exclude, Expose, Type } from "class-transformer";

export type TripOptimizerRoutePointType = "start" | "pickup" | "dropoff";

@Exclude()
export class TripOptimizerRoutePointDto {
	@Expose() location_id?: string;
	@Expose() latitude!: number;
	@Expose() longitude!: number;
	@Expose() @Type(() => Date) estimated_arrival_time!: Date;
	@Expose() type!: TripOptimizerRoutePointType;
}

@Exclude()
class TripOptimizerResultDto {
	@Expose() vehicle_id!: string;
	@Expose() combined_request_ids!: string[];

	@Expose() @Type(() => Date) trip_start_time!: Date;
	@Expose() @Type(() => Date) trip_end_time!: Date;

	@Expose() total_duration_minutes!: number;
	@Expose() total_distance_meters!: number;

	@Expose()
	@Type(() => TripOptimizerRoutePointDto)
	route!: TripOptimizerRoutePointDto[];
}

export default TripOptimizerResultDto;
