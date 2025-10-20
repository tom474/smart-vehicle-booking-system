import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import Trip from "./Trip";
import Location from "./Location";
import TripStopType from "../enums/TripStopType";

@Entity("trip_stop")
class TripStop {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@ManyToOne(() => Trip, (trip) => trip.stops, {
		onDelete: "CASCADE",
	})
	@JoinColumn({ name: "trip_id" })
	trip!: Trip;

	@Column({ name: "type", type: "enum", enum: TripStopType })
	type!: TripStopType;

	@Column({ name: "order", type: "int" })
	order!: number;

	@ManyToOne(() => Location)
	@JoinColumn({ name: "location_id" })
	location!: Location;

	@Column({ name: "arrival_time", type: "timestamp with time zone" })
	arrivalTime!: Date;

	@Column({
		name: "actual_arrival_time",
		type: "timestamp with time zone",
		nullable: true,
	})
	actualArrivalTime?: Date | null;

	constructor(
		id: string,
		trip: Trip,
		type: TripStopType,
		order: number,
		location: Location,
		arrivalTime: Date,
	) {
		this.id = id;
		this.trip = trip;
		this.type = type;
		this.order = order;
		this.location = location;
		this.arrivalTime = arrivalTime;
		this.actualArrivalTime = null;
	}
}

export default TripStop;
