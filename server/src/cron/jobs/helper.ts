import ApiError from "../../templates/api-error";

export interface TimeComponents {
	hour: number;
	minute: number;
}

export type ScheduleType =
	| "daily"
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

export function parseTimeValue(timeValue: string): TimeComponents {
	const timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
	const match = timeValue.match(timePattern);

	if (!match) {
		throw new ApiError(
			`Invalid time format: ${timeValue}. Expected format: HH:mm (24-hour)`,
		);
	}

	const hour = parseInt(match[1], 10);
	const minute = parseInt(match[2], 10);

	return {
		hour,
		minute,
	};
}

export function timeToCronExpression(timeComponents: TimeComponents): string {
	return `${timeComponents.minute} ${timeComponents.hour} * * *`;
}

export function parseTimeToCron(timeValue: string): string {
	const components = parseTimeValue(timeValue);
	return timeToCronExpression(components);
}

export function parseScheduleType(scheduleValue: string): string {
	const schedule = scheduleValue.toLowerCase() as ScheduleType;

	switch (schedule) {
		case "daily":
			return "*";
		case "sunday":
			return "0";
		case "monday":
			return "1";
		case "tuesday":
			return "2";
		case "wednesday":
			return "3";
		case "thursday":
			return "4";
		case "friday":
			return "5";
		case "saturday":
			return "6";
		default:
			throw new ApiError(
				`Invalid schedule type: ${scheduleValue}. Expected: daily, monday, tuesday, wednesday, thursday, friday, saturday, sunday`,
			);
	}
}

/**
 * Builds a complete cron expression from time and schedule settings
 * @param timeValue - Time in HH:mm format
 * @param scheduleValue - Schedule type (daily, monday, etc.)
 * @returns Complete cron expression
 */
export function buildCronExpression(
	timeValue: string,
	scheduleValue: string,
): string {
	const timeComponents = parseTimeValue(timeValue);
	const dayOfWeek = parseScheduleType(scheduleValue);

	return `${timeComponents.minute} ${timeComponents.hour} * * ${dayOfWeek}`;
}

/**
 * Builds cron expression with time components and schedule type
 * @param timeComponents - Hour and minute components
 * @param scheduleValue - Schedule type string
 * @returns Complete cron expression
 */
export function timeToCronWithSchedule(
	timeComponents: TimeComponents,
	scheduleValue: string,
): string {
	const dayOfWeek = parseScheduleType(scheduleValue);
	return `${timeComponents.minute} ${timeComponents.hour} * * ${dayOfWeek}`;
}
