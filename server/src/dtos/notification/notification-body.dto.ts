import { Exclude, Expose } from "class-transformer";
import Priority from "../../database/enums/Priority";
import createNotification, {
	NotificationKey,
	NotificationParams,
	NotificationTemplate,
} from "../../constants/notifications";

@Exclude()
class NotificationBody {
	@Expose()
	title!: string;

	@Expose()
	message!: NotificationTemplate<NotificationKey>;

	@Expose()
	relatedId!: string | null;

	@Expose()
	priority!: Priority;

	constructor(
		title: string,
		key: NotificationKey,
		params: NotificationParams<typeof key>,
		relatedId: string | null,
		priority: Priority,
	) {
		this.title = title;
		this.message = createNotification(key, params);
		this.relatedId = relatedId;
		this.priority = priority;
	}
}

export default NotificationBody;
