import { Exclude, Expose, Transform, Type } from "class-transformer";
import TripStatus from "../../database/enums/TripStatus";
import TripStopResponseDto from "../trip-stop/trip-stop-response.dto";
import OutsourcedVehicleResponseDto from "../outsourced-vehicle/outsourced-vehicle-response.dto";
import BasicDriverResponseDto from "../driver/basic-driver-response.dto";
import BasicVehicleResponseDto from "../vehicle/basic-vehicle-response.dto";

@Exclude()
class DetailedTripResponseDto {
	@Expose()
	id!: string;

	@Expose()
	status!: TripStatus;

	@Expose()
	totalCost!: number;

	@Expose()
	departureTime!: Date;

	@Expose()
	arrivalTime!: Date;

	@Expose()
	actualDepartureTime!: Date | null;

	@Expose()
	actualArrivalTime!: Date | null;

	@Expose()
	@Type(() => TripStopResponseDto)
	stops!: TripStopResponseDto[];

	@Expose()
	@Type(() => BasicDriverResponseDto)
	driver?: BasicDriverResponseDto | null;

	@Expose()
	@Type(() => BasicVehicleResponseDto)
	vehicle?: BasicVehicleResponseDto | null;

	@Expose()
	@Type(() => OutsourcedVehicleResponseDto)
	outsourcedVehicle?: OutsourcedVehicleResponseDto | null;

	@Expose()
	@Transform(({ obj }) =>
		Array.isArray(obj.tickets) ? obj.tickets.length : 0,
	)
	numberOfPassengers!: number;
}

export default DetailedTripResponseDto;
