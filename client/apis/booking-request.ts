import { z } from "zod/v4";
import { LocationSchema } from "@/apis/location";
import { buildQueryParams } from "@/lib/build-query-param";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";
import { formatLocalDateTime } from "@/lib/date-time";

const BookingRequestSchema = z.object({
	id: z.string(),
	status: z.enum(["pending", "approved", "cancelled", "completed", "rejected"], {
		error: "Status is required.",
	}),
	requesterId: z.string(),
	contactName: z.string(),
	contactPhoneNumber: z.string(),
	type: z.enum(["one_way", "round_trip"], {
		error: "Trip type is required.",
	}),
	isReserved: z.boolean().default(false).optional(),
	priority: z.enum(["normal", "high", "urgent"], {
		error: "Priority is required.",
	}),
	numberOfPassengers: z.number().min(1, {
		message: "At least one passenger is required.",
	}),
	passengerIds: z.array(z.string()).optional().nullable(),
	tripPurpose: z.string().optional().nullable(),
	note: z.string().optional().nullable(),

	// Trip type specific fields
	departureLocation: LocationSchema,
	arrivalLocation: LocationSchema,
	departureTime: z.date({
		error: "Preferred departure time is required.",
	}),
	arrivalTime: z.date({
		error: "Arrival deadline is required.",
	}),

	// Round trip fields
	returnDepartureLocation: LocationSchema.optional().nullable(),
	returnArrivalLocation: LocationSchema.optional().nullable(),
	returnDepartureTime: z.date().optional().nullable(),
	returnArrivalTime: z.date().optional().nullable(),
});

type BookingRequestData = z.infer<typeof BookingRequestSchema>;

interface GetBookingRequestsParams extends UrlCommonParams {
	tripId?: string;
	requesterId?: number | string;
	status?: "pending" | "approved" | "cancelled" | "completed";
	type?: "one_way" | "round_trip";
	priority?: "normal" | "high" | "urgent";
	orderField?: string;
	orderDirection?: "ASC" | "DESC";
	page?: number;
	limit?: number;
}

async function getBookingRequests({ ...params }: GetBookingRequestsParams): Promise<BookingRequestData[]> {
	let url = `${apiURL}/booking-requests`;

	const queryParams = buildQueryParams(params);

	url += `?${queryParams.toString()}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch booking requests: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		const bookingRequests = jsonResponse.data.map(transformBookingRequestData);
		return bookingRequests;
	} catch (error) {
		throw error;
	}
}

export async function getCombinableRequestsForTrip(tripId: string): Promise<BookingRequestData[]> {
	const url = `${apiURL}/trips/${tripId}/combinable-requests`;

	try {
		const response = await customFetch(url, {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error(`Failed to get combineable request for trip ${tripId}: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		const bookingRequests = jsonResponse.data.map(transformBookingRequestData);
		return bookingRequests;
	} catch (error) {
		console.error(`Error getting combinable request for trip ${tripId}`, error);
		throw error;
	}
}

