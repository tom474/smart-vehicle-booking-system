import {
	Column,
	Entity,
	JoinColumn,
	ManyToMany,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryColumn,
} from "typeorm";
import Role from "./Role";
import BookingRequest from "./BookingRequest";
import Vehicle from "./Vehicle";
import TripFeedback from "./TripFeedback";
import TripTicket from "./TripTicket";
import ExecutiveVehicleActivity from "./ExecutiveVehicleActivity";
import UserStatus from "../enums/UserStatus";

@Entity("user")
class User {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({
		name: "microsoft_id",
		type: "varchar",
		length: 255,
		unique: true,
	})
	microsoftId!: string;

	@Column({ name: "name", type: "varchar", length: 255 })
	name!: string;

	@Column({ name: "email", type: "varchar", length: 255, unique: true })
	email!: string;

	@Column({
		name: "phone_number",
		type: "varchar",
		length: 20,
		unique: true,
		nullable: true,
	})
	phoneNumber?: string | null;

	@Column({ name: "profile_image_url", type: "text", nullable: true })
	profileImageUrl?: string | null;

	@Column({
		name: "status",
		type: "enum",
		enum: UserStatus,
		default: UserStatus.ACTIVE,
	})
	status!: UserStatus;

	@ManyToOne(() => Role, (role) => role.users)
	@JoinColumn({ name: "role_id" })
	role!: Role;

	@OneToOne(() => Vehicle, (vehicle) => vehicle.executive)
	dedicatedVehicle?: Vehicle | null;

	@OneToMany(
		() => ExecutiveVehicleActivity,
		(vehicleActivity) => vehicleActivity.executive,
	)
	executiveVehicleActivity!: ExecutiveVehicleActivity[];

	@OneToMany(
		() => BookingRequest,
		(bookingRequest) => bookingRequest.requester,
	)
	bookingRequestsAsRequester!: BookingRequest[];

	@ManyToMany(
		() => BookingRequest,
		(bookingRequest) => bookingRequest.passengers,
	)
	bookingRequestsAsPassenger!: BookingRequest[];

	@OneToMany(() => TripTicket, (tripTicket) => tripTicket.user)
	tripTickets!: TripTicket[];

	@OneToMany(() => TripFeedback, (tripFeedback) => tripFeedback.user)
	tripFeedbacks!: TripFeedback[];

	constructor(
		id: string,
		microsoftId: string,
		name: string,
		email: string,
		role: Role,
		phoneNumber?: string | null,
		profileImageUrl?: string | null,
	) {
		this.id = id;
		this.microsoftId = microsoftId;
		this.name = name;
		this.email = email;
		this.phoneNumber = phoneNumber;
		this.profileImageUrl = profileImageUrl;
		this.status = UserStatus.ACTIVE;
		this.role = role;
	}
}

export default User;
