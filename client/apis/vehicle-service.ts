import { z } from "zod/v4";
import { apiURL } from "@/lib/utils";
import { customFetch } from "@/lib/utils";

const VehicleServiceSchema = z.object({
	id: z.string(),
	status: z.enum(["pending", "approved", "rejected", "cancelled", "completed"], {
		error: "Status is required.",
	}),
	driverId: z.string().optional().nullable(),
	vehicleId: z.string().optional().nullable(),
	scheduleId: z.string().optional().nullable(),
	expenseIds: z.array(z.string()),
	serviceType: z.enum(["repair", "maintenance", "other"], {
		error: "Status is required.",
	}),
	startTime: z.date({
		error: "Preferred departure time is required.",
	}),
	endTime: z.date({
		error: "Arrival deadline is required.",
	}),
	reason: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	rejectReason: z.string().optional().nullable(),
});

type VehicleServiceData = z.infer<typeof VehicleServiceSchema>;

interface GetVehicleServiceParams {
	driverId?: number | string;
	status?: "pending" | "approved" | "rejected" | "cancelled" | "completed";
	orderField?: string;
	orderDirection?: "ASC" | "DESC";
	page?: number;
	limit?: number;
}

async function getVehicleServices({
	driverId,
	status,
	orderField = "startTime",
	orderDirection = "ASC",
	page,
	limit,
}: GetVehicleServiceParams): Promise<VehicleServiceData[]> {
	let url = `${apiURL}/vehicle-services`;

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
		const bookingRequests = jsonResponse.data.map(transformVehicleServiceData);
		return bookingRequests;
	} catch (error) {
		throw error;
	}
}

async function getVehicleService(id: string | number): Promise<VehicleServiceData> {
	const url = `${apiURL}/vehicle-services/${id}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch booking request: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		return transformVehicleServiceData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

async function createVehicleService(data: VehicleServiceData): Promise<VehicleServiceData> {
	const url = `${apiURL}/vehicle-services`;

	try {
		const transformedData = {
			...data,
			reason: data.reason || null,
			description: data.description || null,
		};
		const response = await customFetch(url, {
			method: "POST",
			body: transformedData,
		});

		if (!response.ok) {
			const json = await response.json();
			throw json;
		}

		const jsonResponse = await response.json();
		return transformVehicleServiceData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

async function cancelVehicleService(id: string | number, reason?: string) {
	console.log("Reason for cancellation:", reason);
	const url = `${apiURL}/vehicle-services/${id}`;

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

async function updateVehicleService(
	id: string | number,
	data: Partial<VehicleServiceData>,
): Promise<VehicleServiceData> {
	const url = `${apiURL}/vehicle-services/${id}`;

	try {
		const transformedData = {
			...data,
			reason: data.reason || null,
			description: data.description || null,
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
		return transformVehicleServiceData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

export {
	VehicleServiceSchema,
	type VehicleServiceData,
	getVehicleServices,
	getVehicleService,
	createVehicleService,
	cancelVehicleService,
	updateVehicleService,
};

function transformVehicleServiceData(item: VehicleServiceData): VehicleServiceData {
	const transformedItem = {
		...item,
		startTime: new Date(item.startTime),
		endTime: new Date(item.endTime),
	};

	return VehicleServiceSchema.parse(transformedItem);
}
