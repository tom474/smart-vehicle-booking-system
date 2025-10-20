import { z } from "zod/v4";
import { TripSchema } from "@/apis/trip";
import { UserSchema } from "@/apis/user";
import { apiURL, customFetch } from "@/lib/utils";
import type { UrlCommonParams } from "@/types/api-params";
import { buildQueryParams } from "@/lib/build-query-param";

const TripFeedbackSchema = z.object({
	id: z.string(),
	rating: z
		.number({
			error: "Rating is required.",
		})
		.min(1, { message: "Rating must be at least 1." })
		.max(5, { message: "Rating must be at most 5." }),
	comment: z.string().optional().nullable(),
	userId: z.string({
		error: "User ID is required.",
	}),
	tripId: z.string({
		error: "Trip ID is required.",
	}),
	user: UserSchema.optional(),
	trip: TripSchema.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

type TripFeedbackData = z.infer<typeof TripFeedbackSchema>;

interface GetTripFeedbacksParams extends UrlCommonParams {
	tripId?: string | number;
	userId?: string | number;
}

async function getTripFeedbacks({
	...params
}: GetTripFeedbacksParams): Promise<TripFeedbackData[]> {
	let url = `${apiURL}/trip-feedbacks`;

	const queryParams = buildQueryParams(params);

	url += `?${queryParams.toString()}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch trip feedbacks: ${response.statusText}`,
			);
		}

		const jsonResponse = await response.json();
		return jsonResponse.data.map((item: TripFeedbackData) =>
			transformTripFeedbackData(item),
		);
	} catch (error) {
		console.error("Error fetching trip feedbacks:", error);
		throw error;
	}
}

async function getTripFeedbackById(
	id: string,
): Promise<TripFeedbackData | undefined> {
	const url = `${apiURL}/trip-feedbacks/${id}`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch trip feedback: ${response.statusText}`,
			);
		}

		const jsonResponse = await response.json();
		return transformTripFeedbackData(jsonResponse.data);
	} catch (error) {
		console.error("Error fetching trip feedback:", error);
		throw error;
	}
}

async function userGetFeedbackFromTrip(
	id: string,
): Promise<TripFeedbackData | undefined> {
	const url = `${apiURL}/trips/${id}/user-feedback`;

	try {
		const response = await customFetch(url);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch user feedback from trip: ${response.statusText}`,
			);
		}

		const jsonResponse = await response.json();
		if (!jsonResponse.data) {
			return undefined; // Return undefined if no feedback found
		}
		return transformTripFeedbackData(jsonResponse.data);
	} catch (error) {
		console.error("Error fetching user feedback from trip:", error);
		throw error;
	}
}

async function createTripFeedback(data: TripFeedbackData) {
	const url = `${apiURL}/trip-feedbacks`;

	try {
		const response = await customFetch(url, {
			method: "POST",
			body: data,
		});

		if (!response.ok) {
			throw new Error(
				`Failed to create trip feedback: ${response.statusText}`,
			);
		}

		const jsonResponse = await response.json();
		return transformTripFeedbackData(jsonResponse.data);
	} catch (error) {
		console.error("Error creating trip feedback:", error);
		throw error;
	}
}

export {
	TripFeedbackSchema,
	type TripFeedbackData,
	getTripFeedbacks,
	getTripFeedbackById,
	userGetFeedbackFromTrip,
	createTripFeedback,
};

function transformTripFeedbackData(item: TripFeedbackData): TripFeedbackData {
	const transformedItem = {
		...item,
		userId: item.user?.id,
		tripId: item.trip?.id,
		user: undefined,
		trip: undefined,
		createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
		updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
	};

	return TripFeedbackSchema.parse(transformedItem);
}
