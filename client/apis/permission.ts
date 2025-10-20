import z from "zod/v4";
import { buildQueryParams } from "@/lib/build-query-param";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";

const PermissionSchema = z.object({
  id: z.string().regex(/^PER-\d+$/, {
    error: "ID must be in format PER-{number}",
  }),
  description: z.string().describe("Permission description"),
  title: z.string({ error: "Title is required" }),
});

type PermissionData = z.infer<typeof PermissionSchema>;

interface GetRolesParams extends UrlCommonParams {
  searchField?: string;
  searchValue?: string;
  orderField?: string;
  orderDirection?: "ASC" | "DESC";
  page?: number;
  limit?: number;
  roleId?: string;
}

async function getPermissions({
  ...params
}: GetRolesParams): Promise<PermissionData[]> {
  let url = `${apiURL}/permissions`;

  const queryParams = buildQueryParams(params);
  url += `?${queryParams.toString()}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch permissions: ${response.statusText}`,
      );
    }

    // Check if response body is empty
    const text = await response.text();
    if (!text || text.trim() === "") {
      console.log("Empty response received");
      return []; // Return empty array for empty response
    }

    const jsonResponse = await JSON.parse(text);

    return PermissionSchema.array().parse(jsonResponse.data);
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
}

async function getPermission(id: string): Promise<PermissionData> {
  const url = `${apiURL}/permissions/${id}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get permission: ${response.statusText}`);
    }

    const json = await response.json();
    return PermissionSchema.parse(json.data);
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
}

export { PermissionSchema, getPermissions, getPermission };
export type { PermissionData };
