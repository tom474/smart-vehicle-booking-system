import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import Driver from "./Driver";
import Vehicle from "./Vehicle";
import Trip from "./Trip";
import LeaveRequest from "./LeaveRequest";
import VehicleService from "./VehicleService";

@Entity("schedule")
class Schedule {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "title", type: "varchar", length: 255 })
	title!: string;

	@Column({ name: "description", type: "text", nullable: true })
	description?: string | null;

	@Column({ name: "start_time", type: "timestamp with time zone" })
	startTime!: Date;

	@Column({ name: "end_time", type: "timestamp with time zone" })
	endTime!: Date;

	@ManyToOne(() => Driver, (driver) => driver.schedules, { nullable: true })
	@JoinColumn({ name: "driver_id" })
	driver?: Driver | null;

	@ManyToOne(() => Vehicle, (vehicle) => vehicle.schedules, {
		nullable: true,
	})
	@JoinColumn({ name: "vehicle_id" })
	vehicle?: Vehicle | null;

	@OneToOne(() => Trip, (trip) => trip.schedule, {
		nullable: true,
		onDelete: "CASCADE",
	})
	@JoinColumn({ name: "trip_id" })
	trip?: Trip | null;

	@OneToOne(() => LeaveRequest, (leaveRequest) => leaveRequest.schedule, {
		nullable: true,
		onDelete: "CASCADE",
	})
	@JoinColumn({ name: "leave_request_id" })
	leaveRequest?: LeaveRequest | null;

	@OneToOne(
		() => VehicleService,
		(vehicleService) => vehicleService.schedule,
		{ nullable: true, onDelete: "CASCADE" },
	)
	@JoinColumn({ name: "vehicle_service_id" })
	vehicleService?: VehicleService | null;

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
	updatedAt!: Date;

	constructor(
		id: string,
		title: string,
		startTime: Date,
		endTime: Date,
		description?: string | null,
		driver?: Driver | null,
		vehicle?: Vehicle | null,
		trip?: Trip | null,
		leaveRequest?: LeaveRequest | null,
		vehicleService?: VehicleService | null,
	) {
		this.id = id;
		this.title = title;
		this.description = description;
		this.startTime = startTime;
		this.endTime = endTime;
		this.driver = driver;
		this.vehicle = vehicle;
		this.trip = trip;
		this.leaveRequest = leaveRequest;
		this.vehicleService = vehicleService;
	}
}

export default Schedule;
