import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
	PrimaryColumn,
	TableInheritance,
	UpdateDateColumn,
} from "typeorm";
import User from "./User";
import Location from "./Location";
import TripTicket from "./TripTicket";
import Priority from "../enums/Priority";
import BookingRequestType from "../enums/BookingRequestType";
import RequestStatus from "../enums/RequestStatus";

@Entity("booking_request")
@TableInheritance({
	column: { name: "type", type: "enum", enum: BookingRequestType },
})
class BookingRequest {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "trip_purpose", type: "text", nullable: true })
	tripPurpose?: string | null;

	@Column({ name: "priority", type: "enum", enum: Priority })
	priority!: Priority;

	@Column({ name: "type", type: "enum", enum: BookingRequestType })
	type!: BookingRequestType;

	@Column({
		name: "status",
		type: "enum",
		enum: RequestStatus,
		default: RequestStatus.PENDING,
	})
	status!: RequestStatus;

	@Column({ name: "number_of_passengers", type: "int", default: 1 })
	numberOfPassengers!: number;

	@Column({ name: "note", type: "text", nullable: true })
	note?: string | null;

	@ManyToOne(() => User, (user) => user.bookingRequestsAsRequester)
	@JoinColumn({ name: "requester_id" })
	requester!: User;

	@ManyToMany(() => User, (user) => user.bookingRequestsAsPassenger)
	@JoinTable({
		name: "booking_requests_passengers",
		joinColumn: { name: "booking_request_id", referencedColumnName: "id" },
		inverseJoinColumn: { name: "passenger_id", referencedColumnName: "id" },
	})
	passengers!: User[];

	@Column({
		name: "contact_name",
		type: "varchar",
		length: 255,
	})
	contactName!: string;

	@Column({
		name: "contact_phone_number",
		type: "varchar",
		length: 20,
	})
	contactPhoneNumber!: string;

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

	@OneToMany(() => TripTicket, (ticket) => ticket.bookingRequest)
	tickets!: TripTicket[];

	@Column({ name: "cancel_reason", type: "text", nullable: true })
	cancelReason?: string | null;

	@Column({ name: "reject_reason", type: "text", nullable: true })
	rejectReason?: string | null;

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
	updatedAt!: Date;

	constructor(
		id: string,
		priority: Priority,
		type: BookingRequestType,
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
		this.id = id;
		this.tripPurpose = tripPurpose;
		this.priority = priority;
		this.type = type;
		this.status = RequestStatus.PENDING;
		this.numberOfPassengers = numberOfPassengers;
		this.note = note;
		this.requester = requester;
		this.passengers = passengers;
		this.contactName = contactName;
		this.contactPhoneNumber = contactPhoneNumber;
		this.departureTime = departureTime;
		this.arrivalTime = arrivalTime;
		this.departureLocation = departureLocation;
		this.arrivalLocation = arrivalLocation;
	}
}

export default BookingRequest;
