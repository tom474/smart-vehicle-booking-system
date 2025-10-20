"use client";

import Notification from "@/app/notification/notification";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function NotificationPage() {
	const isMobile = useIsMobile();

	return (
		<div className={`flex flex-col overflow-hidden ${isMobile ? "w-screen h-screen p-2" : "h-full p-4 pt-0"}`}>
			<div className={`${!isMobile && "p-2 rounded-lg bg-popover h-full"}`}>
				<Notification unread={false} />
			</div>
		</div>
	);
}
