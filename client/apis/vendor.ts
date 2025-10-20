import { z } from "zod/v4";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";

const VendorSchema = z.object({
	email: z.email(),
	id: z.string(),
	name: z.string(),
	address: z.string(),
	contactPerson: z.string(),
	phoneNumber: z.string(),
	status: z.enum(["active", "inactive"]), // Assuming these are the possible statuses
	numberOfDrivers: z.number().int().min(0),
	numberOfVehicles: z.number().int().min(0),
});

type VendorData = z.infer<typeof VendorSchema>;

interface GetVendorsParams extends UrlCommonParams {
	status?: string;
}

async function getVendors({
	searchField,
	searchValue,
	orderField,
	orderDirection,
	page,
	limit,
	status,
}: GetVendorsParams): Promise<VendorData[]> {
	let url = `${apiURL}/vendors`;

	const queryParams = new URLSearchParams();
	if (searchField) queryParams.append("searchField", searchField);
	if (searchValue) queryParams.append("searchValue", searchValue);
	if (orderField) queryParams.append("orderField", orderField);
	if (orderDirection) queryParams.append("orderDirection", orderDirection);
	if (page) queryParams.append("page", page.toString());
	if (limit) queryParams.append("limit", limit.toString());
	if (status) queryParams.append("status", status);
	url += `?${queryParams.toString()}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch vendors: ${response.statusText}`);
		}

		// Check if response body is empty
		const text = await response.text();
		if (!text || text.trim() === "") {
			console.log("Empty response received");
			return []; // Return empty array for empty response
		}

		const jsonResponse = await JSON.parse(text);

		return VendorSchema.array().parse(jsonResponse.data);
	} catch (error) {
		console.error("Error fetching vendors:", error);
		throw error;
	}
}

async function getVendor(id: string): Promise<VendorData> {
	const url = `${apiURL}/vendors/${id}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(`Failed to add vendor: ${response.statusText}`);
		}

		const json = await response.json();
		return VendorSchema.parse(json.data);
	} catch (error) {
		console.error("Error adding vendors:", error);
		throw error;
	}
}

const CreateVendorSchema = z.object({
	name: z
		.string({ error: "Name is required" })
		.max(100, { error: "Name must be 100 characters or less" }),
	address: z
		.string()
		.max(200, { error: "Address must be 200 characters or less" })
		.optional(),
	contactPerson: z
		.string({ error: "Contact person is required" })
		.max(100, { error: "Contact person must be 100 characters or less" }),
	email: z.email({ error: "Invalid email address" }),
	phoneNumber: z
		.string({ error: "Phone number is required" })
		.regex(/^[\d\s+\-()]{5,10}$/, {
			message: "Phone number must be 5-10 digits and may include + - ( )",
		}),
	status: VendorSchema.shape.status.optional(),
});

type CreateVendorSchemaData = z.infer<typeof CreateVendorSchema>;

async function createVendor(data: CreateVendorSchemaData) {
	const url = `${apiURL}/vendors`;

	try {
		const response = await customFetch(url, {
			method: "POST",
			body: data,
		});

		if (!response.ok) {
			throw new Error(`Failed to add vendor: ${response.statusText}`);
		}

		// Check if response body is empty
		const text = await response.text();
		if (!text || text.trim() === "") {
			console.log("Empty response received");
		}
	} catch (error) {
		console.error("Error adding vendors:", error);
		throw error;
	}
}

const UpdateVendorSchema = CreateVendorSchema;
type UpdateVendorSchemaData = z.infer<typeof UpdateVendorSchema>;

async function updateVendor(id: string, data: CreateVendorSchemaData) {
	const url = `${apiURL}/vendors/${id}`;

	try {
		const response = await customFetch(url, {
			method: "PUT",
			body: data,
		});

		console.log(response);

		if (!response.ok) {
			throw new Error(`Failed to update vendor: ${response.statusText}`);
		}
	} catch (error) {
		console.error("Error updating vendors:", error);
		throw error;
	}
}

async function deleteVendor(id: string) {
	const url = `${apiURL}/vendors/${id}`;

	try {
		const response = await customFetch(url, {
			method: "DELETE",
		});

		if (!response.ok) {
			throw new Error(`Failed to delete vendor: ${response.statusText}`);
		}

		// Check if response body is empty
		const text = await response.text();
		if (!text || text.trim() === "") {
			console.log("Empty response received");
		}
	} catch (error) {
		console.error("Error deleting vendor:", error);
		throw error;
	}
}

export type { VendorData, CreateVendorSchemaData, UpdateVendorSchemaData };
export {
	VendorSchema,
	CreateVendorSchema,
	UpdateVendorSchema,
	getVendors,
	getVendor,
	deleteVendor,
	createVendor,
	updateVendor,
};
