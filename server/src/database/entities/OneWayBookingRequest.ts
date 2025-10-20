import { ChildEntity } from "typeorm";
import BookingRequest from "./BookingRequest";
import User from "./User";
import Location from "./Location";
import Priority from "../enums/Priority";
import BookingRequestType from "../enums/BookingRequestType";

@ChildEntity(BookingRequestType.ONE_WAY)
class OneWayBookingRequest extends BookingRequest {
	constructor(
		id: string,
		priority: Priority,
		numberOfPassengers: number,
		requester: User,
		passengers: User[],
		contactName: string,
		contactPhoneNumber: string,
		departureTime: Date,
		arrivalTime: Date,
		departureLocation: Location,
		arrivalLocation: Location,
		tripPurpose?: string | null,
		note?: string | null,
	) {
		super(
			id,
			priority,
			BookingRequestType.ONE_WAY,
			numberOfPassengers,
			requester,
			passengers,
			contactName,
			contactPhoneNumber,
			departureTime,
			arrivalTime,
			departureLocation,
			arrivalLocation,
			tripPurpose,
			note,
		);
	}
}

export default OneWayBookingRequest;
