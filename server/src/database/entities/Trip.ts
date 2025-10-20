import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import Driver from "./Driver";
import Vehicle from "./Vehicle";
import OutsourcedVehicle from "./OutsourcedVehicle";
import Location from "./Location";
import Schedule from "./Schedule";
import TripTicket from "./TripTicket";
import TripStop from "./TripStop";
import Expense from "./Expense";
import TripFeedback from "./TripFeedback";
import TripStatus from "../enums/TripStatus";

@Entity("trip")
class Trip {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({
		name: "status",
		type: "enum",
		enum: TripStatus,
		default: TripStatus.SCHEDULING,
	})
	status!: TripStatus;

	@Column({
		name: "total_cost",
		type: "decimal",
		precision: 12,
		scale: 2,
		default: 0,
	})
	totalCost!: number;

	@Column({ name: "departure_time", type: "timestamp with time zone" })
	departureTime!: Date;

	@Column({ name: "arrival_time", type: "timestamp with time zone" })
	arrivalTime!: Date;

	@Column({
		name: "actual_departure_time",
		type: "timestamp with time zone",
		nullable: true,
	})
	actualDepartureTime?: Date | null;

	@Column({
		name: "actual_arrival_time",
		type: "timestamp with time zone",
		nullable: true,
	})
	actualArrivalTime?: Date | null;

	@ManyToOne(() => Driver, (driver) => driver.trips, { nullable: true })
	@JoinColumn({ name: "driver_id" })
	driver?: Driver | null;

	@OneToOne(() => Location, {
		nullable: true,
		cascade: true,
	})
	@JoinColumn({ name: "driver_current_location" })
	driverCurrentLocation?: Location | null;

	@ManyToOne(() => Vehicle, (vehicle) => vehicle.trips, { nullable: true })
	@JoinColumn({ name: "vehicle_id" })
	vehicle?: Vehicle | null;

	@ManyToOne(() => OutsourcedVehicle, {
		nullable: true,
	})
	@JoinColumn({ name: "outsourced_vehicle_id" })
	outsourcedVehicle?: OutsourcedVehicle | null;

	@OneToOne(() => Schedule, (schedule) => schedule.trip, {
		cascade: true,
	})
	schedule?: Schedule | null;

	@OneToMany(() => TripTicket, (tripTicket) => tripTicket.trip, {
		cascade: true,
	})
	tickets!: TripTicket[];

	@OneToMany(() => TripStop, (tripStop) => tripStop.trip, {
		cascade: true,
	})
	stops!: TripStop[];

	@OneToMany(() => Expense, (expense) => expense.trip, {
		cascade: true,
	})
	expenses!: Expense[];

	@OneToMany(() => TripFeedback, (tripFeedback) => tripFeedback.trip, {
		cascade: true,
	})
	feedbacks!: TripFeedback[];

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
	updatedAt!: Date;

	constructor(
		id: string,
		departureTime: Date,
		arrivalTime: Date,
		driver?: Driver | null,
		vehicle?: Vehicle | null,
		outsourcedVehicle?: OutsourcedVehicle | null,
	) {
		this.id = id;
		this.status = TripStatus.SCHEDULING;
		this.totalCost = 0;
		this.departureTime = departureTime;
		this.arrivalTime = arrivalTime;
		this.driver = driver;
		this.vehicle = vehicle;
		this.outsourcedVehicle = outsourcedVehicle;
	}
}

export default Trip;
