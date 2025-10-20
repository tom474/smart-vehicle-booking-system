import { apiURL } from "@/lib/utils";
import { z } from "zod/v4";
import { customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";
import { vietnamesePhoneRegex } from "@/lib/utils";
import { buildQueryParams } from "@/lib/build-query-param";

export const ColorEnumSchema = z.enum([
  "white",
  "black",
  "grey",
  "silver",
  "blue",
  "red",
  "green",
  "yellow",
  "gold",
  "brown",
  "beige",
  "orange",
  "purple",
  "pink",
]);

const VehicleSchema = z.object({
  id: z.string(),
  licensePlate: z.string(),
  model: z.string(),
  color: ColorEnumSchema,
  capacity: z.number(),
  availability: z.enum([
    "available",
    "unavailable",
    "in_use",
    "under_maintenance",
    "under_repair",
    "out_of_service",
  ]),
  ownershipType: z.enum(["company", "vendor"]),
  driverId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  executiveId: z.string().optional().nullable(),
  baseLocationId: z.string().optional().nullable(),
  currentLocationId: z.string().optional().nullable(),
  // numberOfTrips: z.number().optional().nullable(),
});

type VehicleData = z.infer<typeof VehicleSchema>;

const OutsourceVehicleSchema = z.object({
  id: z.string().optional(),
  driverName: z
    .string()
    .trim()
    .min(2, "Driver name must be between 2 and 100 characters.")
    .max(100, "Driver name must be between 2 and 100 characters.")
    .min(1, "Driver name is required."),
  phoneNumber: z
    .string()
    .trim()
    .regex(
      vietnamesePhoneRegex,
      "Phone number must be a valid Vietnamese phone number.",
    ),
  licensePlate: z
    .string()
    .trim()
    .min(4, "License plate must be between 4 and 20 characters.")
    .max(20, "License plate must be between 4 and 20 characters.")
    .min(1, "Vehicle license plate is required."),
  model: z
    .string()
    .trim()
    .min(2, "Vehicle model must be between 2 and 100 characters.")
    .max(100, "Vehicle model must be between 2 and 100 characters.")
    .min(1, "Vehicle model is required."),
  color: z.string(),
  capacity: z
    .number()
    .min(1, "Vehicle must be able to carry at least 1 passenger.")
    .int("Capacity must be a whole number."),
  vendorId: z.string().optional().nullable(),
});

type OutsourceVehicleData = z.infer<typeof OutsourceVehicleSchema>;

interface GetVehiclesParams extends UrlCommonParams {
  capacity?: number;
  availability?: string;
  ownershipType?: string;
  vendorId?: number;
  baseLocationId?: number;
  currentLocationId?: number;
}

async function getVehicles({
  ...params
}: GetVehiclesParams): Promise<VehicleData[]> {
  let url = `${apiURL}/vehicles`;

  const queryParams = buildQueryParams(params);

  // if (page) queryParams.append("page", page.toString());
  // if (limit) queryParams.append("limit", limit.toString());
  // if (orderField) queryParams.append("orderField", orderField);
  // if (orderDirection) queryParams.append("orderDirection", orderDirection);
  // if (capacity) queryParams.append("capacity", capacity.toString());
  // if (availability) queryParams.append("availability", availability);
  // if (ownershipType) queryParams.append("ownershipType", ownershipType);
  // if (vendorId) queryParams.append("vendorId", vendorId.toString());
  // if (baseLocationId)
  //   queryParams.append("baseLocationId", baseLocationId.toString());
  // if (currentLocationId)
  //   queryParams.append("currentLocationId", currentLocationId.toString());
  // if (searchField) queryParams.append("searchField", searchField.toString());
  // if (searchValue) queryParams.append("searchValue", searchValue.toString());

  url += `?${queryParams.toString()}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    const vehicles = jsonResponse.data.map((vehicle: VehicleData) =>
      VehicleSchema.parse(vehicle),
    );
    return vehicles;
  } catch (error) {
    throw error;
  }
}

export async function getAvailableVehiclesForTrip({
  tripId,
}: {
  tripId: string;
}): Promise<VehicleData[]> {
  const url = `${apiURL}/trips/${tripId}/available-vehicles`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    const vehicles = jsonResponse.data.map((vehicle: VehicleData) =>
      VehicleSchema.parse(vehicle),
    );
    return vehicles;
  } catch (error) {
    throw error;
  }
}

async function getVehicle(id: string): Promise<VehicleData> {
  const url = `${apiURL}/vehicles/${id}`;
  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching user: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    return VehicleSchema.parse(jsonResponse.data);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

async function getAvailableVehicleForBookingRequestId(
  bookingRequestId: string | number,
): Promise<VehicleData[]> {
  const url = `${apiURL}/booking-requests/${bookingRequestId}/available-vehicles`;
  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching vehicles: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    return jsonResponse.data.map((vehicle: VehicleData) =>
      VehicleSchema.parse(vehicle),
    );
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);
    throw error;
  }
}

const CreateVehicleSchema = z.object({
  licensePlate: z.string("License plate is required"),
  model: z.string("Model is required"),
  color: z.string("Color is required"),
  capacity: z.number("Capacity must be at least 1"),
  driverId: z.string("Driver ID is required"),
  vendorId: z.string().optional(),
  executiveId: z.string().optional(),
  baseLocationId: z.string({ error: "Base location ID is required" }),
});

type CreateVehicleFormData = z.infer<typeof CreateVehicleSchema>;

async function createVehicle(data: CreateVehicleFormData) {
  try {
    const response = await customFetch(`${apiURL}/vehicles`, {
      method: "POST",
      body: data,
    });

    console.log(response);

    if (!response.ok) {
      throw new Error("Failed to update vehicle");
    }

    if (response.status < 200 && response.status >= 300) {
      throw new Error("Failed to update vehicle");
    }
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    throw error;
  }
}

const UpdateVehicleSchema = CreateVehicleSchema.partial();

type UpdateVehicleFormData = z.infer<typeof UpdateVehicleSchema>;

async function updateVehicle(id: string, data: UpdateVehicleFormData) {
  try {
    // Validate required fields
    if (!id) {
      throw new Error("Vehicle ID is required");
    }

    const response = await customFetch(`${apiURL}/vehicles/${id}`, {
      method: "PUT",
      body: data,
    });

    console.log(JSON.stringify(data));
    console.log(response);

    if (!response.ok) {
      throw new Error("Failed to update vehicle");
    }
  } catch (error: unknown) {
    console.error("Error updating driver:", error);
    throw error;
  }
}

async function deleteVehicle(id: string) {
  try {
    // Validate required fields
    if (!id) {
      throw new Error("User ID is required");
    }

    const response = await customFetch(`${apiURL}/vehicles/${id}`, {
      method: "DELETE",
    });

    console.log(response);

    if (!response.ok) {
      throw new Error("Failed to update user");
    }
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    // return {
    // 	success: false,
    // 	message: error.message || "Failed to update user",
    // }
  }
}

async function assignVehicle({
  bookingRequestId,
  vehicleId,
}: {
  bookingRequestId: string | number;
  vehicleId: number | string;
}): Promise<void> {
  const url = `${apiURL}/booking-requests/${bookingRequestId}/assign-vehicle`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
      body: { vehicleId: vehicleId },
    });

    if (!response.ok) {
      const json = await response.json();
      throw json;
    }
    const jsonResponse = await response.json();
    console.log("Vehicle assigned successfully:", jsonResponse);
  } catch (error) {
    throw error;
  }
}

async function assignOutsourceVehicle({
  bookingRequestId,
  outSourceVehicle,
}: {
  bookingRequestId: string | number;
  outSourceVehicle: OutsourceVehicleData;
}): Promise<void> {
  const url = `${apiURL}/booking-requests/${bookingRequestId}/assign-outsourced-vehicle`;

  try {
    const transformOutsourceVehicleData = {
      ...outSourceVehicle,
      // color: outSourceVehicle.color !== "empty" ? outSourceVehicle.color : null,
      vendorId:
        outSourceVehicle.vendorId !== "empty"
          ? outSourceVehicle.vendorId
          : null,
    };
    const response = await customFetch(url, {
      method: "PUT",
      body: transformOutsourceVehicleData,
    });

    if (!response.ok) {
      const json = await response.json();
      throw json;
    }
    const jsonResponse = await response.json();
    console.log("Outsource vehicle assigned successfully:", jsonResponse);
  } catch (error) {
    throw error;
  }
}

async function generateOutsourcePublicUrl(
  tripId: string | number,
): Promise<string> {
  const url = `${apiURL}/trips/${tripId}/generate-public-access`;

  try {
    const response = await customFetch(url, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to generate access URL: ${response.statusText}`,
      );
    }

    const jsonResponse = await response.json();
    return jsonResponse.data.url;
  } catch (error) {
    throw error;
  }
}

