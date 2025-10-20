import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";
import Priority from "../enums/Priority";

@Entity("notification")
class Notification {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "target_id", type: "varchar", length: 255 })
	targetId!: string;

	@Column({ name: "target_role", type: "varchar", length: 255 })
	targetRole!: string;

	@Column({ name: "title", type: "varchar", length: 255 })
	title!: string;

	@Column({ name: "message", type: "jsonb" })
	message!: {
		key: string;
		params: Record<string, unknown>;
	};

	@Column({
		name: "related_id",
		type: "varchar",
		length: 255,
		nullable: true,
	})
	relatedId!: string | null;

	@Column({
		name: "priority",
		type: "enum",
		enum: Priority,
		default: Priority.NORMAL,
	})
	priority!: Priority;

	@Column({ name: "is_read", type: "boolean", default: false })
	isRead!: boolean;

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt!: Date;

	constructor(
		id: string,
		targetId: string,
		targetRole: string,
		title: string,
		message: {
			key: string;
			params: Record<string, unknown>;
		},
		relatedId: string | null,
		priority: Priority = Priority.NORMAL,
	) {
		this.id = id;
		this.targetId = targetId;
		this.targetRole = targetRole;
		this.title = title;
		this.message = message;
		this.relatedId = relatedId;
		this.priority = priority;
		this.isRead = false;
	}
}

export default Notification;
