import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import Driver from "./Driver";
import Vehicle from "./Vehicle";
import VendorStatus from "../enums/VendorStatus";
import OutsourcedVehicle from "./OutsourcedVehicle";

@Entity("vendor")
class Vendor {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "name", type: "varchar", length: 255 })
	name!: string;

	@Column({ name: "address", type: "varchar", length: 255 })
	address!: string;

	@Column({ name: "contact_person", type: "varchar", length: 255 })
	contactPerson!: string;

	@Column({
		name: "email",
		type: "varchar",
		length: 255,
		unique: true,
		nullable: true,
	})
	email?: string | null;

	@Column({
		name: "phone_number",
		type: "varchar",
		length: 20,
		unique: true,
	})
	phoneNumber!: string;

	@Column({
		name: "status",
		type: "enum",
		enum: VendorStatus,
		default: VendorStatus.ACTIVE,
	})
	status!: VendorStatus;

	@OneToMany(() => Driver, (driver) => driver.vendor, {
		cascade: true,
	})
	drivers!: Driver[];

	@OneToMany(() => Vehicle, (vehicle) => vehicle.vendor, {
		cascade: true,
	})
	vehicles!: Vehicle[];

	@OneToMany(
		() => OutsourcedVehicle,
		(outsourcedVehicle) => outsourcedVehicle.vendor,
		{
			cascade: true,
		},
	)
	outsourcedVehicles!: OutsourcedVehicle[];

	constructor(
		id: string,
		name: string,
		address: string,
		contactPerson: string,
		phoneNumber: string,
		email?: string | null,
	) {
		this.id = id;
		this.name = name;
		this.address = address;
		this.contactPerson = contactPerson;
		this.email = email;
		this.phoneNumber = phoneNumber;
		this.status = VendorStatus.ACTIVE;
	}
}

export default Vendor;
