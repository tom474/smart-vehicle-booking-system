import { Exclude, Expose } from "class-transformer";

@Exclude()
class UnreadNotificationCountDto {
	@Expose()
	targetId!: string;

	@Expose()
	unreadCount!: number;
}

export default UnreadNotificationCountDto;
