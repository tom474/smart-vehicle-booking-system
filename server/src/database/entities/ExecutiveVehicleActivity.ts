import {
	Entity,
	PrimaryColumn,
	Column,
	ManyToOne,
	CreateDateColumn,
	UpdateDateColumn,
	JoinColumn,
} from "typeorm";
import User from "./User";
import Vehicle from "./Vehicle";
import ActivityStatus from "../enums/ActivityStatus";

@Entity("executive_vehicle_activity")
class ExecutiveVehicleActivity {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "start_time", type: "timestamp with time zone" })
	startTime!: Date;

	@Column({ name: "end_time", type: "timestamp with time zone" })
	endTime!: Date;

	@Column({ name: "notes", type: "text", nullable: true })
	notes?: string | null;

	@Column({
		name: "status",
		type: "enum",
		enum: ActivityStatus,
		default: ActivityStatus.PENDING,
	})
	status!: ActivityStatus;

	@Column({ name: "worked_minutes", type: "int", default: 0 })
	workedMinutes!: number;

	@ManyToOne(() => Vehicle)
	@JoinColumn({ name: "vehicle_id" })
	vehicle!: Vehicle;

	@ManyToOne(() => User, (user) => user.executiveVehicleActivity)
	@JoinColumn({ name: "executive_id" })
	executive!: User;

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
	updatedAt!: Date;

	constructor(
		id: string,
		startTime: Date,
		endTime: Date,
		vehicle: Vehicle,
		executive: User,
		notes?: string,
	) {
		this.id = id;
		this.startTime = startTime;
		this.endTime = endTime;
		this.notes = notes || null;
		this.vehicle = vehicle;
		this.executive = executive;
		this.status = ActivityStatus.PENDING;

		if (startTime && endTime) {
			const durationInMs =
				new Date(endTime).getTime() - new Date(startTime).getTime();
			this.workedMinutes = Math.floor(durationInMs / (1000 * 60)); // Convert ms to minutes
		} else {
			this.workedMinutes = 0;
		}
	}
}

export default ExecutiveVehicleActivity;
