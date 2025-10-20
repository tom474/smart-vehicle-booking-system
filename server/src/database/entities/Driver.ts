import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryColumn,
} from "typeorm";
import Role from "./Role";
import Vehicle from "./Vehicle";
import Vendor from "./Vendor";
import Location from "./Location";
import Schedule from "./Schedule";
import LeaveRequest from "./LeaveRequest";
import VehicleService from "./VehicleService";
import Trip from "./Trip";
import Expense from "./Expense";
import UserStatus from "../enums/UserStatus";
import DriverAvailability from "../enums/DriverAvailability";
import OwnershipType from "../enums/OwnershipType";

@Entity("driver")
class Driver {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "name", type: "varchar", length: 255 })
	name!: string;

	@Column({
		name: "email",
		type: "varchar",
		length: 255,
		unique: true,
		nullable: true,
	})
	email?: string | null;

	@Column({ name: "phone_number", type: "varchar", length: 20, unique: true })
	phoneNumber!: string;

	@Column({ name: "username", type: "varchar", length: 255, unique: true })
	username!: string;

	@Column({ name: "hashed_password", type: "text" })
	hashedPassword!: string;

	@Column({ name: "profile_image_url", type: "text", nullable: true })
	profileImageUrl?: string | null;

	@Column({
		name: "status",
		type: "enum",
		enum: UserStatus,
		default: UserStatus.ACTIVE,
	})
	status!: UserStatus;

	@Column({
		name: "availability",
		type: "enum",
		enum: DriverAvailability,
		default: DriverAvailability.AVAILABLE,
	})
	availability!: DriverAvailability;

	@Column({
		name: "ownership_type",
		type: "enum",
		enum: OwnershipType,
		default: OwnershipType.COMPANY,
	})
	ownershipType!: OwnershipType;

	@ManyToOne(() => Role)
	@JoinColumn({ name: "role_id" })
	role!: Role;

	@OneToOne(() => Vehicle, (vehicle) => vehicle.driver, {
		nullable: true,
	})
	vehicle?: Vehicle | null;

	@ManyToOne(() => Vendor, (vendor) => vendor.drivers, {
		nullable: true,
	})
	@JoinColumn({ name: "vendor_id" })
	vendor?: Vendor | null;

	@ManyToOne(() => Location)
	@JoinColumn({ name: "base_location_id" })
	baseLocation!: Location;

	@ManyToOne(() => Location)
	@JoinColumn({ name: "current_location_id" })
	currentLocation!: Location;

	@OneToMany(() => Schedule, (schedule) => schedule.driver, {
		cascade: true,
	})
	schedules!: Schedule[];

	@OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.driver, {
		cascade: true,
	})
	leaveRequests!: LeaveRequest[];

	@OneToMany(
		() => VehicleService,
		(vehicleService) => vehicleService.driver,
		{
			cascade: true,
		},
	)
	vehicleServices!: VehicleService[];

	@OneToMany(() => Trip, (trip) => trip.driver)
	trips!: Trip[];

	@OneToMany(() => Expense, (expense) => expense.driver, {
		cascade: true,
	})
	expenses!: Expense[];

	constructor(
		id: string,
		name: string,
		phoneNumber: string,
		username: string,
		hashedPassword: string,
		ownershipType: OwnershipType,
		role: Role,
		baseLocation: Location,
		email?: string | null,
		profileImageUrl?: string | null,
		vendor?: Vendor | null,
	) {
		this.id = id;
		this.name = name;
		this.email = email;
		this.phoneNumber = phoneNumber;
		this.username = username;
		this.hashedPassword = hashedPassword;
		this.profileImageUrl = profileImageUrl;
		this.status = UserStatus.ACTIVE;
		this.availability = DriverAvailability.AVAILABLE;
		this.ownershipType = ownershipType;
		this.role = role;
		this.vendor = vendor;
		this.baseLocation = baseLocation;
		this.currentLocation = baseLocation;
	}
}

export default Driver;
