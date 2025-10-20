import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePathname } from "next/navigation";
import { NotificationResponseData, readNotification } from "@/apis/notification";
import { NOTIFICATION_CONFIG } from "@/components/notification-config";
import {
	getNotificationConfig,
	getNotificationTitle,
	formatNotificationDescription,
	getTimeAgo,
	highlightTextContent,
	highlightTitle,
} from "@/app/notification/utils";
import { useTranslations } from "next-intl";

import { SheetForm } from "@/app/notification/sheet-form";
import { getExpense } from "@/apis/expense";
import { getTrip } from "@/apis/trip";
import { getLeaveRequestById } from "@/apis/leave-request";
import { getVehicleServiceById } from "@/apis/vehicle-service-request";
import { getTripFeedbackById } from "@/apis/trip-feedback";

interface NotificationItemProps {
	notification: NotificationResponseData;
	userRole: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	translations: any;
	updateNotificationReadStatus?: (notificationId: string) => void;
	fetchUnreadCount?: () => Promise<void>;
}

export function NotificationItemComponent({
	notification,
	userRole,
	translations,
	updateNotificationReadStatus,
	fetchUnreadCount,
}: NotificationItemProps) {
	const pathname = usePathname();
	const isMobile = useIsMobile();
	const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
	const [sheetKey, setSheetKey] = useState(0);

	const config = getNotificationConfig(userRole, notification.message.key);
	const Icon = config.icon;

	const title = getNotificationTitle(notification, userRole, translations);
	// Generate description using translation key and params with variable substitution
	const description = formatNotificationDescription(
		notification.message.key,
		notification.message.params,
		userRole,
		translations,
	);
	const tTimeAgo = useTranslations("Notification.timeAgo");
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const timeAgo = getTimeAgo(notification.createdAt, (key: string) => tTimeAgo(key as any));

	// Handle notification click to mark as read and open details
	const handleNotificationClick = async () => {
		// Open the related details component if available (do this first)
		if (config.component && notification.relatedId) {
			setIsDetailSheetOpen(true);
			setSheetKey((prev) => prev + 1); // Change key to force remount
		}

		// Mark as read if unread (do this after opening the sheet)
		if (!notification.isRead) {
			try {
				await readNotification(notification.id);
				// Update the local state immediately
				if (updateNotificationReadStatus) {
					updateNotificationReadStatus(notification.id);
				}
				// Refresh unread count in navigation bar
				if (fetchUnreadCount) {
					await fetchUnreadCount();
				}
			} catch (error) {
				console.error("Failed to mark notification as read:", error);
			}
		}
	};

	// Render the appropriate details component
	const renderDetailsComponent = () => {
		if (!config.component || !notification.relatedId) return null;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const DetailsComponent = config.component as React.ComponentType<any>;

		// Handle different component types based on their expected props
		// Check if it's a BookingDetails component
		if (
			DetailsComponent === NOTIFICATION_CONFIG.Employee?.["booking-request-approve"]?.component ||
			DetailsComponent === NOTIFICATION_CONFIG.Coordinator?.["coordinator-booking-request-approval"]?.component
		) {
			return (
				<DetailsComponent
					bookingId={notification.relatedId}
					mobile={isMobile}
					openInitially={isDetailSheetOpen}
					coordinator={userRole === "Coordinator"}
				/>
			);
		}

		// Check for TripDetails component
		if (DetailsComponent === NOTIFICATION_CONFIG.Driver?.["driver-new-trip-assigned"]?.component) {
			return (
				<DetailsComponent tripId={notification.relatedId} mobile={isMobile} openInitially={isDetailSheetOpen} />
			);
		}

		// Check for ExpenseDetails component
		if (DetailsComponent === NOTIFICATION_CONFIG.Driver?.["driver-logged-expenses"]?.component) {
			return (
				<DetailsComponent
					expenseId={notification.relatedId}
					mobile={isMobile}
					openInitially={isDetailSheetOpen}
				/>
			);
		}

		// Check for RequestDetails component
		if (DetailsComponent === NOTIFICATION_CONFIG.Driver?.["driver-leave-approved"]?.component) {
			if (
				notification.message.key === "driver-leave-approved" ||
				notification.message.key === "driver-leave-rejected" ||
				notification.message.key === "driver-leave-request-submit-by-coordinator"
			) {
				return (
					<DetailsComponent
						requestId={notification.relatedId}
						mobile={isMobile}
						openInitially={isDetailSheetOpen}
						requestType="leave-schedule"
					/>
				);
			} else {
				return (
					<DetailsComponent
						requestId={notification.relatedId}
						mobile={isMobile}
						openInitially={isDetailSheetOpen}
						requestType="vehicle-service"
					/>
				);
			}
		}

		// Check for ActivityDetails component
		if (DetailsComponent === NOTIFICATION_CONFIG.Driver?.["driver-activity-log-approved"]?.component) {
			return (
				<DetailsComponent
					activityId={notification.relatedId}
					mobile={isMobile}
					openInitially={isDetailSheetOpen}
				/>
			);
		}

		// Check for ExecutiveActivityDetails component
		if (DetailsComponent === NOTIFICATION_CONFIG.Executive?.["executive-receive-activity-log"]?.component) {
			return (
				<DetailsComponent
					activityId={notification.relatedId}
					mobile={isMobile}
					openInitially={isDetailSheetOpen}
				/>
			);
		}

		// Check for ViewExpense component
		if (DetailsComponent === NOTIFICATION_CONFIG.Coordinator?.["coordinator-expense-review"]?.component) {
			return (
				<SheetForm
					promise={() =>
						notification.relatedId
							? getExpense(notification.relatedId)
							: Promise.reject("Invalid relatedId")
					}
					Component={DetailsComponent}
					title="Expense Details"
					isOpen={isDetailSheetOpen}
					onOpenChange={setIsDetailSheetOpen}
				/>
			);
		}

		// Check for TripView component
		if (DetailsComponent === NOTIFICATION_CONFIG.Coordinator?.["coordinator-trip-success"]?.component) {
			return (
				<SheetForm
					promise={() =>
						notification.relatedId ? getTrip(notification.relatedId) : Promise.reject("Invalid relatedId")
					}
					Component={DetailsComponent}
					title="Trip Details"
					isOpen={isDetailSheetOpen}
					onOpenChange={setIsDetailSheetOpen}
				/>
			);
		}

		// Check for LeaveRequestView component
		if (DetailsComponent === NOTIFICATION_CONFIG.Coordinator?.["coordinator-leave-request-submit"]?.component) {
			return (
				<SheetForm
					promise={() =>
						notification.relatedId
							? getLeaveRequestById(notification.relatedId)
							: Promise.reject("Invalid relatedId")
					}
					Component={DetailsComponent}
					title="Leave Request Details"
					isOpen={isDetailSheetOpen}
					onOpenChange={setIsDetailSheetOpen}
				/>
			);
		}

		// Check for ViewVsr component
		if (DetailsComponent === NOTIFICATION_CONFIG.Coordinator?.["coordinator-vehicle-service-review"]?.component) {
			return (
				<SheetForm
					promise={() =>
						notification.relatedId
							? getVehicleServiceById(notification.relatedId)
							: Promise.reject("Invalid relatedId")
					}
					Component={DetailsComponent}
					title="Vehicle Service Request Details"
					isOpen={isDetailSheetOpen}
					onOpenChange={setIsDetailSheetOpen}
				/>
			);
		}

		// Check for ViewTripFeedbacks component
		if (DetailsComponent === NOTIFICATION_CONFIG.Coordinator?.["coordinator-bad-rating-alert"]?.component) {
			return (
				<SheetForm
					promise={() =>
						notification.relatedId
							? getTripFeedbackById(notification.relatedId)
							: Promise.reject("Invalid relatedId")
					}
					Component={DetailsComponent}
					title="Trip Feedback Details"
					isOpen={isDetailSheetOpen}
					onOpenChange={setIsDetailSheetOpen}
				/>
			);
		}

		console.warn(
			"No specific component found for notification type:",
			config.type,
			"Key:",
			notification.message.key,
		);
		// Fallback: try to render with common props
		return (
			<DetailsComponent
				{...{ [notification.relatedId ? "id" : "itemId"]: notification.relatedId }}
				mobile={isMobile}
				openInitially={isDetailSheetOpen}
			/>
		);
	};

	return (
		<>
			<div
				className={`flex flex-row gap-4 bg-background cursor-pointer hover:bg-muted/50 transition-colors ${!isMobile && pathname === "/notification" && "p-2 rounded-md"} ${
					!notification.isRead ? "bg-gray-200 rounded-md" : ""
				}`}
				onClick={handleNotificationClick}
			>
				<div className={`w-1.5 rounded-tr-md rounded-br-md ${config.bgColor}`}></div>
				<div className="flex items-center w-full py-2 rounded-lg">
					<div>
						<Icon className={`size-8 ${config.textColor}`} />
					</div>
					<div className="w-full ml-4">
						<div className="flex flex-row justify-between w-full space-y-1">
							<div className="flex flex-row gap-2">
								<p className={`text-subtitle-1 ${!notification.isRead ? "font-semibold" : ""}`}>
									{highlightTitle(title, config.highlightWords, config.textColor)}
								</p>
								{config.component && notification.relatedId && <ExternalLink className="size-5" />}
							</div>
							<p className="mr-2 text-body-2 text-muted-foreground">{timeAgo}</p>
						</div>
						<p className={`text-body-2 ${!notification.isRead ? "font-medium" : "text-muted-foreground"}`}>
							{highlightTextContent(description, config.highlightWords, config.textColor)}
						</p>
					</div>
				</div>
			</div>

			{/* Render details component when notification is clicked */}
			{isDetailSheetOpen &&
				(() => {
					const detailsComponent = renderDetailsComponent();
					return detailsComponent ? React.cloneElement(detailsComponent, { key: sheetKey }) : null;
				})()}
		</>
	);
}
