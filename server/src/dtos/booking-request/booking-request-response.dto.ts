import { Exclude, Expose, Type, Transform } from "class-transformer";
import BookingRequestType from "../../database/enums/BookingRequestType";
import User from "../../database/entities/User";
import Priority from "../../database/enums/Priority";
import RequestStatus from "../../database/enums/RequestStatus";
import LocationResponseDto from "../location/location-response.dto";
import DetailedTripTicketResponseDto from "../trip-ticket/detailed-trip-ticket-response.dto";

@Exclude()
class BookingRequestResponseDto {
	@Expose()
	id!: number;

	@Expose()
	tripPurpose?: string | null;

	@Expose()
	priority!: Priority;

	@Expose()
	type!: BookingRequestType;

	@Expose()
	status!: RequestStatus;

	@Expose()
	numberOfPassengers!: number;

	@Expose()
	note?: string | null;

	@Expose()
	@Transform(({ obj }) => obj.requester.id)
	requesterId!: string;

	@Expose()
	@Transform(({ obj }) =>
		obj.passengers.length > 0
			? obj.passengers.map((passenger: User) => passenger.id) || []
			: [],
	)
	passengerIds!: string[];

	@Expose()
	contactName!: string;

	@Expose()
	contactPhoneNumber!: string;

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
	returnDepartureTime?: Date;

	@Expose()
	returnArrivalTime?: Date;

	@Expose()
	@Type(() => LocationResponseDto)
	returnDepartureLocation?: LocationResponseDto;

	@Expose()
	@Type(() => LocationResponseDto)
	returnArrivalLocation?: LocationResponseDto;

	@Expose()
	isReserved?: boolean;

	@Expose()
	@Type(() => DetailedTripTicketResponseDto)
	tickets!: DetailedTripTicketResponseDto[];

	@Expose()
	cancelReason?: string | null;

	@Expose()
	rejectReason?: string | null;

	@Expose()
	createdAt!: Date;

	@Expose()
	updatedAt!: Date;
}

export default BookingRequestResponseDto;
