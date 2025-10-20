import { z } from "zod/v4";
import { type DriverData, DriverSchema } from "@/apis/driver";
import { LocationSchema } from "@/apis/location";
import { UserSchema } from "@/apis/user";
import { OutsourceVehicleSchema, type VehicleData, VehicleSchema } from "@/apis/vehicle";
import { apiURL, customFetch } from "@/lib/utils";

const TripTicketSchema = z.object({
	id: z.string(),
	userId: z.string(),
	user: UserSchema.optional(),
	bookingRequestId: z.string(),
	tripId: z.string(),
	contactName: z.string().optional(),
	contactPhoneNumber: z.string().optional(),
	status: z.enum(["scheduling", "scheduled", "on_going", "completed", "cancelled"], {
		error: "Status is required.",
	}),
	departureTime: z.date({
		error: "Preferred departure time is required.",
	}),
	arrivalTime: z.date({
		error: "Arrival deadline is required.",
	}),
	actualArrivalTime: z.date().optional().nullable(),
	departureLocation: LocationSchema,
	arrivalLocation: LocationSchema,
	driver: DriverSchema.optional().nullable(),
	vehicle: VehicleSchema.optional().nullable(),
	outsourcedVehicle: OutsourceVehicleSchema.optional().nullable(),
	isPickedUp: z.boolean().optional().nullable(),
	isDroppedOff: z.boolean().optional().nullable(),
	ticketStatus: z.enum(["pending", "picked_up", "dropping_off", "dropped_off", "no_show", "cancelled"]).optional(),
});

interface GetTripTicketsParams {
	tripId?: string | number;
	bookingRequestId?: string | number;
	userId?: string | number;
	status?: z.infer<typeof TripTicketSchema.shape.status>;
	searchField?: string;
	searchValue?: string;
	orderField?: string;
	orderDirection?: "ASC" | "DESC";
	page?: number;
	limit?: number;
}

async function getTripTickets({
	tripId,
	bookingRequestId,
	userId,
	status,
	searchField,
	searchValue,
	orderField = "departureTime",
	orderDirection = "ASC",
	page,
	limit,
}: GetTripTicketsParams): Promise<z.infer<typeof TripTicketSchema>[]> {
	let url = `${apiURL}/trip-tickets`;

	const queryParams = new URLSearchParams();
	if (tripId) queryParams.append("tripId", tripId.toString());
	if (bookingRequestId) queryParams.append("bookingRequestId", bookingRequestId.toString());
	if (userId) queryParams.append("userId", userId.toString());
	if (status) queryParams.append("userId", status);
	if (searchField) queryParams.append("searchField", searchField);
	if (searchValue) queryParams.append("searchValue", searchValue);
	if (orderField) queryParams.append("orderField", orderField);
	if (orderDirection) queryParams.append("orderDirection", orderDirection);
	if (page !== undefined) queryParams.append("page", page.toString());
	if (limit !== undefined) queryParams.append("limit", limit.toString());

	url += `?${queryParams.toString()}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch trip tickets: ${response.statusText}`);
		}

		// Check if response body is empty
		const text = await response.text();
		if (!text || text.trim() === "") {
			return []; // Return empty array for empty response
		}

		const jsonResponse = await JSON.parse(text);
		const tripTickets = jsonResponse.data.map(transformTripTicketData);
		return tripTickets;
	} catch (error) {
		console.error("Error fetching trips:", error);
		throw error;
	}
}

async function getTripTicket(tripId: string | number): Promise<z.infer<typeof TripTicketSchema>> {
	const url = `${apiURL}/trip-tickets/${tripId}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch trip ticket: ${response.statusText}`);
		}

		const jsonResponse = await response.json();
		return transformTripTicketData(jsonResponse.data);
	} catch (error) {
		console.error("Error fetching trip ticket:", error);
		throw error;
	}
}

type TripTicketData = z.infer<typeof TripTicketSchema>;

export { TripTicketSchema, getTripTickets, getTripTicket };
export type { TripTicketData };

function transformDriverForTicket(
	driver: DriverData | undefined | null,
	vehicle: VehicleData | undefined | null,
): DriverData | undefined {
	if (!driver) return undefined;

	return {
		...driver,
		vehicleId: driver.vehicleId || vehicle?.id || "none",
		vendorId: driver.vendorId || null,
		roleId: driver.roleId || "ROL-3",
		baseLocationId: driver.baseLocationId || vehicle?.baseLocationId || "none",
		currentLocationId: driver.currentLocationId || vehicle?.baseLocationId || "none",
	};
}

function transformVehicleForTicket(vehicle: VehicleData | undefined | null) {
	if (!vehicle) return undefined;

	return {
		...vehicle,
		driver: vehicle.driverId || undefined,
		vendor: vehicle.vendorId || undefined,
		executive: vehicle.executiveId || undefined,
		baseLocation: vehicle.baseLocationId || undefined,
		currentLocation: vehicle.currentLocationId || undefined,
		// numberOfTrips: vehicle.numberOfTrips || 0,
	};
}

function transformTripTicketData(item: TripTicketData): TripTicketData {
	const transformedItem = {
		...item,
		userId: item.user?.id,
		user: undefined,
		departureTime: new Date(item.departureTime),
		arrivalTime: new Date(item.arrivalTime),
		actualArrivalTime: item.actualArrivalTime ? new Date(item.actualArrivalTime) : undefined,
		driver: transformDriverForTicket(item.driver, item.vehicle),
		vehicle: transformVehicleForTicket(item.vehicle),
		outsourcedVehicle: item.outsourcedVehicle || undefined,
	};

	return TripTicketSchema.parse(transformedItem);
}
