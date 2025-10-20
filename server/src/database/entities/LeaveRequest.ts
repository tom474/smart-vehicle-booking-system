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
import Schedule from "./Schedule";
import RequestStatus from "../enums/RequestStatus";

@Entity("leave_request")
class LeaveRequest {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@ManyToOne(() => Driver, (driver) => driver.leaveRequests)
	@JoinColumn({ name: "driver_id" })
	driver!: Driver;

	@Column({ name: "reason", type: "text", nullable: true })
	reason?: string | null;

	@Column({ name: "notes", type: "text", nullable: true })
	notes?: string | null;

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

	@OneToOne(() => Schedule, (schedule) => schedule.leaveRequest, {
		nullable: true,
	})
	schedule?: Schedule | null;

	@Column({ name: "reject_reason", type: "text", nullable: true })
	rejectReason?: string | null;

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
	updatedAt!: Date;

	constructor(
		id: string,
		driver: Driver,
		startTime: Date,
		endTime: Date,
		reason: string | null = null,
		notes: string | null = null,
	) {
		this.id = id;
		this.driver = driver;
		this.reason = reason;
		this.notes = notes;
		this.startTime = startTime;
		this.endTime = endTime;
		this.status = RequestStatus.PENDING;
	}
}

export default LeaveRequest;
