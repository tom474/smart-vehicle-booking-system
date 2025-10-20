import BookingRequest from "../database/entities/BookingRequest";

export const Notifications = {
	// General User Notifications
	TripReminder: { key: "trip-reminder", params: { date: "" }, relatedId: "" },
	BookingRequestApproved: {
		key: "booking-request-approve",
		params: { date: "" },
		relatedId: "",
	},
	BookingRequestModifiedByCoordinator: {
		key: "booking-request-modified-by-coordinator",
		params: { date: "" },
		relatedId: "",
	},
	BookingRequestCancelledByCoordinator: {
		key: "booking-request-cancel-by-coordinator",
		params: { date: "" },
		relatedId: "",
	},
	BookingRequestCancelledByRequester: {
		key: "booking-request-cancel-by-requester",
		params: {},
		relatedId: "",
	},
	BookingRequestRejected: {
		key: "booking-request-rejected-by-coordinator",
		params: { date: "" },
		relatedId: "",
	},
	UserInfoUpdated: { key: "user-info-updated", params: {}, relatedId: "" },

	// Coordinator Notifications
	CoordinatorBookingRequestApproval: {
		key: "coordinator-booking-request-approval",
		params: { employeeName: "" },
		relatedId: "",
	},
	CoordinatorLeaveRequestSubmit: {
		key: "coordinator-leave-request-submit",
		params: { driverName: "", startDate: "", endDate: "" },
		relatedId: "",
	},
	CoordinatorTripSuccess: {
		key: "coordinator-trip-success",
		params: { date: "" },
		relatedId: "",
	},
	CoordinatorExpenseReview: {
		key: "coordinator-expense-review",
		params: { driverName: "", tripDate: "" },
		relatedId: "",
	},
	CoordinatorVehicleServiceReview: {
		key: "coordinator-vehicle-service-review",
		params: { driverName: "", vehicleCode: "" },
		relatedId: "",
	},
	CoordinatorBadTripRatingReceive: {
		key: "coordinator-bad-rating-alert",
		params: { driverName: "", rating: "", tripDate: "" },
		relatedId: "",
	},
	NewUrgentBookingRequest: {
		key: "urgent-booking-request",
		params: { employeeName: "", departureDate: "", departureTime: "" },
		relatedId: "",
	},
	NewVipBookingRequest: {
		key: "vip-booking-request",
		params: { employeeName: "", departureDate: "", departureTime: "" },
		relatedId: "",
	},
	NewBookingRequest: {
		key: "new-booking-request",
		params: { employeeName: "" },
		relatedId: "",
	},
	BookingRequestUpdated: {
		key: "coordinator-booking-request-updated",
		params: { bookingRequestId: "" },
		relatedId: "",
	},
	UrgentBookingRequestUpdated: {
		key: "coordinator-urgent-booking-request-updated",
		params: { bookingRequestId: "" },
		relatedId: "",
	},
	VipBookingRequestUpdated: {
		key: "coordinator-vip-booking-request-updated",
		params: { bookingRequestId: "" },
		relatedId: "",
	},
	NoVehicleAvailableForBookingRequest: {
		key: "booking-request-no-vehicle-available",
		params: { departureDate: "", departureTime: "" },
		relatedId: "",
	},

	// Driver Notifications
	DriverNewTripAssigned: {
		key: "driver-new-trip-assigned",
		params: { date: "", time: "" },
		relatedId: "",
	},
	DriverTripInformationChanged: {
		key: "driver-trip-information-changed",
		params: { date: "" },
		relatedId: "",
	},
	DriverTripCancelled: {
		key: "driver-trip-cancel",
		params: { date: "" },
		relatedId: "",
	},
	DriverReminder: {
		key: "driver-reminder",
		params: { time: "" },
		relatedId: "",
	},

	DriverExpensesApproved: {
		key: "driver-expenses-approved",
		params: { date: "" },
		relatedId: "",
	},
	DriverExpensesRejected: {
		key: "driver-expenses-rejected",
		params: { date: "" },
		relatedId: "",
	},
	DriverLeaveApproved: {
		key: "driver-leave-approved",
		params: { startDate: "", endDate: "" },
		relatedId: "",
	},
	DriverLeaveRejected: {
		key: "driver-leave-rejected",
		params: { startDate: "", endDate: "", reason: "" },
		relatedId: "",
	},
	DriverLeaveRequestSubmittedByCoordinator: {
		key: "driver-leave-request-submit-by-coordinator",
		params: {},
		relatedId: "",
	},
	DriverExpenseSubmittedByCoordinator: {
		key: "driver-expense-submit-by-coordinator",
		params: {},
		relatedId: "",
	},
	DriverVehicleServiceSubmittedByCoordinator: {
		key: "driver-vehicle-service-submit-by-coordinator",
		params: {},
		relatedId: "",
	},
	DriverVehicleServiceApproved: {
		key: "driver-vehicle-service-approved",
		params: { date: "" },
		relatedId: "",
	},
	DriverVehicleServiceRejected: {
		key: "driver-vehicle-service-rejected",
		params: { date: "" },
		relatedId: "",
	},
	ActivityLogApproved: {
		key: "driver-activity-log-approved",
		params: {},
		relatedId: "",
	},
	ActivityLogRejected: {
		key: "driver-activity-log-rejected",
		params: {},
		relatedId: "",
	},
	// Executive
	ExecutiveReceiveActivityLog: {
		key: "executive-receive-activity-log",
		params: { name: "", startTime: "", endTime: "" },
		relatedId: "",
	},
} as const;

export type NotificationKey = keyof typeof Notifications;

export type NotificationParams<T extends NotificationKey> =
	(typeof Notifications)[T]["params"];

export type NotificationTemplate<T extends NotificationKey> = {
	key: (typeof Notifications)[T]["key"];
	params: NotificationParams<T>;
};

export default function createNotification<T extends NotificationKey>(
	type: T,
	params: NotificationParams<T>,
): NotificationTemplate<T> {
	return {
		key: Notifications[type].key,
		params,
	};
}