async function getOutsourcePublicUrl(tripId: string | number): Promise<string> {
  const url = `${apiURL}/trips/${tripId}/public-access`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to generate access URL: ${response.statusText}`,
      );
    }

    const jsonResponse = await response.json();
    return jsonResponse.data.url;
  } catch (error) {
    throw error;
  }
}

async function issueOutsourceToken(code: string): Promise<string> {
  const url = `${apiURL}/auth/anonymous-token`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: code }),
    });

    try {
      const responseClone = response.clone();
      const responseData = await responseClone.json();
      if (
        response.status === 403 &&
        responseData.message ===
        "This link is not yet valid. It will be valid 2 days before the trip's departure date."
      ) {
        return "early";
      } else if (
        response.status === 410 &&
        responseData.message === "This link is no longer valid."
      ) {
        return "expired";
      }
    } catch { }

    if (!response.ok) {
      throw new Error(`Failed to issue token: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    return jsonResponse.data.accessToken;
  } catch (error) {
    throw error;
  }
}

export {
  VehicleSchema,
  type VehicleData,
  OutsourceVehicleSchema,
  type OutsourceVehicleData,
  type CreateVehicleFormData,
  CreateVehicleSchema,
  UpdateVehicleSchema,
  type UpdateVehicleFormData,
  updateVehicle,
  createVehicle,
  getVehicles,
  getVehicle,
  assignVehicle,
  assignOutsourceVehicle,
  deleteVehicle,
  generateOutsourcePublicUrl,
  getOutsourcePublicUrl,
  issueOutsourceToken,
  getAvailableVehicleForBookingRequestId,
};
