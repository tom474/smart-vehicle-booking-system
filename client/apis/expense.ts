import { z } from "zod/v4";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";
import { buildQueryParams } from "@/lib/build-query-param";

const ExpenseSchema = z.object({
  id: z.string(),
  status: z.enum(
    ["pending", "approved", "rejected", "cancelled", "completed"],
    {
      error: "Expense status is required.",
    },
  ),
  type: z.string(),
  amount: z.number().positive({
    error: "Amount must be a positive number.",
  }),
  description: z.string().optional().nullable(),
  receiptImageUrl: z.string().optional().nullable(),

  driverId: z.string().optional().nullable(),
  tripId: z.string().optional().nullable(),
  vehicleServiceId: z.string().optional().nullable(),

  attachments: z.array(z.file()).optional().nullable(),
  rejectReason: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

type ExpenseData = z.infer<typeof ExpenseSchema>;

interface GetExpensesParams extends UrlCommonParams {
  driverId?: string | number;
  tripId?: string | number;
  vehicleServiceId?: string | number;
  status?: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  type?: "trip" | "maintenance" | "operational";
  // orderField?: string;
  // orderDirection?: string;
  // page?: number;
  // limit?: number;
}

async function getExpenses({
  ...params
}: GetExpensesParams): Promise<ExpenseData[]> {
  let url = `${apiURL}/expenses`;

  const queryParams = buildQueryParams(params);

  url += `?${queryParams.toString()}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch expenses: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    return jsonResponse.data.map((item: ExpenseData) =>
      transformExpenseData(item),
    );
  } catch (error) {
    throw error;
  }
}

async function getExpense(
  expenseId: string | number,
): Promise<ExpenseData | null> {
  const url = `${apiURL}/expenses/${expenseId}`;

  try {
    const response = await customFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch expense: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    return transformExpenseData(jsonResponse.data);
  } catch (error) {
    throw error;
  }
}

async function createExpense(expenseData: ExpenseData): Promise<ExpenseData> {
  const url = `${apiURL}/expenses`;

  try {
    // Create FormData for file upload
    const formData = new FormData();

    // Add the expense data as JSON string (excluding attachments)
    const expenseDataWithoutAttachments = { ...expenseData };
    delete expenseDataWithoutAttachments.attachments;
    formData.append("data", JSON.stringify(expenseDataWithoutAttachments));

    // Add the file if it exists
    if (expenseData.attachments?.[0]) {
      formData.append("receipt", expenseData.attachments[0]);
    }

    const response = await customFetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const json = await response.json();
      throw json;
    }

    const jsonResponse = await response.json();
    return transformExpenseData(jsonResponse.data);
  } catch (error) {
    throw error;
  }
}

async function updateExpense(
  expenseId: string | number,
  updatedData: ExpenseData,
): Promise<ExpenseData | null> {
  const url = `${apiURL}/expenses/${expenseId}`;

  try {
    // Create FormData for file upload
    const formData = new FormData();

    // Add the expense data as JSON string (excluding attachments)
    const expenseDataWithoutAttachments = { ...updatedData };
    delete expenseDataWithoutAttachments.attachments;
    formData.append("data", JSON.stringify(expenseDataWithoutAttachments));

    // Add the file if it exists
    if (updatedData.attachments?.[0]) {
      formData.append("receipt", updatedData.attachments[0]);
    }

    const response = await customFetch(url, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      const json = await response.json();
      throw json;
    }

    const jsonResponse = await response.json();
    return transformExpenseData(jsonResponse.data);
  } catch (error) {
    throw error;
  }
}

async function deleteExpense(expenseId: string | number): Promise<boolean> {
  const url = `${apiURL}/expenses/${expenseId}`;

  try {
    const response = await customFetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      const json = await response.json();
      throw json;
    }

    return true;
  } catch (error) {
    throw error;
  }
}

export async function approveExpense(
  expenseId: string | number,
): Promise<boolean> {
  const url = `${apiURL}/expenses/${expenseId}/approve`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete expense: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

export async function rejectExpense(
  expenseId: string | number,
  reason: string,
): Promise<boolean> {
  const url = `${apiURL}/expenses/${expenseId}/reject`;

  try {
    const response = await customFetch(url, {
      method: "PUT",
      body: {
        reason,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete expense: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

export const CreateExpenseSchema = z
  .object({
    type: z
      .string({ error: "Type must be provided" })
      .min(1, "Type is required."),
    operationalType: z.enum(["tolls", "parkings", "fuel"]).optional(),
    operationalCustomType: z.string().optional(),
    description: z.string().nullable().optional(),
    amount: z
      .number({ error: "Amount must be a number." })
      .positive("Amount must be greater than 0."),
    receiptImageUrl: z.string().nullable().optional(),
    receipt: z
      .any()
      .nonoptional("File cant be empty")
      .refine(
        (val) =>
          val instanceof File ||
          (val &&
            typeof val === "object" &&
            "url" in val &&
            "id" in val),
        "Receipt must be a file or file metadata",
      ),
    tripId: z.string().nullable().optional(),
    vehicleServiceId: z.string().nullable().optional(),
  })
  .check((ctx) => {
    const data = ctx.value;
    if (data.type === "operational" && !data.operationalType) {
      ctx.issues.push({
        code: "custom",
        input: data,
        message: "Custom type is required",
        path: ["operationalType"],
      });
    }
    // if (
    //   data.type === "operational" &&
    //   data.operationalType === "custom" &&
    //   (!data.operationalCustomType ||
    //     data.operationalCustomType.trim().length === 0)
    // ) {
    //   ctx.issues.push({
    //     code: "custom",
    //     input: data,
    //     message:
    //       "Custom type description is required when operational type is Custom",
    //     path: ["operationalCustomType"],
    //   });
    // }

    if (
      data.type === "trip" &&
      (!data.tripId || data.tripId.trim().length === 0)
    ) {
      ctx.issues.push({
        code: "custom",
        input: data,
        message: "Trip is required",
        path: ["tripId"],
      });
    }

    if (
      data.type === "vehicleService" &&
      (!data.vehicleServiceId ||
        data.vehicleServiceId.trim().length === 0)
    ) {
      ctx.issues.push({
        code: "custom",
        input: data,
        message: "Vehicle service is required",
        path: ["vehicleServiceId"],
      });
    }
  });

export type CreateExpenseData = z.infer<typeof CreateExpenseSchema>;

// TODO: Incoporate this into the createExpense above
export async function createExpenseData(expenseData: CreateExpenseData) {
  const url = `${apiURL}/expenses`;

  try {
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        ...expenseData,
        type:
          expenseData.operationalCustomType ||
          expenseData.operationalType ||
          expenseData.type,
      }),
    );
    formData.append("receipt", expenseData.receipt);

    const response = await customFetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw await response.json();
    }
  } catch (error) {
    throw error;
  }
}

// TODO: Incoporate this into the updateExpense above
export async function updateExpenseData(
  id: string,
  expenseData: CreateExpenseData,
) {
  const url = `${apiURL}/expenses/${id}`;

  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(expenseData));
    formData.append("receipt", expenseData.receipt);

    const response = await customFetch(url, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to create expense: ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }
}

export {
  ExpenseSchema,
  type ExpenseData,
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
};

function transformExpenseData(item: ExpenseData): ExpenseData {
  const transformedItem = {
    ...item,
    amount:
      typeof item.amount === "string"
        ? parseFloat(item.amount)
        : item.amount,
    createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
  };

  return ExpenseSchema.parse(transformedItem);
}
