"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCheck, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getUserFromToken } from "@/lib/utils";
import { NotificationResponseData, getNotifications, readAllNotification } from "@/apis/notification";
import { getNotificationConfig, getCategoryFromDate } from "@/app/notification/utils";
import { NotificationItemComponent } from "@/app/notification/item-component";
// import PushNotificationManager from "@/app/notification/subscribe-push";
import Spinner from "@/components/spinner";

function NotificationList({
	notifications,
	userRole,
	translations,
	updateNotificationReadStatus,
	fetchUnreadCount,
}: {
	notifications: NotificationResponseData[];
	userRole: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	translations: any;
	updateNotificationReadStatus?: (notificationId: string) => void;
	fetchUnreadCount?: () => Promise<void>;
}) {
	if (notifications.length === 0) {
		return (
			<div className="flex items-center justify-center p-4 text-muted-foreground">
				{translations("noNotifications") || "No notifications yet."}
			</div>
		);
	}

	return (
		<div className="flex flex-col space-y-4">
			{notifications.map((notification) => (
				<NotificationItemComponent
					key={notification.id}
					notification={notification}
					userRole={userRole}
					translations={translations}
					updateNotificationReadStatus={updateNotificationReadStatus}
					fetchUnreadCount={fetchUnreadCount}
				/>
			))}
		</div>
	);
}

