import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import User from "./User";
import Trip from "./Trip";

@Entity("trip_feedback")
class TripFeedback {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "rating", type: "int" })
	rating!: number;

	@Column({ name: "comment", type: "text", nullable: true })
	comment?: string | null;

	@ManyToOne(() => User, (user) => user.tripFeedbacks, {
		onDelete: "CASCADE",
	})
	@JoinColumn({ name: "user_id" })
	user!: User;

	@ManyToOne(() => Trip, (trip) => trip.feedbacks, {
		onDelete: "CASCADE",
	})
	@JoinColumn({ name: "trip_id" })
	trip!: Trip;

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
	updatedAt!: Date;

	constructor(
		id: string,
		rating: number,
		user: User,
		trip: Trip,
		comment?: string | null,
	) {
		this.id = id;
		this.rating = rating;
		this.user = user;
		this.trip = trip;
		this.comment = comment;
	}
}

export default TripFeedback;
