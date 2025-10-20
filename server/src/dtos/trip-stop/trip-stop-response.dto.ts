import { Exclude, Expose, Type } from "class-transformer";
import TripStopType from "../../database/enums/TripStopType";
import LocationResponseDto from "../location/location-response.dto";
import BasicTripTicketResponseDto from "../trip-ticket/basic-trip-ticket-response.dto";

@Exclude()
class TripStopResponseDto {
	@Expose()
	id!: string;

	@Expose()
	type!: TripStopType;

	@Expose()
	order!: number;

	@Expose()
	@Type(() => LocationResponseDto)
	location!: LocationResponseDto;

	@Expose()
	arrivalTime!: Date;

	@Expose()
	actualArrivalTime?: Date | null;

	@Expose()
	@Type(() => BasicTripTicketResponseDto)
	tickets?: BasicTripTicketResponseDto[];
}

export default TripStopResponseDto;
