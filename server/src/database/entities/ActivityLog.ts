import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";
import ActionType from "../enums/ActionType";

@Entity("activity_log")
class ActivityLog {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "actor_role", type: "varchar", length: 255 })
	actorRole!: string;

	@Column({ name: "actor_id", type: "varchar", length: 255 })
	actorId!: string;

	@Column({ name: "entity_name", type: "varchar", length: 255 })
	entityName!: string;

	@Column({ name: "entity_id", type: "varchar", length: 255 })
	entityId!: string;

	@Column({ name: "action_type", type: "enum", enum: ActionType })
	actionType!: ActionType;

	@Column({ name: "action_details", type: "text" })
	actionDetails!: string;

	@Column({ name: "metadata", type: "jsonb", nullable: true })
	metadata?: Record<string, unknown> | null;

	@CreateDateColumn({ name: "timestamp", type: "timestamp with time zone" })
	timestamp!: Date;

	constructor(
		id: string,
		actorRole: string,
		actorId: string,
		entityName: string,
		entityId: string,
		actionType: ActionType,
		actionDetails: string,
		metadata?: Record<string, unknown> | null,
	) {
		this.id = id;
		this.actorRole = actorRole;
		this.actorId = actorId;
		this.entityName = entityName;
		this.entityId = entityId;
		this.actionType = actionType;
		this.actionDetails = actionDetails;
		this.metadata = metadata;
	}
}

export default ActivityLog;
