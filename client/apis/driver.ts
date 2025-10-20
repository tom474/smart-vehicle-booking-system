import { z } from "zod/v4";
import { buildQueryParams } from "@/lib/build-query-param";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";

// Driver schema
const DriverSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email format").optional().nullable(),
  phoneNumber: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format")
    .optional()
    .nullable(),
  username: z.string().min(1, "Username is required"),
  profileImageUrl: z.string("Invalid URL format").optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "suspended"], {
    error: () => ({
      message: "Status must be 'active', 'inactive', or 'suspended'",
    }),
  }),
  availability: z.enum(
    ["available", "unavailable", "on_leave", "on_trip", "on_return"],
    {
      error: () => ({
        message:
          "Availability must be 'available', 'unavailable', 'on_leave', 'on_trip', or 'on_return'",
      }),
    },
  ),
  ownershipType: z.enum(["company", "vendor"]),
  roleId: z.string().min(1, "Role ID is required"),
  baseLocationId: z.string().optional().nullable(),
  currentLocationId: z.string().optional().nullable(),
});

type DriverData = z.infer<typeof DriverSchema>;

interface GetDriversProps extends UrlCommonParams {
  filter?: (driver: DriverData) => boolean;
}

async function getDrivers({
  filter,
  ...p
}: GetDriversProps): Promise<DriverData[]> {
  try {
    const query = buildQueryParams(p);

    const response = await customFetch(
      `${apiURL}/drivers?${query.toString()}`,
    );

    console.log(response);

    if (!response.ok) {
      throw new Error(`Failed to fetch drivers: ${response}`);
    }

    const json = await response.json();

    let parsedData = DriverSchema.array().parse(json.data);

    if (filter) {
      parsedData = parsedData.filter((driver) => filter(driver));
    }

    return parsedData;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getDriver(id: string): Promise<DriverData> {
  const url = `${apiURL}/drivers/${id}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch driver: ${response}`);
    }

    const json = await response.json();
    return DriverSchema.parse(json.data);
  } catch (error) {
    throw error;
  }
}

const CreateDriverSchema = z.object({
  name: z.string("Name is required").min(1, "Name is required"),
  email: z.email("Invalid email format").optional(),
  phoneNumber: z
    .string("Phone number cant be empty")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  username: z.string("Username is required").min(1, "Username is required"),
  password: z
    .string("Password cant be empty")
    .min(6, "Password must be at least 6 characters")
    .max(20, "Password must be at most 20 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).*$/,
      "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&).",
    ),
  profileImageUrl: z.url("Invalid URL format").optional().nullable(),
  avatar: z
    .any()
    .refine(
      (val) =>
        val instanceof File ||
        (val && typeof val === "object" && "url" in val && "id" in val),
      "Receipt must be a file or file metadata",
    )
    .optional(),
  // startTime: z
  //   .date("Invalid date format")
  //   .refine((date) => date > new Date(), {
  //     error: "Start time must be in the future",
  //   })
  //   .optional(),
  vehicleId: z.string().optional(),
  vendorId: z.string().optional(),
  baseLocationId: z.string("Base location cannot be empty"),
});

type CreateDriverData = z.infer<typeof CreateDriverSchema>;

async function createDriver(data: CreateDriverData) {
  const url = `${apiURL}/drivers`;

  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    formData.append("avatar", data.avatar);

    const response = await customFetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch drivers: ${response}`);
    }
    const json = await response.json();
    return DriverSchema.parse(json.data);
  } catch (error) {
    throw error;
  }
}

export const UpdateDriverSchema = CreateDriverSchema.partial();
export type UpdateDriverData = z.infer<typeof UpdateDriverSchema>;

export async function updateDriver(
  id: string,
  updateData?: UpdateDriverData,
  avatar?: File,
) {
  const url = `${apiURL}/drivers/${id}`;

  try {
    const formData = new FormData();
    if (updateData) {
      formData.append("data", JSON.stringify(updateData));
    } else {
      formData.append("data", JSON.stringify({}));
    }
    if (avatar) {
      formData.append("avatar", avatar);
    }

    const response = await customFetch(url, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      throw await response.json();
    }

    const json = await response.json();
    return DriverSchema.parse(json.data);
  } catch (error) {
    throw error;
  }
}

export async function deactivateDriver(id: string) {
  const url = `${apiURL}/drivers/${id}/deactivate`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(`Failed to deactivate drivers: ${response}`);
    }

    const json = await response.json();
    return DriverSchema.parse(json.data);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function suspendDriver(id: string) {
  const url = `${apiURL}/drivers/${id}/suspend`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(`Failed to suspend drivers: ${response}`);
    }

    const json = await response.json();
    return DriverSchema.parse(json.data);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function activateDriver(id: string) {
  const url = `${apiURL}/drivers/${id}/activate`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(`Failed to activate drivers: ${response}`);
    }

    const json = await response.json();
    return DriverSchema.parse(json.data);
  } catch (error) {
    throw error;
  }
}

export {
  DriverSchema,
  getDrivers,
  getDriver,
  CreateDriverSchema,
  createDriver,
};
export type { DriverData, CreateDriverData };
