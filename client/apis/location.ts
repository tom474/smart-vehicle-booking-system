import { z } from "zod/v4";
import type { BookingRequestData } from "@/apis/booking-request";
import { apiURL } from "@/lib/utils";
import { customFetch } from "@/lib/utils";
import { UrlCommonParams } from "@/types/api-params";
import { buildQueryParams } from "@/lib/build-query-param";

enum TripType {
  OneWay = "one_way",
  RoundTrip = "round_trip",
}

type LocationFieldType =
  | "departureLocation"
  | "arrivalLocation"
  | "returnDepartureLocation"
  | "returnArrivalLocation";

const LocationSchema = z.object(
  {
    id: z.string(),
    type: z.enum(["fixed", "custom"]),
    name: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
  },
  "Location can't be empty",
);

type LocationData = z.infer<typeof LocationSchema>;

const fieldMap: Record<LocationFieldType, keyof BookingRequestData> = {
  departureLocation: "departureLocation",
  arrivalLocation: "arrivalLocation",
  returnDepartureLocation: "returnDepartureLocation",
  returnArrivalLocation: "returnArrivalLocation",
};

function shortenAddress(address: string): string {
  // Remove plus codes (pattern: letters/numbers followed by +, then more letters/numbers)
  const plusCodeRegex = /^[A-Z0-9]+\+[A-Z0-9]+,?\s*/;
  return address.replace(plusCodeRegex, "").trim();
}

interface GetLocationsParams extends UrlCommonParams {
  type?: "custom" | "fixed";
}

export async function getLocations({
  ...params
}: GetLocationsParams): Promise<LocationData[]> {
  const query = buildQueryParams(params);

  const response = await customFetch(
    `${apiURL}/locations?${query.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch fixed locations: ${response}`);
  }

  const data = await response.json();
  return data.data.map((location: LocationData) =>
    LocationSchema.parse(location),
  );
}

async function getFixedLocations(): Promise<LocationData[]> {
  const response = await customFetch(`${apiURL}/locations?type=fixed`);

  if (!response.ok) {
    throw new Error(`Failed to fetch fixed locations: ${response}`);
  }

  const data = await response.json();
  return data.data.map((location: LocationData) =>
    LocationSchema.parse(location),
  );
}

export async function getLocationById(id: string): Promise<LocationData> {
  const response = await customFetch(`${apiURL}/locations/${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch fixed locations: ${response}`);
  }

  const data = await response.json();
  return LocationSchema.parse(data.data);
}

export async function deleteLocation(id: string): Promise<void> {
  const response = await fetch(`${apiURL}/locations/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch fixed locations: ${response}`);
  }
}

export const CreateLocationSchema = z.object({
  type: z.enum(["fixed", "custom"]),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export type CreateLocationData = z.infer<typeof CreateLocationSchema>;

export async function createLocation(data: CreateLocationData): Promise<void> {
  const response = await customFetch(`${apiURL}/locations`, {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    throw new Error(`Failed to create fixed locations: ${response}`);
  }
}

export const UpdateLocationSchema = z.object({
  name: z.string().optional(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export type UpdateLocationData = z.infer<typeof UpdateLocationSchema>;

export async function updateLocation(
  id: string,
  data: UpdateLocationData,
): Promise<void> {
  const response = await customFetch(`${apiURL}/locations/${id}`, {
    method: "PUT",
    body: data,
  });

  if (!response.ok) {
    throw new Error(`Failed to update fixed locations: ${response}`);
  }
}

export {
  LocationSchema,
  type LocationData,
  TripType,
  type LocationFieldType,
  fieldMap,
  shortenAddress,
  getFixedLocations,
};