export default function Notification({
	unread,
	fetchUnreadCount,
}: {
	unread?: boolean;
	fetchUnreadCount?: () => Promise<void>;
}) {
	const t = useTranslations("Notification");
	const router = useRouter();
	const pathname = usePathname();
	const [sortFilter, setSortFilter] = useState<string | null>(null);
	const [notifications, setNotifications] = useState<NotificationResponseData[]>([]);
	const [loading, setLoading] = useState(true);
	const [markingAsRead, setMarkingAsRead] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasNextPage, setHasNextPage] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	// Add scroll ref here
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const user = getUserFromToken();
	let userRole = "user";
	if (user?.role) {
		userRole = (user?.role).charAt(0).toUpperCase() + (user?.role).slice(1);
	}

	const fetchNotifications = async (page: number = 1, reset: boolean = false) => {
		try {
			const user = getUserFromToken();
			if (!user) {
				console.error("User not found, cannot fetch notifications.");
				return;
			}

			if (reset) {
				setLoading(true);
			} else {
				setIsLoadingMore(true);
			}

			const backendNotifications = await getNotifications({
				userId: user?.id,
				page: page,
				limit: 15,
			});

			if (reset) {
				setNotifications(backendNotifications);
			} else {
				setNotifications((prev) => [...prev, ...backendNotifications]);
			}

			// Check if there are more notifications to load
			setHasNextPage(backendNotifications.length === 15);
			setCurrentPage(page);
		} catch (error) {
			console.error("Failed to fetch notifications:", error);
		} finally {
			setLoading(false);
			setIsLoadingMore(false);
		}
	};

	const handleLoadMore = useCallback(() => {
		if (!isLoadingMore && hasNextPage) {
			fetchNotifications(currentPage + 1, false);
		}
	}, [currentPage, isLoadingMore, hasNextPage]);

	// Add scroll handler here
	const handleScroll = useCallback(() => {
		if (!scrollContainerRef.current || isLoadingMore || !hasNextPage) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
		if (scrollTop + clientHeight >= scrollHeight - 10) {
			handleLoadMore();
		}
	}, [handleLoadMore, isLoadingMore, hasNextPage]);

	// Add scroll event listener - use a separate effect that runs after render
	useEffect(() => {
		// Use setTimeout to ensure DOM is ready
		const timeoutId = setTimeout(() => {
			const scrollContainer = scrollContainerRef.current;
			if (scrollContainer && pathname === "/notification") {
				scrollContainer.addEventListener("scroll", handleScroll);
			}
		}, 100); // Small delay to ensure DOM is rendered

		// Capture the current ref value for cleanup
		const cleanupScrollContainer = scrollContainerRef.current;

		return () => {
			clearTimeout(timeoutId);
			// Clean up the scroll listener using the captured ref value
			if (cleanupScrollContainer) {
				cleanupScrollContainer.removeEventListener("scroll", handleScroll);
			}
		};
	}, [handleScroll, pathname, loading]); // Add loading to dependencies

	// Fetch notifications on component mount
	useEffect(() => {
		fetchNotifications(1, true);
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center w-screen h-screen">
				<Spinner />
			</div>
		);
	}

	// Handle mark all as read functionality
	const handleMarkAllAsRead = async () => {
		setMarkingAsRead(true);
		try {
			let unreadNotificationIds: string[];

			if (unread) {
				const filteredUnread = sortNotifications(unreadNotifications);
				unreadNotificationIds = filteredUnread.filter((n) => !n.isRead).map((n) => n.id);
			} else {
				const filteredToday = sortNotifications(todayNotifications);
				const filteredOlder = sortNotifications(olderNotifications);
				const allFiltered = [...filteredToday, ...filteredOlder];
				unreadNotificationIds = allFiltered.filter((n) => !n.isRead).map((n) => n.id);
			}

			if (unreadNotificationIds.length > 0) {
				await readAllNotification(unreadNotificationIds);
				await fetchNotifications(1, true);
				if (fetchUnreadCount) {
					await fetchUnreadCount();
				}
			}
		} catch (error) {
			console.error("Failed to mark all notifications as read:", error);
		} finally {
			setMarkingAsRead(false);
		}
	};

	const unreadNotifications = notifications.filter((n) => !n.isRead);
	const todayNotifications = notifications.filter((n) => getCategoryFromDate(n.createdAt) === "today");
	const olderNotifications = notifications.filter((n) => getCategoryFromDate(n.createdAt) === "older");

	const sortNotifications = (notifications: NotificationResponseData[]) => {
		if (!sortFilter) return notifications;

		return notifications.filter((notification) => {
			const config = getNotificationConfig(userRole, notification.message.key);
			switch (sortFilter) {
				case "approval":
					return config.type === "approved";
				case "cancellation":
					return config.type === "cancelled";
				case "departure":
					return config.type === "departure";
				case "rating":
					return config.type === "rate";
				default:
					return true;
			}
		});
	};

	const handleSortFilter = (filter: string) => {
		setSortFilter(sortFilter === filter ? null : filter);
	};

	const updateNotificationReadStatus = (notificationId: string) => {
		setNotifications((prev) =>
			prev.map((notification) =>
				notification.id === notificationId ? { ...notification, isRead: true } : notification,
			),
		);
	};

	if (unread) {
		const filteredUnread = sortNotifications(unreadNotifications);
		return (
			<div className="h-full p-4 pt-4 pb-0 overflow-hidden">
				<div className="flex justify-between">
					<div className="flex flex-row items-center gap-2">
						<h1 className="ml-2 text-headline-2 ">{t("unreadNotification")}</h1>
						{filteredUnread.length > 0 && (
							<div className="flex items-center justify-center text-white rounded-md size-6 aspect-square bg-destructive/90">
								{filteredUnread.length}
							</div>
						)}
					</div>
					<Button
						variant="ghost"
						className="flex flex-row items-center gap-2 text-subtitle-2 text-success hover:text-primary hover:bg-background"
						onClick={handleMarkAllAsRead}
						disabled={markingAsRead || filteredUnread.filter((n) => !n.isRead).length === 0}
					>
						<CheckCheck /> {markingAsRead ? t("marking") || "Marking..." : t("markAllAsRead")}
					</Button>
				</div>
				<div ref={scrollContainerRef} className="h-full min-h-0 p-2 pb-12 mt-2 space-y-4 overflow-y-auto">
					<NotificationList
						notifications={filteredUnread}
						userRole={userRole}
						translations={t}
						updateNotificationReadStatus={updateNotificationReadStatus}
						fetchUnreadCount={fetchUnreadCount}
					/>

					{/* Loading indicator */}
					{isLoadingMore && (
						<div className="flex justify-center py-4">
							<div className="text-sm text-muted-foreground">{t("loadingMore")}</div>
						</div>
					)}
					{/* End of list indicator */}
					{!hasNextPage && filteredUnread.length > 0 && (
						<div className="flex justify-center py-4">
							<div className="text-sm text-muted-foreground">{t("noMoreNotifications")}</div>
						</div>
					)}
				</div>
			</div>
		);
	} else {
		const filteredToday = sortNotifications(todayNotifications);
		const filteredTodayUnreadLength = filteredToday.filter((n) => !n.isRead).length;
		const filteredOlder = sortNotifications(olderNotifications);
		const filteredOlderUnreadLength = filteredOlder.filter((n) => !n.isRead).length;
		const totalUnreadLength = filteredTodayUnreadLength + filteredOlderUnreadLength;

		// Limit notifications when not on the notification page
		const limitedToday = pathname === "/notification" ? filteredToday : filteredToday.slice(0, 3);
		const limitedOlder = pathname === "/notification" ? filteredOlder : filteredOlder.slice(0, 3);

		return (
			<div className="flex flex-col h-full max-h-screen rounded-lg">
				<div className="flex flex-col flex-1 min-h-0 p-2 overflow-hidden">
					<div className="flex flex-row items-center justify-between flex-shrink-0 pb-4">
						<div className="flex flex-row items-center gap-2">
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										className={`flex flex-row items-center gap-2 hover:text-primary ${
											sortFilter ? "text-primary bg-primary/10" : ""
										}`}
									>
										<ArrowDownUp />
										{sortFilter
											? t(
													`options.${sortFilter}` as
														| "options.approval"
														| "options.cancellation"
														| "options.departure"
														| "options.rating",
												)
											: t("filter")}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="flex flex-col gap-2 p-1 w-fit" align="start">
									<Button
										variant="ghost"
										onClick={() => handleSortFilter("approval")}
										className={sortFilter === "approval" ? "bg-primary/10 text-primary" : ""}
									>
										{t("options.approval")}
									</Button>
									<Button
										variant="ghost"
										onClick={() => handleSortFilter("cancellation")}
										className={sortFilter === "cancellation" ? "bg-primary/10 text-primary" : ""}
									>
										{t("options.cancellation")}
									</Button>
									<Button
										variant="ghost"
										onClick={() => handleSortFilter("departure")}
										className={sortFilter === "departure" ? "bg-primary/10 text-primary" : ""}
									>
										{t("options.departure")}
									</Button>
									<Button
										variant="ghost"
										onClick={() => handleSortFilter("rating")}
										className={sortFilter === "rating" ? "bg-primary/10 text-primary" : ""}
									>
										{t("options.rating")}
									</Button>
									{sortFilter && (
										<Button
											variant="ghost"
											onClick={() => setSortFilter(null)}
											className="pt-2 mt-1 border-t text-muted-foreground"
										>
											{t("clearFilter")}
										</Button>
									)}
								</PopoverContent>
							</Popover>
						</div>
						<Button
							variant="ghost"
							className="flex flex-row items-center gap-2 text-subtitle-2 text-success hover:text-primary hover:bg-background"
							onClick={handleMarkAllAsRead}
							disabled={markingAsRead || totalUnreadLength === 0}
						>
							<CheckCheck /> {markingAsRead ? t("marking") || "Marking..." : t("markAllAsRead")}
						</Button>
					</div>
					<div className={`flex-1 min-h-0 ${pathname === "/notification" && ""}`}>
						{!sortFilter ? (
							<div
								ref={pathname === "/notification" ? scrollContainerRef : undefined}
								className="h-full space-y-4 overflow-y-auto"
							>
								{limitedToday.length > 0 && (
									<div>
										<div className="flex flex-row items-center gap-3 mb-4 w-fit">
											<p className="text-subtitle-1 text-muted-foreground">{t("today")}</p>
											{filteredTodayUnreadLength > 0 && (
												<div className="flex items-center justify-center text-white rounded-md size-6 aspect-square bg-destructive/90">
													{filteredTodayUnreadLength}
												</div>
											)}
										</div>
										<NotificationList
											notifications={limitedToday}
											userRole={userRole}
											translations={t}
											updateNotificationReadStatus={updateNotificationReadStatus}
											fetchUnreadCount={fetchUnreadCount}
										/>
									</div>
								)}
								{limitedOlder.length > 0 && (
									<div>
										<div className="flex flex-row items-center gap-3 mb-4 w-fit">
											<p className="text-subtitle-1 text-muted-foreground">{t("older")}</p>
											{filteredOlderUnreadLength > 0 && (
												<div className="flex items-center justify-center text-white rounded-md size-6 aspect-square bg-destructive/90">
													{filteredOlderUnreadLength}
												</div>
											)}
										</div>
										<NotificationList
											notifications={limitedOlder}
											userRole={userRole}
											translations={t}
											updateNotificationReadStatus={updateNotificationReadStatus}
											fetchUnreadCount={fetchUnreadCount}
										/>
									</div>
								)}
								{limitedToday.length === 0 && limitedOlder.length === 0 && (
									<div className="flex items-center justify-center p-4 pb-0 text-muted-foreground">
										{t("noNotifications") || "No notifications yet."}
									</div>
								)}
								{/* Loading and end indicators for all notifications view */}
								{pathname === "/notification" && (
									<>
										{isLoadingMore && (
											<div className="flex justify-center py-4">
												<div className="text-sm text-muted-foreground">{t("loadingMore")}</div>
											</div>
										)}
										{!hasNextPage && (limitedToday.length > 0 || limitedOlder.length > 0) && (
											<div className="flex justify-center py-4">
												<div className="text-sm text-muted-foreground">
													{t("noMoreNotifications")}
												</div>
											</div>
										)}
									</>
								)}
							</div>
						) : (
							<div
								ref={pathname === "/notification" ? scrollContainerRef : undefined}
								className="h-full space-y-4 overflow-y-auto"
							>
								<NotificationList
									notifications={
										pathname === "/notification"
											? [...filteredToday, ...filteredOlder]
											: [...limitedToday, ...limitedOlder]
									}
									userRole={userRole}
									translations={t}
									updateNotificationReadStatus={updateNotificationReadStatus}
									fetchUnreadCount={fetchUnreadCount}
								/>
								{/* Loading and end indicators for filtered view */}
								{pathname === "/notification" && (
									<>
										{isLoadingMore && (
											<div className="flex justify-center py-4">
												<div className="text-sm text-muted-foreground">{t("loadingMore")}</div>
											</div>
										)}
										{!hasNextPage && [...filteredToday, ...filteredOlder].length > 0 && (
											<div className="flex justify-center py-4">
												<div className="text-sm text-muted-foreground">
													{t("noMoreNotifications")}
												</div>
											</div>
										)}
									</>
								)}
							</div>
						)}
					</div>
					{pathname !== "/notification" && (
						<Button
							variant="secondary"
							className="flex flex-row items-center gap-2 mt-4"
							onClick={() => router.push("/notification")}
						>
							{t("viewAll")}
						</Button>
					)}
				</div>
			</div>
		);
	}
}
