import { z } from "zod/v4";
import { buildQueryParams } from "@/lib/build-query-param";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";

export const ScheduleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  // status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  tripId: z.string().optional().nullable(),
  vehicleService: z.string().optional().nullable(),
  leaveRequest: z.string().optional().nullable(),
  startTime: z.date(),
  endTime: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScheduleData = z.infer<typeof ScheduleSchema>;

export async function getSchedules({ ...p }: UrlCommonParams) {
  const query = buildQueryParams(p);
  const url = `${apiURL}/schedules?${query.toString()}`;

  try {
    const response = await customFetch(url);
    const jsonResponse = await response.json();

    if (!response.ok) {
      throw new Error(jsonResponse);
    }

    return jsonResponse.data.map((item: ScheduleData) =>
      transformScheduleData(item),
    );
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
}

export async function getSchedule(id: string | number) {
  const url = `${apiURL}/schedules/${id}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch schedule: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    return transformScheduleData(jsonResponse.data);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
}

export const CreateScheduleSchema = z.object({
  title: z.string(),
  description: z.string().optional().nullable(),

  startTime: z.date(),
  endTime: z.date(),

  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
});

export type CreateScheduleData = z.infer<typeof CreateScheduleSchema>;

export async function createSchedule(data: CreateScheduleData) {
  const url = `${apiURL}/schedules`;

  try {
    const response = await customFetch(url, {
      method: "POST",
      body: data,
    });

    if (!response.ok) {
      throw new Error(await response.json());
    }
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
}

export const UpdateScheduleSchema = CreateScheduleSchema.omit({
  driverId: true,
  vehicleId: true,
});
export type UpdateScheduleData = z.infer<typeof UpdateScheduleSchema>;

export async function updateSchedule(id: string, data: CreateScheduleData) {
  const url = `${apiURL}/schedules/${id}`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
      body: data,
    });

    if (!response.ok) {
      throw new Error(await response.json());
    }
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
}

export async function deleteSchedule(id: string | number) {
  const url = `${apiURL}/schedules/${id}`;

  try {
    const response = await customFetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await response.json());
    }

    const jsonResponse = await response.json();
    return transformScheduleData(jsonResponse.data);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
}

export async function checkConflictSchedule(
  excludeScheduleId: string | null | undefined,
  driverId: string,
  startTime: Date,
  endTime: Date,
) {
  const url = `${apiURL}/schedules/check-conflicts`;

  try {
    const body = {
      id: excludeScheduleId ? excludeScheduleId : null,
      driverId: driverId,
      startTime: startTime,
      endTime: endTime,
    };
    const response = await customFetch(url, {
      method: "POST",
      body: body,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to check conflict schedule: ${response.statusText}`,
      );
    }

    const jsonResponse = await response.json();
    return jsonResponse.data;
  } catch (error) {
    console.error("Error checking conflict schedule:", error);
    throw error;
  }
}

function transformScheduleData(data: ScheduleData): ScheduleData {
  const transformData = {
    ...data,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
  return transformData;
}
