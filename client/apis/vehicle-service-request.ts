import { z } from "zod/v4";
import { getSchedule, ScheduleSchema } from "./schedule";
import { apiURL } from "@/lib/utils";
import { customFetch } from "@/lib/utils";
import { UrlCommonParams } from "@/types/api-params";
import { buildQueryParams } from "@/lib/build-query-param";
import { DriverSchema, getDriver } from "./driver";

export const BasicDriverSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().nullable().optional(),
	phoneNumber: z.string(),
	username: z.string(),
	profileImageUrl: z.string().nullable().optional(),
	status: z.string(),
	availability: z.string(),
	startDate: z.date().optional(),
});

export const VehicleServiceSchema = z.object({
	id: z.string(),

	driverId: z.string(),
	driver: DriverSchema.optional(),

	vehicleId: z.string(),

	reason: z
		.string()
		.nullable()
		.optional()
		.transform((x) => x ?? undefined),

	description: z
		.string()
		.nullable()
		.optional()
		.transform((x) => x ?? undefined),

	serviceType: z.enum(["maintenance", "repair", "other"]),

	startTime: z.coerce.date(),

	endTime: z.coerce.date(),

	status: z.enum([
		"pending",
		"approved",
		"rejected",
		"completed",
		"cancelled",
	]),

	scheduleId: z.string().nullable().optional(),
	schedule: ScheduleSchema.optional(),

	expenses: z.string().array().optional(),

	createdAt: z.coerce.date(),

	updatedAt: z.coerce.date().optional(),
});

export type VehicleServiceData = z.infer<typeof VehicleServiceSchema>;

export const CreateVehicleServiceSchemae = z
	.object({
		vehicleId: z.string({ error: "Vehicle ID is required" }),
		reason: z.string("Please provide a reason"),
		description: z.string().optional(),
		serviceType: z.enum(["maintenance", "repair", "other"], {
			error: "Service type is required",
		}),

		startTime: z.date({
			error: "Start time is required",
		}),

		endTime: z.date({
			error: "End time is required",
		}),
	})
	.refine(
		(data) => {
			if (!data.startTime) return true;
			return new Date(data.startTime) > new Date();
		},
		{
			message: "Start time must be in the future.",
			path: ["startTime"],
		},
	)
	.refine(
		(data) => {
			if (!data.startTime || !data.endTime) return true;
			return new Date(data.endTime) > new Date(data.startTime);
		},
		{
			message: "End time must be after start time.",
			path: ["endTime"],
		},
	);

export type CreateVehicleServiceData = z.infer<
	typeof CreateVehicleServiceSchemae
>;

export async function getVehicleServices({
	...p
}: UrlCommonParams): Promise<VehicleServiceData[]> {
	try {
		const query = buildQueryParams(p);
		const response = await customFetch(
			`${apiURL}/vehicle-services?${query.toString()}`,
		);

		if (!response.ok) {
			throw new Error(`Failed to get vehicle services: ${response}`);
		}

		const data = await response.json();
		let vehicleServiceReqs = VehicleServiceSchema.array().parse(data.data);
		vehicleServiceReqs = await Promise.all(
			vehicleServiceReqs.map(async (vehicleServiceReq) => {
				vehicleServiceReq.driver = await getDriver(
					vehicleServiceReq.driverId,
				);
				if (vehicleServiceReq.scheduleId)
					vehicleServiceReq.schedule = await getSchedule(
						vehicleServiceReq.scheduleId,
					);
				return vehicleServiceReq;
			}),
		);

		return vehicleServiceReqs;

		// return mockVehicleService
	} catch (e) {
		throw e;
	}
}

export async function getVehicleServiceById(
	id: string,
): Promise<VehicleServiceData> {
	try {
		const response = await customFetch(`${apiURL}/vehicle-services/${id}`);

		if (!response.ok) {
			throw new Error(`Failed to get vehicle service: ${response}`);
		}

		const data = await response.json();
		return VehicleServiceSchema.parse(data.data);
		// return mockVehicleService.find((d) => d.id === id)!
	} catch (e) {
		throw e;
	}
}

export async function createVehicleService(data: CreateVehicleServiceData) {
	try {
		const response = await customFetch(`${apiURL}/vehicle-services`, {
			method: "POST",
			body: data,
		});

		console.log(response);

		if (!response.ok) {
			throw new Error("Failed to create vehicle service");
		}
	} catch (error: unknown) {
		console.error("Error creating vehicle service:", error);
	}
}

export type UpdateVehicleServiceData = CreateVehicleServiceData;

export async function updateLeaveRequest(
	id: string,
	data: UpdateVehicleServiceData,
) {
	try {
		const response = await customFetch(`${apiURL}/vehicle-services/${id}`, {
			method: "PUT",
			body: data,
		});

		console.log(response);

		if (!response.ok) {
			throw new Error("Failed to update user");
		}
	} catch (error: unknown) {
		console.error("Error creating leave requests:", error);
	}
}

export async function rejectVehicleServiceRequest(id: string, reason: string) {
	try {
		const response = await customFetch(
			`${apiURL}/vehicle-services/${id}/reject`,
			{
				method: "PUT",
				body: {
					reason,
				},
			},
		);

		console.log(response);

		if (!response.ok) {
			throw new Error("Failed to reject user");
		}
	} catch (error: unknown) {
		console.error("Error rejecting requests:", error);
	}
}

export async function approveVehicleServiceRequest(id: string) {
	try {
		const response = await customFetch(
			`${apiURL}/vehicle-services/${id}/approve`,
			{
				method: "PUT",
			},
		);

		console.log(response);

		if (!response.ok) {
			throw new Error("Failed to approve user");
		}
	} catch (error: unknown) {
		console.error("Error approve requests:", error);
	}
}

export async function deleteVehicleServiceRequest(id: string) {
	try {
		const response = await customFetch(`${apiURL}/vehicle-services/${id}`, {
			method: "DELETE",
		});

		console.log(response);

		if (!response.ok) {
			throw await response.json();
		}
	} catch (error: unknown) {
		console.error("Error deleting requests:", error);
	}
}
