import { Column, Entity, PrimaryColumn } from "typeorm";
import LocationType from "../enums/LocationType";

@Entity("location")
class Location {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "type", type: "enum", enum: LocationType })
	type!: LocationType;

	@Column({ name: "name", type: "varchar", length: 255 })
	name!: string;

	@Column({ name: "address", type: "text" })
	address!: string;

	@Column({ name: "latitude", type: "double precision" })
	latitude!: number;

	@Column({ name: "longitude", type: "double precision" })
	longitude!: number;

	constructor(
		id: string,
		type: LocationType,
		name: string,
		address: string,
		latitude: number,
		longitude: number,
	) {
		this.id = id;
		this.type = type;
		this.name = name;
		this.address = address;
		this.latitude = latitude;
		this.longitude = longitude;
	}
}

export default Location;
