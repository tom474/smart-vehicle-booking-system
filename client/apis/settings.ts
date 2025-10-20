import { apiURL, customFetch } from "@/lib/utils";
import { z } from "zod/v4";

// <`${number extends 0 | 1 | 2 ? number : never}:${number}`>
export const TimeSettingSchema = z.custom((val) => {
	return typeof val === "string" ? /^([01]\d|2[0-3]):([0-5]\d)$/.test(val) : false;
}, "Invalid time format, must be HH:MM (00:00–23:59)");

export const ScheduleEnum = z.enum([
	"daily",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
]);

export const TripOptimizerSettingSchema = z.object({
	enabled: z.boolean(),
	schedule: ScheduleEnum,
	time: TimeSettingSchema,
});

export const TripFinalizerSettingSchema = z.object({
	enabled: z.boolean(),
	leadHours: z.number().min(1, "Lead hours must be larger than 0"),
	time: TimeSettingSchema,
});

export const TripReminderSettingSchema = z.object({
	enabled: z.boolean(),
	time: TimeSettingSchema,
});

export const NotificationSettingSchema = z.object({
	enabled: z.boolean(),
	emailEnabled: z.boolean(),
});

export const ActivityLogSettingSchema = z.object({
	enabled: z.boolean(),
});

export const SupportContactSettingSchema = z.object({
	name: z.string(),
	phone: z.string(),
});

export const LegacySettingsSchema = z.object({
	// Trip
	tripOptimizer: TripOptimizerSettingSchema,
	tripFinalizer: TripFinalizerSettingSchema,
	tripReminder: TripReminderSettingSchema,

	// Notification
	notification: NotificationSettingSchema,

	// Other
	activityLog: ActivityLogSettingSchema,
	supportContact: SupportContactSettingSchema,
});

export const SettingType = z.enum(["enabled", "time", "schedule", "lead_hours", "string"]);

export const SettingsSchema = z.object({
	id: z.string().regex(/^SET-/, "Must start with 'SET-'"),
	title: z.string(),
	description: z.string(),
	value: z.string(),
	key: z.string().regex(/^[^.]+\.[^.]+(\.[^.]+)*$/, "Must contain at least one dot between parts"),
});

export type SettingsData = z.infer<typeof SettingsSchema>;

export async function getSettings(): Promise<SettingsData[]> {
	try {
		const endpoint = `${apiURL}/settings`;
		const res = await customFetch(endpoint, {
			method: "GET",
		});

		if (!res.ok) {
			throw new Error(`Failed to get settings: ${res.statusText}`);
		}

		const json = await res.json();
		console.log(json);

		return SettingsSchema.array().parse(json.data);
	} catch (error) {
		console.log(error);
		throw error;
	}
}

export async function updateSetting(id: string, value: string) {
	try {
		const endpoint = `${apiURL}/settings/${id}`;
		const res = await customFetch(endpoint, {
			method: "PUT",
			body: {
				value,
			},
		});

		if (!res.ok) {
			throw new Error(`Failed to get settings: ${res.statusText}`);
		}
	} catch (error) {
		console.log(error);
		throw error;
	}
}

export async function getSupportContact() {
	try {
		const contact = await fetch("/api/settings/support-contacts");
		const json = await contact.json();
		if (!contact.ok) {
			throw new Error(`Failed to fetch support contact: ${json.message || contact.statusText}`);
		}
		interface SupportContactSetting {
			key: string;
			value: string;
		}
		const name: string =
			json.data.find((s: SupportContactSetting) => s.key === "support_contact.name")?.value ?? "";
		const phone = json.data.find((s: SupportContactSetting) => s.key === "support_contact.phone")?.value ?? "";
		return SupportContactSettingSchema.parse({ name, phone });
	} catch (error) {
		console.error("Failed to fetch support contact:", error);
		throw error;
	}
}

export type LegacySettingsData = z.infer<typeof LegacySettingsSchema>;
