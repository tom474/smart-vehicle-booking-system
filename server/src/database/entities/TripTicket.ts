import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import Trip from "./Trip";
import User from "./User";
import Location from "./Location";
import BookingRequest from "./BookingRequest";
import TripTicketStatus from "../enums/TripTicketStatus";

@Entity("trip_ticket")
class TripTicket {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@ManyToOne(() => User, (user) => user.tripTickets)
	@JoinColumn({ name: "user_id" })
	user!: User;

	@ManyToOne(
		() => BookingRequest,
		(bookingRequest) => bookingRequest.tickets,
		{
			onDelete: "CASCADE",
		},
	)
	@JoinColumn({ name: "booking_request_id" })
	bookingRequest!: BookingRequest;

	@ManyToOne(() => Trip, (trip) => trip.tickets, { onDelete: "CASCADE" })
	@JoinColumn({ name: "trip_id" })
	trip!: Trip;

	@Column({ name: "departure_time", type: "timestamp with time zone" })
	departureTime!: Date;

	@Column({ name: "arrival_time", type: "timestamp with time zone" })
	arrivalTime!: Date;

	@ManyToOne(() => Location)
	@JoinColumn({ name: "departure_location_id" })
	departureLocation!: Location;

	@ManyToOne(() => Location)
	@JoinColumn({ name: "arrival_location_id" })
	arrivalLocation!: Location;

	@Column({
		name: "ticket_status",
		type: "enum",
		enum: TripTicketStatus,
		default: TripTicketStatus.PENDING,
	})
	ticketStatus!: TripTicketStatus;

	@Column({
		name: "no_show_reason",
		type: "text",
		nullable: true,
	})
	noShowReason?: string | null;

	constructor(
		id: string,
		user: User,
		bookingRequest: BookingRequest,
		trip: Trip,
		departureTime: Date,
		arrivalTime: Date,
		departureLocation: Location,
		arrivalLocation: Location,
	) {
		this.id = id;
		this.user = user;
		this.bookingRequest = bookingRequest;
		this.trip = trip;
		this.departureTime = departureTime;
		this.arrivalTime = arrivalTime;
		this.departureLocation = departureLocation;
		this.arrivalLocation = arrivalLocation;
		this.ticketStatus = TripTicketStatus.PENDING;
	}
}

export default TripTicket;
