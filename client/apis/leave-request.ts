import z from "zod/v4";
import { buildQueryParams } from "@/lib/build-query-param";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";
import { getSchedule, ScheduleSchema } from "./schedule";
import { DriverSchema, getDriver } from "./driver";

export const LeaveRequestSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driver: DriverSchema.nullable().optional(),
  reason: z
    .string()
    .nullable()
    .optional()
    .transform((x) => x ?? undefined),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((x) => x ?? undefined),
  startTime: z.string().transform((d) => new Date(d)),
  endTime: z.string().transform((d) => new Date(d)),
  status: z.enum([
    "pending",
    "approved",
    "rejected",
    "cancelled",
    "completed",
  ]),
  scheduleId: z.string().nullable().optional(),
  schedule: ScheduleSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type LeaveRequestData = z.infer<typeof LeaveRequestSchema>;

export async function getLeaveRequests({
  ...p
}: UrlCommonParams): Promise<LeaveRequestData[]> {
  try {
    const query = buildQueryParams(p);
    const response = await customFetch(
      `${apiURL}/leave-requests?${query.toString()}`,
    );

    console.log(response);

    if (!response.ok) {
      throw new Error(`Failed to get vehicle service: ${response}`);
    }

    const data = await response.json();
    let leaveReqs = LeaveRequestSchema.array().parse(data.data);
    leaveReqs = await Promise.all(
      leaveReqs.map(async (lr) => {
        lr.driver = await getDriver(lr.driverId);
        console.log("API", lr.scheduleId);
        if (lr.scheduleId)
          lr.schedule = await getSchedule(lr.scheduleId);
        return lr;
      }),
    );
    return leaveReqs;
    // return mockVehicleService.find((d) => d.id === id)!
  } catch (e) {
    throw e;
  }
}

export async function getLeaveRequestById(
  id: string,
): Promise<LeaveRequestData> {
  // return leaveRequests.filter((d) => d.id === id)[0]
  try {
    const response = await customFetch(`${apiURL}/leave-requests/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get vehicle service: ${response}`);
    }

    const data = await response.json();
    return LeaveRequestSchema.parse(data.data);
  } catch (e) {
    throw e;
  }
}

export const CreateLeaveRequestSchema = z.object({
  driverId: z
    .string()
    .optional()
    .refine((s) => s !== undefined, "Driver ID can't be empty"),
  reason: z.string().optional(),
  notes: z.string().optional(),
  startTime: z
    .date({
      error: "",
    })
    .refine(
      (value) => new Date(value) > new Date(),
      "Start time must be in the future",
    ),
  endTime: z.date({
    error: "End time must be a valid ISO 8601 date string with timezone",
  }),
});

export type CreateLeaveRequestData = z.infer<typeof CreateLeaveRequestSchema>;

export async function createLeaveRequest(data: CreateLeaveRequestData) {
  try {
    const response = await customFetch(`${apiURL}/leave-requests`, {
      method: "POST",
      body: data,
    });

    console.log(response);

    if (!response.ok) {
      throw new Error("Failed to create user");
    }
  } catch (error: unknown) {
    console.error("Error creating leave requests:", error);
  }
}

export type UpdateLeaveRequestData = CreateLeaveRequestData;

export async function updateLeaveRequest(
  id: string,
  data: UpdateLeaveRequestData,
) {
  try {
    const response = await customFetch(`${apiURL}/leave-requests/${id}`, {
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

export async function deleteLeaveRequest(id: string) {
  try {
    const response = await customFetch(`${apiURL}/leave-requests/${id}`, {
      method: "DELETE",
    });

    console.log(response);

    if (!response.ok) {
      throw new Error("Failed to reject user");
    }
  } catch (error: unknown) {
    console.error("Error rejecting requests:", error);
  }
}

export async function rejectLeaveRequest(id: string, reason: string) {
  try {
    const response = await customFetch(
      `${apiURL}/leave-requests/${id}/reject`,
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

export async function approveLeaveRequest(id: string) {
  try {
    const response = await customFetch(
      `${apiURL}/leave-requests/${id}/approve`,
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