async function getBookingRequest(id: string | number): Promise<BookingRequestData> {
	const url = `${apiURL}/booking-requests/${id}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch booking request: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		return transformBookingRequestData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

async function createBookingRequest(data: BookingRequestData): Promise<BookingRequestData[]> {
	const url = `${apiURL}/booking-requests`;
	try {
		// Transform the data before sending to backend
		const transformedData = {
			...data,
			// departureLocationId: data.departureLocation.id,
			// arrivalLocationId: data.arrivalLocation.id,
			// returnDepartureLocationId: data.returnDepartureLocation?.id || undefined,
			// returnArrivalLocationId: data.returnArrivalLocation?.id || undefined,
			departureTime: formatLocalDateTime(data.departureTime),
			arrivalTime: formatLocalDateTime(data.arrivalTime),
			returnDepartureTime: data.returnDepartureTime ? formatLocalDateTime(data.returnDepartureTime) : undefined,
			returnArrivalTime: data.returnArrivalTime ? formatLocalDateTime(data.returnArrivalTime) : undefined,
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
		const bookingRequests = jsonResponse.data.map(transformBookingRequestData);
		return bookingRequests;
	} catch (error) {
		throw error;
	}
}

async function cancelBookingRequest(id: string | number, reason?: string) {
	const url = `${apiURL}/booking-requests/${id}/cancel`;

	try {
		const response = await customFetch(url, {
			method: "PUT",
			body: {
				reason: reason ? reason : "No reason provided",
			},
		});

		if (!response.ok) {
			const json = await response.json();
			throw json;
		}

		const jsonResponse = await response.json();
		return transformBookingRequestData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

export async function rejectBookingRequest(id: string | number, reason?: string) {
	const url = `${apiURL}/booking-requests/${id}/reject`;

	try {
		const response = await customFetch(url, {
			method: "PUT",
			body: {
				reason: reason ? reason : "No reason provided",
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to cancel booking request: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		return transformBookingRequestData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

export async function assignVehicleToBookingReq(bookingId: string, vehicleId: string) {
	const url = `${apiURL}/booking-requests/${bookingId}/assign-vehicle`;

	try {
		const response = await customFetch(url, {
			method: "PUT",
			body: {
				vehicleId,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to assign vehicle for booking request ${bookingId}: ${response.statusText}`);
		}
	} catch (error) {
		console.error(`Error assigning vehicle for booking request ${bookingId}`, error);
		throw error;
	}
}

export async function deleteBookingRequest(id: string | number) {
	const url = `${apiURL}/booking-requests/${id}`;

	try {
		const response = await customFetch(url, {
			method: "DELETE",
		});

		if (!response.ok) {
			console.log("YES: ", await response.json());
			throw new Error(await response.json());
		}

		const jsonResponse = await response.json();
		return transformBookingRequestData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

async function updateBookingRequest(
	id: string | number,
	data: Partial<BookingRequestData>,
): Promise<BookingRequestData> {
	const url = `${apiURL}/booking-requests/${id}`;

	try {
		// Transform the data before sending to backend
		const transformedData = {
			...data,
			// departureLocationId: data.departureLocation?.id || "",
			// arrivalLocationId: data.arrivalLocation?.id || "",
			// returnDepartureLocationId: data.returnDepartureLocation?.id || undefined,
			// returnArrivalLocationId: data.returnArrivalLocation?.id || undefined,
			departureTime: data.departureTime ? formatLocalDateTime(data.departureTime) : undefined,
			arrivalTime: data.arrivalTime ? formatLocalDateTime(data.arrivalTime) : undefined,
			returnDepartureTime: data.returnDepartureTime ? formatLocalDateTime(data.returnDepartureTime) : undefined,
			returnArrivalTime: data.returnArrivalTime ? formatLocalDateTime(data.returnArrivalTime) : undefined,
		};

		const response = await customFetch(url, {
			method: "PUT",
			body: transformedData,
		});

		if (!response.ok) {
			throw new Error(`Failed to update booking request: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		return transformBookingRequestData(jsonResponse.data);
	} catch (error) {
		throw error;
	}
}

async function approveBookingRequest(id: string | number) {
	const url = `${apiURL}/booking-requests/${id}`;

	try {
		const res = await customFetch(url, {
			method: "PUT",
			body: {
				status: "approved",
			},
		});

		if (!res.ok) {
			throw new Error(`Failed to cancel booking request: ${res.statusText}`);
		}
	} catch (error) {
		throw error;
	}
}

export {
	BookingRequestSchema,
	type BookingRequestData,
	getBookingRequests,
	getBookingRequest,
	createBookingRequest,
	cancelBookingRequest,
	updateBookingRequest,
	approveBookingRequest,
};

function transformBookingRequestData(item: BookingRequestData): BookingRequestData {
	const transformedItem = {
		...item,
		departureTime: new Date(item.departureTime),
		arrivalTime: new Date(item.arrivalTime),
		returnDepartureTime: item.returnDepartureTime ? new Date(item.returnDepartureTime) : undefined,
		returnArrivalTime: item.returnArrivalTime ? new Date(item.returnArrivalTime) : undefined,
	};

	return BookingRequestSchema.parse(transformedItem);
}
