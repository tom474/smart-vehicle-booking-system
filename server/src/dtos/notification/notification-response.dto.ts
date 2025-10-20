import { Exclude, Expose } from "class-transformer";
import Priority from "../../database/enums/Priority";

export class NotificationMessageDto {
	key!: string;
	params!: Record<string, unknown>;
}

@Exclude()
class NotificationResponseDto {
	@Expose()
	id!: string;

	@Expose()
	targetId!: string;

	@Expose()
	targetRole!: string;

	@Expose()
	title!: string;

	@Expose()
	message!: NotificationMessageDto;

	@Expose()
	relatedId!: string;

	@Expose()
	priority!: Priority;

	@Expose()
	isRead!: boolean;

	@Expose()
	createdAt!: Date;
}

export default NotificationResponseDto;
