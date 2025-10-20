import z from "zod/v4";
import { apiURL, customFetch } from "@/lib/utils";
import { buildQueryParams } from "@/lib/build-query-param";

export const ActionTypeSchema = z.enum([
	"create",
	"update",
	"delete",
	"approve",
	"reject",
	"cancel",
]);

export const ActivityLogSchema = z.object({
	id: z.string(),

	actorRole: z.string(),
	actorId: z.string(),

	entityName: z.string(),
	entityId: z.string(),

	actionType: ActionTypeSchema,
	actionDetails: z.string(),

	metadata: z.record(z.string(), z.unknown()).nullable().optional(),
	timestamp: z.coerce.date(),
});

export type ActivityLogData = z.infer<typeof ActivityLogSchema>;

export async function getActivityLogs({
	...props
}): Promise<ActivityLogData[]> {
	const queryParam = buildQueryParams(props);
	const endpoint = `${apiURL}/activity-logs?${queryParam.toString()}`;

	try {
		const response = await customFetch(endpoint);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch activity logs: ${response.statusText}`,
			);
		}

		const json = await response.json();
		console.log(json);
		return ActivityLogSchema.array().parse(json.data);
	} catch (e) {
		console.log(e);
		throw e;
	}
}
