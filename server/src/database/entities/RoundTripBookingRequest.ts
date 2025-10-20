import { ChildEntity, Column, JoinColumn, ManyToOne } from "typeorm";
import BookingRequest from "./BookingRequest";
import User from "./User";
import Location from "./Location";
import Priority from "../enums/Priority";
import BookingRequestType from "../enums/BookingRequestType";

@ChildEntity(BookingRequestType.ROUND_TRIP)
class RoundTripBookingRequest extends BookingRequest {
	@Column({ name: "return_departure_time", type: "timestamp with time zone" })
	returnDepartureTime!: Date;

	@Column({ name: "return_arrival_time", type: "timestamp with time zone" })
	returnArrivalTime!: Date;

	@ManyToOne(() => Location)
	@JoinColumn({ name: "return_departure_location_id" })
	returnDepartureLocation!: Location;

	@ManyToOne(() => Location)
	@JoinColumn({ name: "return_arrival_location_id" })
	returnArrivalLocation!: Location;

	@Column({
		name: "is_reserved",
		type: "boolean",
		default: false,
	})
	isReserved!: boolean;

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
		returnDepartureTime: Date,
		returnArrivalTime: Date,
		returnDepartureLocation: Location,
		returnArrivalLocation: Location,
		isReserved: boolean,
		tripPurpose?: string | null,
		note?: string | null,
	) {
		super(
			id,
			priority,
			BookingRequestType.ROUND_TRIP,
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
		this.returnDepartureTime = returnDepartureTime;
		this.returnArrivalTime = returnArrivalTime;
		this.returnDepartureLocation = returnDepartureLocation;
		this.returnArrivalLocation = returnArrivalLocation;
		this.isReserved = isReserved;
	}
}

export default RoundTripBookingRequest;
