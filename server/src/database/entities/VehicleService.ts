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
import Schedule from "./Schedule";
import Expense from "./Expense";
import VehicleServiceType from "../enums/VehicleServiceType";
import RequestStatus from "../enums/RequestStatus";

@Entity("vehicle_service")
class VehicleService {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@ManyToOne(() => Driver, (driver) => driver.vehicleServices)
	@JoinColumn({ name: "driver_id" })
	driver!: Driver;

	@ManyToOne(() => Vehicle, (vehicle) => vehicle.services)
	@JoinColumn({ name: "vehicle_id" })
	vehicle!: Vehicle;

	@Column({ name: "reason", type: "text", nullable: true })
	reason?: string | null;

	@Column({ name: "description", type: "text", nullable: true })
	description?: string | null;

	@Column({ name: "service_type", type: "enum", enum: VehicleServiceType })
	serviceType!: VehicleServiceType;

	@Column({ name: "start_time", type: "timestamp with time zone" })
	startTime!: Date;

	@Column({ name: "end_time", type: "timestamp with time zone" })
	endTime!: Date;

	@Column({
		name: "status",
		type: "enum",
		enum: RequestStatus,
		default: RequestStatus.PENDING,
	})
	status!: RequestStatus;

	@OneToOne(() => Schedule, (schedule) => schedule.vehicleService, {
		nullable: true,
	})
	schedule?: Schedule | null;

	@OneToMany(() => Expense, (expense) => expense.vehicleService)
	expenses!: Expense[];

	@Column({ name: "reject_reason", type: "text", nullable: true })
	rejectReason?: string | null;

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
	updatedAt!: Date;

	constructor(
		id: string,
		driver: Driver,
		vehicle: Vehicle,
		serviceType: VehicleServiceType,
		startTime: Date,
		endTime: Date,
		reason?: string | null,
		description?: string | null,
	) {
		this.id = id;
		this.driver = driver;
		this.vehicle = vehicle;
		this.reason = reason;
		this.description = description;
		this.serviceType = serviceType;
		this.startTime = startTime;
		this.endTime = endTime;
		this.status = RequestStatus.PENDING;
	}
}

export default VehicleService;
