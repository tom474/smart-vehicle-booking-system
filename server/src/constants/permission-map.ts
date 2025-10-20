enum PermissionMap {
	// Setting Permissions
	SETTING_GET = "setting.get",
	SETTING_UPDATE = "setting.update",

	// Role Permissions
	ROLE_GET = "role.get",
	ROLE_CREATE = "role.create",
	ROLE_UPDATE = "role.update",

	// Permission Permissions
	PERMISSION_GET = "permission.get",
	PERMISSION_CREATE = "permission.create",
	PERMISSION_UPDATE = "permission.update",

	// Location Permissions
	LOCATION_GET = "location.get",
	LOCATION_CREATE = "location.create",
	LOCATION_UPDATE = "location.update",

	// Vendor Permissions
	VENDOR_GET = "vendor.get",
	VENDOR_CREATE = "vendor.create",
	VENDOR_UPDATE = "vendor.update",

	// User Permissions
	USER_GET = "user.get",
	USER_CREATE = "user.create",
	USER_UPDATE = "user.update",
	USER_CHANGE_ROLE = "user.change_role",
	USER_ACTIVATE = "user.activate",
	USER_DEACTIVATE = "user.deactivate",
	USER_SUSPEND = "user.suspend",
	USER_ASSIGN_DEDICATED_VEHICLE = "user.assign_dedicated_vehicle",

	// Driver Permissions
	DRIVER_GET = "driver.get",
	DRIVER_CREATE = "driver.create",
	DRIVER_UPDATE = "driver.update",
	DRIVER_RESET_PASSWORD = "driver.reset_password",
	DRIVER_CHANGE_BASE_LOCATION = "driver.change_base_location",
	DRIVER_ACTIVATE = "driver.activate",
	DRIVER_DEACTIVATE = "driver.deactivate",
	DRIVER_SUSPEND = "driver.suspend",
	DRIVER_ASSIGN_VEHICLE = "driver.assign_vehicle",

	// Vehicle Permissions
	VEHICLE_GET = "vehicle.get",
	VEHICLE_GET_AVAILABLE = "vehicle.get_available",
	VEHICLE_CREATE = "vehicle.create",
	VEHICLE_UPDATE = "vehicle.update",

	// Outsourced Vehicle Permissions
	OUTSOURCED_VEHICLE_GET = "outsourced_vehicle.get",
	OUTSOURCED_VEHICLE_CREATE = "outsourced_vehicle.create",
	OUTSOURCED_VEHICLE_UPDATE = "outsourced_vehicle.update",

	// Booking Request Permissions
	BOOKING_REQUEST_GET = "booking_request.get",
	BOOKING_REQUEST_CREATE = "booking_request.create",
	BOOKING_REQUEST_UPDATE = "booking_request.update",
	BOOKING_REQUEST_CANCEL = "booking_request.cancel",
	BOOKING_REQUEST_REJECT = "booking_request.reject",
	BOOKING_REQUEST_DELETE = "booking_request.delete",
	BOOKING_REQUEST_ASSIGN_VEHICLE = "booking_request.assign_vehicle",

	// Trip Permissions
	TRIP_GET = "trip.get",
	TRIP_UPDATE = "trip.update",
	TRIP_ASSIGN_VEHICLE = "trip.assign_vehicle",
	TRIP_COMBINE = "trip.combine",
	TRIP_UNCOMBINE = "trip.uncombine",
	TRIP_APPROVE = "trip.approve",
	TRIP_START = "trip.start",
	TRIP_END = "trip.end",
	TRIP_CONFIRM_PICK_UP = "trip.confirm_pick_up",
	TRIP_CONFIRM_DROP_OFF = "trip.confirm_drop_off",
	TRIP_CONFIRM_ABSENCE_PASSENGERS = "trip.confirm_absence_passengers",
	TRIP_GET_PUBLIC_ACCESS_LINK = "trip.get_public_access_link",
	TRIP_GENERATE_PUBLIC_ACCESS_LINK = "trip.generate_public_access_link",
	TRIP_GET_DRIVER_CURRENT_LOCATION = "trip.get_driver_current_location",
	TRIP_UPDATE_DRIVER_CURRENT_LOCATION = "trip.update_driver_current_location",

	// Trip Ticket Permissions
	TRIP_TICKET_GET = "trip_ticket.get",

	// Trip Stop Permissions
	TRIP_STOP_GET = "trip_stop.get",
	TRIP_STOP_ARRIVE = "trip_stop.arrive",

	// Trip Feedback Permissions
	TRIP_FEEDBACK_GET = "trip_feedback.get",
	TRIP_FEEDBACK_CREATE = "trip_feedback.create",

	// Leave Request Permissions
	LEAVE_REQUEST_GET = "leave_requests.get",
	LEAVE_REQUEST_CREATE = "leave_requests.create",
	LEAVE_REQUEST_UPDATE = "leave_requests.update",
	LEAVE_REQUEST_APPROVE = "leave_requests.approve",
	LEAVE_REQUEST_REJECT = "leave_requests.reject",
	LEAVE_REQUEST_CANCEL = "leave_requests.cancel",
	LEAVE_REQUEST_DELETE = "leave_requests.delete",

	// Vehicle Service Permissions
	VEHICLE_SERVICE_GET = "vehicle_service.get",
	VEHICLE_SERVICE_CREATE = "vehicle_service.create",
	VEHICLE_SERVICE_UPDATE = "vehicle_service.update",
	VEHICLE_SERVICE_APPROVE = "vehicle_service.approve",
	VEHICLE_SERVICE_REJECT = "vehicle_service.reject",
	VEHICLE_SERVICE_CANCEL = "vehicle_service.cancel",
	VEHICLE_SERVICE_DELETE = "vehicle_service.delete",

	// Schedules Permissions
	SCHEDULE_GET = "schedule.get",
	SCHEDULE_CREATE = "schedule.create",
	SCHEDULE_UPDATE = "schedule.update",
	SCHEDULE_DELETE = "schedule.delete",
	SCHEDULE_CHECK_CONFLICT = "schedule.check_conflict",

	// Expense Permissions
	EXPENSE_GET = "expense.get",
	EXPENSE_CREATE = "expense.create",
	EXPENSE_UPDATE = "expense.update",
	EXPENSE_APPROVE = "expense.approve",
	EXPENSE_REJECT = "expense.reject",
	EXPENSE_CANCEL = "expense.cancel",
	EXPENSE_DELETE = "expense.delete",

	// Executive Vehicle Activity Permissions
	EXECUTIVE_VEHICLE_ACTIVITY_GET = "executive_vehicle_activity.get",
	EXECUTIVE_VEHICLE_ACTIVITY_CREATE = "executive_vehicle_activity.create",
	EXECUTIVE_VEHICLE_ACTIVITY_UPDATE = "executive_vehicle_activity.update",
	EXECUTIVE_VEHICLE_ACTIVITY_CONFIRM = "executive_vehicle_activity.confirm",
	EXECUTIVE_VEHICLE_ACTIVITY_REJECT = "executive_vehicle_activity.reject",

	// Notification Permissions
	NOTIFICATION_GET = "notification.get",
	NOTIFICATION_MARK_AS_READ = "notification.mark_as_read",

	// Activity Log Permissions
	ACTIVITY_LOG_GET = "activity_log.get",

	// Report Permissions
	REPORT_GENERATE = "report.generate",
}

export default PermissionMap;
