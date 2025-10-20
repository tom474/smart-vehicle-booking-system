import { z } from "zod/v4";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";
import { buildQueryParams } from "@/lib/build-query-param";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phoneNumber: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "suspended"]),
  roleId: z.string(),
  // numberOfBookingRequestsAsRequester: z.number().min(0),
  dedicatedVehicle: z.string().optional().nullable(),
});

type UserData = z.infer<typeof UserSchema>;

const UserTokenSchema = z.object({
  id: z.string().min(1, "ID is required"),
  email: z.string().nullable(),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["active", "inactive", "suspended"], {
    error: () => ({
      message: "Status must be 'active', 'inactive', or 'suspended'",
    }),
  }),
});

type UserTokenData = z.infer<typeof UserTokenSchema>;

interface GetUsersParams extends UrlCommonParams {
  page?: number;
  limit?: number;
  orderField?: "id" | "name" | "email" | "phoneNumber" | "status" | "role";
  orderDirection?: "ASC" | "DESC";
  roleId?: string;
  searchField?: "id" | "name" | "email" | "phoneNumber" | "status" | "role";
  searchValue?: string;
}

async function getUsers({ ...params }: GetUsersParams): Promise<UserData[]> {
  let url = `${apiURL}/users`;

  const queryParams = buildQueryParams(params);
  // if (page !== undefined) {
  // 	queryParams.append("page", page.toString());
  // }
  // if (limit !== undefined) {
  // 	queryParams.append("limit", limit.toString());
  // }
  // if (orderField) {
  // 	queryParams.append("orderField", orderField);
  // }
  // if (orderDirection) {
  // 	queryParams.append("orderDirection", orderDirection);
  // }
  // if (roleId !== undefined) {
  // 	queryParams.append("roleId", roleId.toString());
  // }
  // if (searchField && searchValue) {
  // 	queryParams.append("searchField", searchField);
  // 	queryParams.append("searchValue", searchValue);
  // }

  url += `?${queryParams.toString()}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching users: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((user: UserData) => UserSchema.parse(user));
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

async function getUser(id: string): Promise<UserData> {
  const url = `${apiURL}/users/${id}`;
  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching user: ${response.statusText}`);
    }

    const data = await response.json();
    return UserSchema.parse(data.data);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

export const UpdateUserSchema = z.object({
  ...UserSchema.pick({
    name: true,
    email: true,
    phoneNumber: true,
    profileImageUrl: true,
    roleId: true,
  }).shape,
});

async function updateUser(
  id: string,
  updateData?: z.infer<typeof UpdateUserSchema>,
  avatar?: File,
) {
  try {
    // Validate required fields
    if (!id) {
      throw new Error("User ID is required");
    }

    const formData = new FormData();
    if (updateData) {
      formData.append("data", JSON.stringify(updateData));
    } else {
      formData.append("data", JSON.stringify({}));
    }
    if (avatar) {
      formData.append("avatar", avatar);
    }

    const response = await customFetch(`${apiURL}/users/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to update user");
    }

    const data = await response.json();
    return UserSchema.parse(data.data);
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    // return {
    // 	success: false,
    // 	message: error.message || "Failed to update user",
    // }
  }
}

export async function assignRoleForUser(userId: string, roleId: string) {
  try {
    const response = await customFetch(
      `${apiURL}/users/${userId}/change-role`,
      {
        method: "PUT",
        body: {
          roleId,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to assign role for user");
    }

    const data = await response.json();
    return UserSchema.parse(data.data);
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    // return {
    // 	success: false,
    // 	message: error.message || "Failed to update user",
    // }
  }
}

async function deactivateUser(id: string) {
  try {
    // Validate required fields
    if (!id) {
      throw new Error("User ID is required");
    }

    const response = await customFetch(`${apiURL}/users/${id}/deactivate`, {
      method: "PUT",
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

export async function suspendUser(id: string) {
  try {
    // Validate required fields
    if (!id) {
      throw new Error("User ID is required");
    }

    const response = await customFetch(`${apiURL}/users/${id}/suspend`, {
      method: "PUT",
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

export async function reactivateUser(id: string) {
  try {
    const response = await customFetch(`${apiURL}/users/${id}/activate`, {
      method: "PUT",
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

export {
  UserSchema,
  type UserData,
  UserTokenSchema,
  type UserTokenData,
  getUsers,
  getUser,
  updateUser,
  deactivateUser,
};
