import { getNotifications, NotificationResponseSchema } from "@/apis/notification";
import { ListItem, ListItemActions, ListItemDescription, ListItemHeader, ListItemTitle } from "@/components/list-item";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import useSWR from "swr";
import { z } from "zod/v4";

export const NotificationsBtn = () => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="icon" variant="transparent">
					<Bell className="size-6" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[512px] relative right-12">
				<NotificationList />
			</PopoverContent>
		</Popover>
	);
};

const NotificationList = () => {
	const { data, isLoading } = useSWR("/api/notifications/USR-6", () => getNotifications({ userId: "USR-6" }));

	if (isLoading) return <Spinner />;
	if (!data) return <p>Couldnt get notification for now</p>;

	const getNotifPriority = (p: z.infer<typeof NotificationResponseSchema.shape.priority>) => {
		switch (p) {
			case "urgent":
				return "Destructive";
			case "high":
				return "Warning";
			case "normal":
				return "Info";
		}
	};

	return data.map((notif) => (
		<ListItem key={notif.id} type={getNotifPriority(notif.priority)}>
			<ListItemHeader>
				<ListItemTitle>{notif.title}</ListItemTitle>
				<ListItemActions>{formatDistanceToNow(notif.createdAt, { addSuffix: true })}</ListItemActions>
			</ListItemHeader>
			<ListItemDescription>
				{Object.entries(notif.message.params).map(([k, v]) => {
					return (
						<div className="flex gap-2" key={k}>
							<p className="font-bold">{k}:</p>
							<p>{String(v)}</p>
						</div>
					);
				})}
			</ListItemDescription>
		</ListItem>
	));
};
