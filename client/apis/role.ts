import z from "zod/v4";
import { buildQueryParams } from "@/lib/build-query-param";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";

const RoleSchema = z.object({
  id: z.string().regex(/^ROL-\d+$/, {
    error: "ID must be in format ROL-{number}",
  }),
  title: z.string({ error: "Title is required" }),
  key: z.string({ error: "Key is required" }),
  description: z.string().describe("Role description"),
  numberOfPermissions: z.number().int().nonnegative({
    error: "Number of permissions must be a non-negative integer",
  }),
  numberOfUsers: z.number().int().nonnegative({
    error: "Number of users must be a non-negative integer",
  }),
});

type RoleData = z.infer<typeof RoleSchema>;

type GetRolesParams = UrlCommonParams;

async function getRoles({ ...params }: GetRolesParams): Promise<RoleData[]> {
  let url = `${apiURL}/roles`;

  const queryParams = buildQueryParams(params);
  url += `?${queryParams.toString()}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.statusText}`);
    }

    // Check if response body is empty
    const text = await response.text();
    if (!text || text.trim() === "") {
      console.log("Empty response received");
      return []; // Return empty array for empty response
    }

    const jsonResponse = await JSON.parse(text);

    return RoleSchema.array().parse(jsonResponse.data);
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
}

export async function getRole(id: string): Promise<RoleData> {
  const url = `${apiURL}/roles/${id}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.statusText}`);
    }

    const jsonResponse = await response.json();

    return RoleSchema.parse(jsonResponse.data);
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
}

export const UpdateRoleSchema = z.object({
  title: z.string({ error: "Title is required" }),
  description: z.string().optional(),
  permissionIds: z.string().array().optional(),
});

export type UpdateRoleData = z.infer<typeof UpdateRoleSchema>;

export async function createRole(data: UpdateRoleData) {
  const url = `${apiURL}/roles`;

  try {
    const response = await customFetch(url, {
      method: "POST",
      body: data,
    });

    if (!response.ok) {
      const json = await response.json();
      console.log("JSON: ", json);

      throw json;
    }

    const jsonResponse = await response.json();

    return RoleSchema.parse(jsonResponse.data);
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
}

export async function updateRole(id: string, data: UpdateRoleData) {
  const url = `${apiURL}/roles/${id}`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
      body: data,
    });

    if (!response.ok) {
      throw new Error(`Failed to update role: ${response.statusText}`);
    }

    const jsonResponse = await response.json();

    return RoleSchema.parse(jsonResponse.data);
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
}

export { RoleSchema, getRoles };
export type { RoleData };
