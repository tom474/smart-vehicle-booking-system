import { Exclude, Expose, Transform, Type } from "class-transformer";
import LocationResponseDto from "../location/location-response.dto";
import TripStatus from "../../database/enums/TripStatus";
import TripTicketStatus from "../../database/enums/TripTicketStatus";
import BasicUserResponseDto from "../user/basic-user-response.dto";

@Exclude()
class BasicTripTicketResponseDto {
	@Expose()
	id!: string;

	@Expose()
	@Type(() => BasicUserResponseDto)
	user!: BasicUserResponseDto;

	@Expose()
	@Transform(({ obj }) => obj.trip.id || obj.id)
	tripId!: string;

	@Expose()
	@Transform(({ obj }) => obj.bookingRequest.id || obj.id)
	bookingRequestId!: string;

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
}

export default BasicTripTicketResponseDto;
