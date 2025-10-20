import {
	Exclude,
	Expose,
	plainToInstance,
	Transform,
	Type,
} from "class-transformer";
import LocationResponseDto from "../location/location-response.dto";
import TripStatus from "../../database/enums/TripStatus";
import BasicDriverResponseDto from "../driver/basic-driver-response.dto";
import BasicVehicleResponseDto from "../vehicle/basic-vehicle-response.dto";
import OutsourcedVehicleResponseDto from "../outsourced-vehicle/outsourced-vehicle-response.dto";
import TripTicketStatus from "../../database/enums/TripTicketStatus";
import BasicUserResponseDto from "../user/basic-user-response.dto";

@Exclude()
class DetailedTripTicketResponseDto {
	@Expose()
	id!: number;

	@Expose()
	@Type(() => BasicUserResponseDto)
	user!: BasicUserResponseDto;

	@Expose()
	@Transform(({ obj }) => obj.bookingRequest.id || obj.id)
	bookingRequestId!: number;

	@Expose()
	@Transform(({ obj }) => obj.bookingRequest.contactName || obj.contactName)
	contactName!: string;

	@Expose()
	@Transform(
		({ obj }) =>
			obj.bookingRequest.contactPhoneNumber || obj.contactPhoneNumber,
	)
	contactPhoneNumber!: string;

	@Expose()
	@Transform(({ obj }) => obj.trip.id || obj.id)
	tripId!: number;

	@Expose()
	@Transform(({ obj }) => obj.trip.status || obj.status)
	status!: TripStatus;

	@Expose()
	departureTime!: Date;

	@Expose()
	arrivalTime!: Date;

	@Expose()
	@Type(() => LocationResponseDto)
	departureLocation!: LocationResponseDto;

	@Expose()
	@Type(() => LocationResponseDto)
	arrivalLocation!: LocationResponseDto;

	@Expose()
	ticketStatus!: TripTicketStatus;

	@Expose()
	noShowReason?: string | null;

	@Expose()
	@Transform(({ obj }) =>
		obj.trip.driver || obj.driver
			? plainToInstance(
					BasicDriverResponseDto,
					obj.trip.driver || obj.driver,
					{
						excludeExtraneousValues: true,
					},
				)
			: null,
	)
	driver?: BasicDriverResponseDto | null;

	@Expose()
	@Transform(({ obj }) =>
		obj.trip.vehicle || obj.vehicle
			? plainToInstance(
					BasicVehicleResponseDto,
					obj.trip.vehicle || obj.vehicle,
					{
						excludeExtraneousValues: true,
					},
				)
			: null,
	)
	vehicle?: BasicVehicleResponseDto | null;

	@Expose()
	@Transform(({ obj }) =>
		obj.trip.outsourcedVehicle || obj.outsourcedVehicle
			? plainToInstance(
					OutsourcedVehicleResponseDto,
					obj.trip.outsourcedVehicle || obj.outsourcedVehicle,
					{
						excludeExtraneousValues: true,
					},
				)
			: null,
	)
	outsourcedVehicle?: OutsourcedVehicleResponseDto | null;
}

export default DetailedTripTicketResponseDto;
