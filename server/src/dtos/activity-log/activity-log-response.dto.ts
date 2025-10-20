import { Exclude, Expose } from "class-transformer";
import ActionType from "../../database/enums/ActionType";

@Exclude()
class ActivityLogResponseDto {
	@Expose()
	id!: string;

	@Expose()
	actorRole!: string;

	@Expose()
	actorId!: string;

	@Expose()
	entityName!: string;

	@Expose()
	entityId!: string;

	@Expose()
	actionType!: ActionType;

	@Expose()
	actionDetails!: string;

	@Expose()
	metadata?: Record<string, unknown> | null;

	@Expose()
	timestamp!: Date;
}

export default ActivityLogResponseDto;
