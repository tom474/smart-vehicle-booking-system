import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import Color from "../enums/Color";
import Vendor from "./Vendor";

@Entity("outsourced_vehicle")
class OutsourcedVehicle {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "driver_name", type: "varchar", length: 255 })
	driverName!: string;

	@Column({ name: "phone_number", type: "varchar", length: 20 })
	phoneNumber!: string;

	@Column({ name: "license_plate", type: "varchar", length: 255 })
	licensePlate!: string;

	@Column({ name: "model", type: "varchar", length: 255, nullable: true })
	model?: string | null;

	@Column({ name: "color", type: "enum", enum: Color })
	color!: Color;

	@Column({ name: "capacity", type: "int" })
	capacity!: number;

	@ManyToOne(() => Vendor, (vendor) => vendor.outsourcedVehicles, {
		nullable: true,
	})
	@JoinColumn({ name: "vendor_id" })
	vendor?: Vendor | null;

	constructor(
		id: string,
		driverName: string,
		phoneNumber: string,
		licensePlate: string,
		color: Color,
		capacity: number,
		model?: string | null,
		vendor?: Vendor | null,
	) {
		this.id = id;
		this.driverName = driverName;
		this.phoneNumber = phoneNumber;
		this.licensePlate = licensePlate;
		this.model = model;
		this.color = color;
		this.capacity = capacity;
		this.vendor = vendor;
	}
}

export default OutsourcedVehicle;
