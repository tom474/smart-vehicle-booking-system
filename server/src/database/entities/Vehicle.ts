import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryColumn,
} from "typeorm";
import Driver from "./Driver";
import Vendor from "./Vendor";
import User from "./User";
import Location from "./Location";
import Trip from "./Trip";
import Schedule from "./Schedule";
import VehicleService from "./VehicleService";
import OwnershipType from "../enums/OwnershipType";
import VehicleAvailability from "../enums/VehicleAvailability";
import Color from "../enums/Color";

@Entity("vehicle")
class Vehicle {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({
		name: "license_plate",
		type: "varchar",
		length: 255,
		unique: true,
	})
	licensePlate!: string;

	@Column({ name: "model", type: "varchar", length: 255, nullable: true })
	model?: string | null;

	@Column({ name: "color", type: "enum", enum: Color })
	color!: Color;

	@Column({ name: "capacity", type: "int" })
	capacity!: number;

	@Column({
		name: "availability",
		type: "enum",
		enum: VehicleAvailability,
		default: VehicleAvailability.AVAILABLE,
	})
	availability!: VehicleAvailability;

	@Column({
		name: "ownership_type",
		type: "enum",
		enum: OwnershipType,
		default: OwnershipType.COMPANY,
	})
	ownershipType!: OwnershipType;

	@OneToOne(() => Driver, (driver) => driver.vehicle, {
		nullable: true,
	})
	@JoinColumn({ name: "driver_id" })
	driver?: Driver | null;

	@ManyToOne(() => Vendor, (vendor) => vendor.vehicles, {
		nullable: true,
	})
	@JoinColumn({ name: "vendor_id" })
	vendor?: Vendor | null;

	@OneToOne(() => User, (user) => user.dedicatedVehicle, {
		nullable: true,
	})
	@JoinColumn({ name: "executive_id" })
	executive?: User | null;

	@ManyToOne(() => Location)
	@JoinColumn({ name: "base_location_id" })
	baseLocation!: Location;

	@ManyToOne(() => Location)
	@JoinColumn({ name: "current_location_id" })
	currentLocation!: Location;

	@OneToMany(() => Schedule, (schedule) => schedule.vehicle, {
		cascade: true,
	})
	schedules!: Schedule[];

	@OneToMany(() => VehicleService, (service) => service.vehicle)
	services!: VehicleService[];

	@OneToMany(() => Trip, (trip) => trip.vehicle)
	trips!: Trip[];

	constructor(
		id: string,
		licensePlate: string,
		color: Color,
		capacity: number,
		availability: VehicleAvailability,
		ownershipType: OwnershipType,
		baseLocation: Location,
		model?: string | null,
		driver?: Driver | null,
		vendor?: Vendor | null,
		executive?: User | null,
	) {
		this.id = id;
		this.licensePlate = licensePlate;
		this.model = model;
		this.color = color;
		this.capacity = capacity;
		this.availability = availability;
		this.ownershipType = ownershipType;
		this.driver = driver;
		this.vendor = vendor;
		this.executive = executive;
		this.baseLocation = baseLocation;
		this.currentLocation = baseLocation;
	}
}

export default Vehicle;
