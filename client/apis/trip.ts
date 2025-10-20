import { z } from "zod/v4";
import type { DriverData } from "@/apis/driver";
import { DriverSchema } from "@/apis/driver";
import { type LocationData, LocationSchema } from "@/apis/location";
import { type StopData, StopSchema, TripStopSchema } from "@/apis/stop";
import type { TripTicketData } from "@/apis/trip-ticket";
import type { UserData } from "@/apis/user";
import type { VehicleData } from "@/apis/vehicle";
import { OutsourceVehicleSchema, VehicleSchema } from "@/apis/vehicle";
import { buildQueryParams } from "@/lib/build-query-param";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";

const TripSchema = z.object({
  id: z.string(),
  status: z.enum(
    ["scheduling", "scheduled", "on_going", "completed", "cancelled"],
    {
      error: "Status is required.",
    },
  ),
  totalCost: z.string(),
  departureTime: z.date({
    error: "Preferred departure time is required.",
  }),
  arrivalTime: z.date({
    error: "Arrival deadline is required.",
  }),
  actualDepartureTime: z.date().optional(),
  actualArrivalTime: z.date().optional(),
  stops: z.array(StopSchema).optional(),
  driver: DriverSchema.optional(),
  vehicle: VehicleSchema.optional(),
  outsourcedVehicle: OutsourceVehicleSchema.optional(),
  numberOfPassengers: z.number().min(0, {
    message: "At least one passenger is required.",
  }),
});

type TripData = z.infer<typeof TripSchema>;

interface GetTripsParams extends UrlCommonParams {
  status?:
  | "scheduling"
  | "scheduled"
  | "on_going"
  | "completed"
  | "cancelled";
  bookingRequestId?: string | number;
  driverId?: string | number;
  vehicleId?: string | number;
  outSourceVehicleId?: string | number;
  userId?: string | number;
  filterData?: (trip: TripData) => boolean;
  // searchField?: string;
  // searchValue?: string;
  // orderField?: string;
  // orderDirection?: "ASC" | "DESC";
  // page?: number;
  // limit?: number;
}

async function getTrips({
  filterData,
  ...params
}: GetTripsParams): Promise<TripData[]> {
  const queryParams = buildQueryParams(params);
  const url = `${apiURL}/trips?${queryParams.toString()}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch trips: ${response.statusText}`);
    }

    // Check if response body is empty
    const text = await response.text();
    if (!text || text.trim() === "") {
      return []; // Return empty array for empty response
    }

    const jsonResponse = await JSON.parse(text);
    let tripTickets: TripData[] = jsonResponse.data.map(transformTripData);

    if (filterData) {
      tripTickets = tripTickets.filter((t) => filterData(t));
    }

    return tripTickets;
  } catch (error) {
    console.error("Error fetching trips:", error);
    throw error;
  }
}

// export async function getSchedulingTrips({
//   bookingRequestId,
//   driverId,
//   vehicleId,
//   outSourceVehicleId,
//   userId,
//   searchField,
//   searchValue,
//   orderField = "departureTime",
//   orderDirection = "ASC",
//   page,
//   limit,
// }: Omit<GetTripsParams, "filter">): Promise<TripData[]> {
//   let url = `${apiURL}/trips`;
//
//   const queryParams = new URLSearchParams();
//   url += `?${queryParams.toString()}`;
//
//   try {
//     const response = await customFetch(url);
//
//     if (!response.ok) {
//       throw new Error(`Failed to fetch trips: ${response.statusText}`);
//     }
//
//     // Check if response body is empty
//     const text = await response.text();
//     if (!text || text.trim() === "") {
//       return []; // Return empty array for empty response
//     }
//
//     const jsonResponse = await JSON.parse(text);
//     const tripTickets = jsonResponse.data.map(transformTripData);
//     return tripTickets;
//   } catch (error) {
//     console.error("Error fetching trips:", error);
//     throw error;
//   }
// }

async function getTrip(id: string, isPublic?: boolean): Promise<TripData> {
  let url = `${apiURL}/trips/${id}`;
  if (isPublic) {
    url += "/public";
  }

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch trips: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    return transformTripData(jsonResponse.data);
  } catch (error) {
    console.error("Error fetching trips:", error);
    throw error;
  }
}

async function confirmStartTrip(tripId: string): Promise<boolean> {
  const url = `${apiURL}/trips/${tripId}/start`;
  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(`Failed to end trip: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error ending trip:", error);
    throw error;
  }
}

async function confirmEndTrip(tripId: string): Promise<boolean> {
  const url = `${apiURL}/trips/${tripId}/end`;
  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(`Failed to end trip: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error ending trip:", error);
    throw error;
  }
}

