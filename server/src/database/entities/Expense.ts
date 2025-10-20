import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import Driver from "./Driver";
import Trip from "./Trip";
import VehicleService from "./VehicleService";
import RequestStatus from "../enums/RequestStatus";

@Entity("expense")
class Expense {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "type", type: "varchar", length: 255 })
	type!: string;

	@Column({ name: "description", type: "text", nullable: true })
	description?: string | null;

	@Column({
		name: "amount",
		type: "decimal",
		precision: 12,
		scale: 2,
		default: 0,
	})
	amount!: number;

	@Column({ name: "receipt_image_url", type: "text", nullable: true })
	receiptImageUrl?: string | null;

	@Column({
		name: "status",
		type: "enum",
		enum: RequestStatus,
		default: RequestStatus.PENDING,
	})
	status!: RequestStatus;

	@ManyToOne(() => Driver, (driver) => driver.expenses)
	@JoinColumn({ name: "driver_id" })
	driver!: Driver;

	@ManyToOne(() => Trip, (trip) => trip.expenses, { nullable: true })
	@JoinColumn({ name: "trip_id" })
	trip?: Trip | null;

	@ManyToOne(
		() => VehicleService,
		(vehicleService) => vehicleService.expenses,
		{ nullable: true },
	)
	@JoinColumn({ name: "vehicle_service_id" })
	vehicleService?: VehicleService | null;

	@Column({ name: "reject_reason", type: "text", nullable: true })
	rejectReason?: string | null;

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
	updatedAt!: Date;

	constructor(
		id: string,
		type: string,
		amount: number,
		driver: Driver,
		description?: string | null,
		receiptImageUrl?: string | null,
		trip?: Trip | null,
		vehicleService?: VehicleService | null,
	) {
		this.id = id;
		this.type = type;
		this.description = description;
		this.amount = amount;
		this.receiptImageUrl = receiptImageUrl;
		this.status = RequestStatus.PENDING;
		this.driver = driver;
		this.trip = trip;
		this.vehicleService = vehicleService;
	}
}

export default Expense;
