import { z } from "zod/v4";
import { apiURL } from "@/lib/utils";
import { customFetch } from "@/lib/utils";
import { getVehicle, VehicleData } from "@/apis/vehicle";
import { UserData } from "@/apis/user";
import { DriverData, DriverSchema } from "@/apis/driver";
import { VehicleSchema } from "@/apis/vehicle";
import { UserSchema } from "@/apis/user";
import { getDriver } from "@/apis/driver";

const ExecutiveDailyActivitySchema = z.object({
	id: z.string().optional().nullable(),
	status: z.enum(["approved", "pending", "rejected"]),
	driver: DriverSchema.optional().nullable(),
	vehicle: VehicleSchema.optional().nullable(),
	executive: UserSchema.optional().nullable(),
	startTime: z.date({
		error: "Start time is required.",
	}),
	endTime: z.date({
		error: "End time is required.",
	}),
	notes: z.string().optional().nullable(),
	workedMinutes: z.number().int().optional().nullable(),
});

type ExecutiveDailyActivityData = z.infer<typeof ExecutiveDailyActivitySchema>;

interface ExecutiveDailyActivityParams {
	id: string | number;
	driver?: boolean;
	orderField?: string;
	orderDirection?: "ASC" | "DESC";
	page?: number;
	limit?: number;
}

async function getExecutiveDailyActivities({
	id,
	driver = false,
	orderField = "startTime",
	orderDirection = "ASC",
	page = 1,
	limit = 10,
}: ExecutiveDailyActivityParams): Promise<ExecutiveDailyActivityData[]> {
	let url = `${apiURL}/${driver ? "drivers" : "executives"}/${id}/logs`;

	const queryParams = new URLSearchParams();

	if (orderField) queryParams.append("orderField", orderField);
	if (orderDirection) queryParams.append("orderDirection", orderDirection);
	if (page !== undefined) queryParams.append("page", page.toString());
	if (limit !== undefined) queryParams.append("limit", limit.toString());

	url += `?${queryParams.toString()}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Error fetching daily activities: ${response.statusText}`);
		}

		// check if response is empty
		if (response.status === 204) {
			return [];
		}

		const jsonResponse = await response.json();
		const transformedData = jsonResponse.data.map(transformExecutiveDailyActivityData);
		return transformedData;
	} catch (error) {
		console.error("Failed to fetch executive daily activities:", error);
		throw error;
	}
}

async function getExecutiveDailyActivity(id: string | number): Promise<ExecutiveDailyActivityData> {
	const url = `${apiURL}/logs/${id}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Error fetching daily activity: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		return transformExecutiveDailyActivityData(jsonResponse.data);
	} catch (error) {
		console.error(`Failed to fetch executive daily activity with ID ${id}:`, error);
		throw error;
	}
}

async function createExecutiveDailyActivity(
	executiveId: string | number,
	activity: ExecutiveDailyActivityData,
): Promise<ExecutiveDailyActivityData> {
	const url = `${apiURL}/executives/${executiveId}/logs`;

	try {
		const response = await customFetch(url, {
			method: "POST",
			body: activity,
		});

		if (!response.ok) {
			const json = await response.json();
			throw json;
		}

		const jsonResponse = await response.json();
		return transformExecutiveDailyActivityData(jsonResponse.data);
	} catch (error) {
		console.error("Failed to create executive daily activity:", error);
		throw error;
	}
}

async function updateExecutiveDailyActivity(
	id: string,
	activity: ExecutiveDailyActivityData,
): Promise<ExecutiveDailyActivityData> {
	const url = `${apiURL}/logs/${id}`;

	try {
		const response = await customFetch(url, {
			method: "PUT",
			body: activity,
		});

		if (!response.ok) {
			const json = await response.json();
			throw json;
		}

		const jsonResponse = await response.json();
		return transformExecutiveDailyActivityData(jsonResponse.data);
	} catch (error) {
		console.error(`Failed to update executive daily activity with ID ${id}:`, error);
		throw error;
	}
}

async function deleteExecutiveDailyActivity(id: string): Promise<void> {
	const url = `${apiURL}/executive/daily-activities/${id}`;

	try {
		const response = await customFetch(url, {
			method: "DELETE",
		});

		if (!response.ok) {
			const json = await response.json();
			throw json;
		}
	} catch (error) {
		console.error(`Failed to delete executive daily activity with ID ${id}:`, error);
		throw error;
	}
}

async function getExecutiveIdByDriverId(driverId: string | number): Promise<string | null> {
	try {
		const driver = await getDriver(String(driverId));
		if (!driver) {
			return null;
		}
		if (!driver.vehicleId) {
			return null;
		}
		const vehicle = await getVehicle(driver.vehicleId);
		if (!vehicle) {
			return null;
		}
		if (!vehicle.executiveId) {
			return null;
		}
		return vehicle.executiveId;
	} catch (error) {
		console.error(`Failed to fetch executive ID for driver:`, error);
		return null;
	}
}

async function approveExecutiveDailyActivity(id: string): Promise<ExecutiveDailyActivityData> {
	const url = `${apiURL}/logs/${id}/confirm`;

	try {
		const response = await customFetch(url, {
			method: "PUT",
		});

		if (!response.ok) {
			throw new Error(`Error approving daily activity: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		return transformExecutiveDailyActivityData(jsonResponse.data);
	} catch (error) {
		console.error(`Failed to approve executive daily activity with ID ${id}:`, error);
		throw error;
	}
}

async function rejectExecutiveDailyActivity(id: string): Promise<ExecutiveDailyActivityData> {
	const url = `${apiURL}/logs/${id}/reject`;

	try {
		const response = await customFetch(url, {
			method: "PUT",
		});

		if (!response.ok) {
			throw new Error(`Error rejecting daily activity: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		return transformExecutiveDailyActivityData(jsonResponse.data);
	} catch (error) {
		console.error(`Failed to reject executive daily activity with ID ${id}:`, error);
		throw error;
	}
}

export {
	type ExecutiveDailyActivityData,
	ExecutiveDailyActivitySchema,
	getExecutiveDailyActivities,
	getExecutiveDailyActivity,
	createExecutiveDailyActivity,
	updateExecutiveDailyActivity,
	deleteExecutiveDailyActivity,
	getExecutiveIdByDriverId,
	approveExecutiveDailyActivity,
	rejectExecutiveDailyActivity,
};

function transformDriverForActivity(driver: DriverData | undefined | null) {
	if (!driver) return undefined;

	return {
		...driver,
		roleId: "ROL-3",
	};
}

function transformExecutiveForActivity(executive: UserData | undefined | null) {
	if (!executive) return undefined;

	return {
		...executive,
		roleId: "ROL-2",
		// numberOfBookingRequestsAsRequester: executive.numberOfBookingRequestsAsRequester ?? 0,
	};
}

function transformVehicleForActivity(vehicle: VehicleData | undefined | null) {
	if (!vehicle) return undefined;

	return VehicleSchema.parse(vehicle);
}

function transformExecutiveDailyActivityData(item: ExecutiveDailyActivityData): ExecutiveDailyActivityData {
	const transformedItem = {
		...item,
		startTime: new Date(item.startTime),
		endTime: new Date(item.endTime),
		driver: transformDriverForActivity(item.driver),
		vehicle: transformVehicleForActivity(item.vehicle),
		executive: transformExecutiveForActivity(item.executive),
	};

	return ExecutiveDailyActivitySchema.parse(transformedItem);
}