async function confirmPickup(
  tripId: string,
  bookingRequestId: string,
  stopId: string,
): Promise<boolean> {
  const url = `${apiURL}/trips/${tripId}/booking-request/${bookingRequestId}/pickup`;
  const updateActualArrivalTimeUrl = `${apiURL}/trip-stops/${stopId}/arrive`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
    });
    if (!response.ok) {
      throw new Error(`Failed to confirm pickup: ${response.statusText}`);
    }

    // Update the actual arrival time for the stop
    const updateResponse = await customFetch(updateActualArrivalTimeUrl, {
      method: "PUT",
      body: { actualArrivalTime: new Date() },
    });
    if (!updateResponse.ok) {
      throw new Error(
        `Failed to update actual arrival time: ${updateResponse.statusText}`,
      );
    }

    return true;
  } catch (error) {
    console.error("Error confirming pickup:", error);
    throw error;
  }
}

async function confirmAbsence(
  tripId: string,
  bookingRequestId: string,
  reason: string,
  stopId?: string,
): Promise<boolean> {
  const url = `${apiURL}/trips/${tripId}/booking-request/${bookingRequestId}/absence`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
      body: { reason: reason },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to confirm absence: ${response.statusText}`,
      );
    }

    // Update the actual arrival time for the stop
    if (stopId) {
      await confirmArriveStop(stopId);
    }

    return true;
  } catch (error) {
    console.error("Error confirming absence:", error);
    throw error;
  }
}

async function confirmDropOff(
  tripId: string,
  bookingRequestId: string,
  stopId: string,
): Promise<boolean> {
  const url = `${apiURL}/trips/${tripId}/booking-request/${bookingRequestId}/confirm-dropped_off`;

  try {
    const response = await customFetch(url, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(
        `Failed to confirm drop-off: ${response.statusText}`,
      );
    }

    // Update the actual arrival time for the stop
    await confirmArriveStop(stopId);

    return true;
  } catch (error) {
    console.error("Error confirming drop-off:", error);
    throw error;
  }
}

async function confirmArriveStop(stopId: string): Promise<boolean> {
  const url = `${apiURL}/trip-stops/${stopId}/arrive`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to confirm arrival at stop: ${response.statusText}`,
      );
    }

    return true;
  } catch (error) {
    console.error("Error confirming arrival at stop:", error);
    throw error;
  }
}

async function outsourceStartTrip(tripId: string): Promise<boolean> {
  const url = `${apiURL}/trips/${tripId}/start/public`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to start outsourced trip: ${response.statusText}`,
      );
    }

    return true;
  } catch (error) {
    console.error("Error starting outsourced trip:", error);
    throw error;
  }
}

async function outsourceEndTrip(tripId: string): Promise<boolean> {
  const url = `${apiURL}/trips/${tripId}/end/public`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to end outsourced trip: ${response.statusText}`,
      );
    }

    return true;
  } catch (error) {
    console.error("Error ending outsourced trip:", error);
    throw error;
  }
}

