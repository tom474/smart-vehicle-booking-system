import { z } from "zod/v4";
import { apiURL } from "@/lib/utils";
import { customFetch } from "@/lib/utils";

const LeaveScheduleSchema = z.object({
	id: z.string(),
	driverId: z.string().optional().nullable(),
	scheduleId: z.string().optional().nullable(),
	status: z.enum(["pending", "approved", "rejected", "cancelled", "completed"]),
	startTime: z.date({
		error: "Preferred departure time is required.",
	}),
	endTime: z.date({
		error: "Arrival deadline is required.",
	}),
	reason: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	rejectReason: z.string().optional().nullable(),
});

type LeaveScheduleData = z.infer<typeof LeaveScheduleSchema>;

interface GetLeaveSchedulesParams {
	driverId?: number | string;
	status?: "pending" | "approved" | "rejected" | "cancelled" | "completed";
	orderField?: string;
	orderDirection?: "ASC" | "DESC";
	page?: number;
	limit?: number;
}

async function getLeaveSchedules({
	driverId,
	status,
	orderField = "startTime",
	orderDirection = "ASC",
	page,
	limit,
}: GetLeaveSchedulesParams): Promise<LeaveScheduleData[]> {
	let url = `${apiURL}/leave-requests`;

	const queryParams = new URLSearchParams();

	if (orderField) queryParams.append("orderField", orderField);
	if (orderDirection) queryParams.append("orderDirection", orderDirection);
	if (page !== undefined) queryParams.append("page", page.toString());
	if (limit !== undefined) queryParams.append("limit", limit.toString());
	if (status) queryParams.append("status", status);
	if (driverId) queryParams.append("driverId", driverId.toString());

	url += `?${queryParams.toString()}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch booking requests: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		const bookingRequests = jsonResponse.data.map(transformLeaveScheduleData);
		return bookingRequests;
	} catch (error) {
		throw error;
	}
}

async function getLeaveSchedule(id: string | number): Promise<LeaveScheduleData> {
	const url = `${apiURL}/leave-requests/${id}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch booking request: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		return transformLeaveScheduleData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

async function createLeaveSchedule(data: LeaveScheduleData): Promise<LeaveScheduleData> {
	const url = `${apiURL}/leave-requests`;
	try {
		const response = await customFetch(url, {
			method: "POST",
			body: data,
		});

		if (!response.ok) {
			const json = await response.json();
			throw json;
		}

		const jsonResponse = await response.json();
		return transformLeaveScheduleData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

async function cancelLeaveSchedule(id: string | number, reason?: string) {
	console.log("Reason for cancellation:", reason);
	const url = `${apiURL}/leave-requests/${id}`;

	try {
		const response = await customFetch(url, {
			method: "DELETE",
			body: {
				status: "cancelled",
				// reason: reason,
			},
		});

		if (!response.ok) {
			const json = await response.json();
			throw json;
		}
	} catch (error) {
		throw error;
	}
}

async function updateLeaveSchedule(id: string | number, data: Partial<LeaveScheduleData>): Promise<LeaveScheduleData> {
	const url = `${apiURL}/leave-requests/${id}`;

	try {
		const transformedData = {
			...data,
			reason: data.reason || null,
			notes: data.notes || null,
		};
		const response = await customFetch(url, {
			method: "PUT",
			body: transformedData,
		});

		if (!response.ok) {
			const json = await response.json();
			throw json;
		}

		const jsonResponse = await response.json();
		return transformLeaveScheduleData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

export {
	LeaveScheduleSchema,
	type LeaveScheduleData,
	getLeaveSchedule,
	getLeaveSchedules,
	createLeaveSchedule,
	cancelLeaveSchedule,
	updateLeaveSchedule,
};

function transformLeaveScheduleData(item: LeaveScheduleData): LeaveScheduleData {
	const transformedItem = {
		...item,
		startTime: new Date(item.startTime),
		endTime: new Date(item.endTime),
	};

	return LeaveScheduleSchema.parse(transformedItem);
}
