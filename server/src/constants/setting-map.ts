enum SettingMap {
	// Trip Optimizer Settings
	TRIP_OPTIMIZER_ENABLED = "trip.optimizer.enabled",
	TRIP_OPTIMIZER_SCHEDULE = "trip.optimizer.schedule",
	TRIP_OPTIMIZER_TIME = "trip.optimizer.time",

	// Trip Finalizer Settings
	TRIP_FINALIZER_ENABLED = "trip.finalizer.enabled",
	TRIP_FINALIZER_LEAD_HOURS = "trip.finalizer.lead_hours",
	TRIP_FINALIZER_TIME = "trip.finalizer.time",

	// Trip Reminder Settings
	TRIP_REMINDER_ENABLED = "trip.reminder.enabled",
	TRIP_REMINDER_TIME = "trip.reminder.time",

	// Notification Settings
	NOTIFICATION_ENABLED = "notification.enabled",
	NOTIFICATION_EMAIL_ENABLED = "notification.email.enabled",

	// Activity Log Settings
	ACTIVITY_LOG_ENABLED = "activity_log.enabled",

	// Support Contact Settings
	SUPPORT_CONTACT_NAME = "support_contact.name",
	SUPPORT_CONTACT_PHONE = "support_contact.phone",
}

export default SettingMap;