async function updateDriverLocation(
  tripId: string,
  location: LocationData,
): Promise<boolean> {
  const url = `${apiURL}/trips/${tripId}/driver-location`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
      body: location,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to update driver location: ${response.statusText}`,
      );
    }

    return true;
  } catch (error) {
    console.warn("Error updating driver location:", error);
    return false;
  }
}

async function getDriverLocation(
  tripId: string,
): Promise<LocationData | undefined> {
  const url = `${apiURL}/trips/${tripId}/driver-location`;

  try {
    const response = await customFetch(url);

    if (response.status === 400) {
      console.warn("Driver has not started the trip:", tripId);
      return undefined; // Return undefined if no location is found
    }

    if (!response.ok) {
      throw new Error(
        `Failed to update driver location: ${response.statusText}`,
      );
    }

    const jsonResponse = await response.json();
    const transformedItem = {
      ...jsonResponse.data.location,
      type: "custom",
    };
    return LocationSchema.parse(transformedItem);
  } catch (error) {
    console.error("Error getting driver location:", error);
    throw error;
  }
}

export const CreateCombinedTripSchema = z.object({
  departureTime: z
    .date("Departure time can't be empty.")
    .refine((val) => new Date(val) > new Date(), {
      message: "Departure time must be in the future.",
    }),

  vehicleId: z
    .string("Vehicle ID is required.")
    .min(1, "Vehicle ID must be a string."),

  bookingRequestIds: z
    .set(
      z.string().min(1, "Each booking request ID must be a string."),
      "Booking Requests cannot be empty.",
    )
    .nonempty("Booking Request IDs array cannot be empty."),

  tripStopOrders: TripStopSchema.array().nonempty(
    "Trip stop orders array cannot be empty.",
  ),
});

export type CreateCombinedTripData = z.infer<typeof CreateCombinedTripSchema>;

export async function createCombineTrip(data: CreateCombinedTripData) {
  const url = `${apiURL}/trips/combine`;

  try {
    const response = await customFetch(url, {
      method: "POST",
      body: {
        ...data,
        bookingRequestIds: Array.from(data.bookingRequestIds.values()),
        tripStopOrders: data.tripStopOrders.map((d, idx) => {
          return {
            type: d.type,
            order: idx + 1,
            location: d.locationId || {
              type: "custom",
              name: d.location!.name,
              address: d.location!.address,
              latitude: d.location!.latitude,
              longitude: d.location!.longitude,
            },
          };
        }),
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to update driver location: ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("Error getting driver location:", error);
    throw error;
  }
}

export async function assignVehicleToTrip(tripId: string, vehicleId: string) {
  const url = `${apiURL}/trips/${tripId}/assign-vehicle`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
      body: {
        vehicleId,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to assign vehicle for trip ${tripId}: ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error(`Error assigning vehicle for trip ${tripId}`, error);
    throw error;
  }
}

export async function addRequestToTrip(
  tripId: string,
  bookingRequestId: string,
) {
  const url = `${apiURL}/trips/${tripId}/add-request`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
      body: {
        bookingRequestId,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to add request for trip ${tripId}: ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error(`Error adding request for trip ${tripId}`, error);
    throw error;
  }
}

export async function removeRequestfromTrip(
  tripId: string,
  bookingRequestId: string,
) {
  const url = `${apiURL}/trips/${tripId}/remove-request`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
      body: {
        bookingRequestId,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to remove request for trip ${tripId}: ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error(`Error removing request for trip ${tripId}`, error);
    throw error;
  }
}

export async function uncombineTrip(tripId: string) {
  const url = `${apiURL}/trips/${tripId}/uncombine`;

  try {
    const response = await customFetch(url, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to uncombine trip ${tripId}: ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error(`Error uncombing trip ${tripId}`, error);
    throw error;
  }
}

export async function approveTrip(tripId: string) {
  const url = `${apiURL}/trips/${tripId}/approve`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to approve trip ${tripId}: ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error(`Error approve trip ${tripId}`, error);
    throw error;
  }
}

export {
  TripSchema,
  getTrips,
  getTrip,
  confirmStartTrip,
  confirmEndTrip,
  confirmPickup,
  confirmAbsence,
  confirmDropOff,
  confirmArriveStop,
  outsourceStartTrip,
  outsourceEndTrip,
  updateDriverLocation,
  getDriverLocation,
};
export type { TripData };

function transformUser(user: UserData) {
  if (!user) return undefined;

  return {
    ...user,
    roleId: user.roleId || "ROL-1",
    phoneNumber: user.phoneNumber || undefined,
    profileImageUrl: user.profileImageUrl || undefined,
    // numberOfBookingRequestsAsRequester:
    // 	user.numberOfBookingRequestsAsRequester || 0,
    dedicatedVehicle: user.dedicatedVehicle || undefined,
  };
}

function transformTicket(ticket: TripTicketData) {
  return {
    ...ticket,
    departureTime: new Date(ticket.departureTime),
    arrivalTime: new Date(ticket.arrivalTime),
    actualArrivalTime: ticket.actualArrivalTime
      ? new Date(ticket.actualArrivalTime)
      : undefined,
    user: ticket.user ? transformUser(ticket.user) : undefined,
    userId: ticket.user?.id,
  };
}

function transformStop(stop: StopData) {
  return {
    ...stop,
    arrivalTime: new Date(stop.arrivalTime),
    actualArrivalTime: stop.actualArrivalTime
      ? new Date(stop.actualArrivalTime)
      : undefined,
    tickets: stop.tickets?.map(transformTicket) || undefined,
  };
}

function transformDriver(
  driver: DriverData | undefined,
  vehicle: VehicleData | undefined,
) {
  if (!driver) return undefined;

  return {
    ...driver,
    vehicleId: driver.vehicleId || vehicle?.id || "none",
    vendorId: driver.vendorId || null,
    roleId: driver.roleId || "ROL-3",
    baseLocationId:
      driver.baseLocationId || vehicle?.baseLocationId || "none",
    currentLocationId:
      driver.currentLocationId || vehicle?.currentLocationId || "none",
  };
}

function transformVehicle(vehicle: VehicleData | undefined) {
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

function transformTripData(item: TripData): TripData {
  const transformedItem = {
    ...item,
    departureTime: new Date(item.departureTime),
    arrivalTime: new Date(item.arrivalTime),
    actualDepartureTime: item.actualDepartureTime
      ? new Date(item.actualDepartureTime)
      : undefined,
    actualArrivalTime: item.actualArrivalTime
      ? new Date(item.actualArrivalTime)
      : undefined,
    stops: item.stops?.map(transformStop) || [],
    driver: transformDriver(item.driver, item.vehicle),
    vehicle: transformVehicle(item.vehicle),
    outsourcedVehicle: item.outsourcedVehicle || undefined,
    numberOfPassengers: item.numberOfPassengers || 1,
  };

  return TripSchema.parse(transformedItem);
}
