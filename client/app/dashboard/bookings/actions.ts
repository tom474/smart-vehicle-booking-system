"use server";
import { revalidatePath } from "next/cache";
import { cancelBookingRequest } from "@/apis/booking-request";

async function cancelBookingRequestAction(id: string) {
	await cancelBookingRequest(id, "N/A");

	revalidatePath("/dashboard/bookings");
}

export default cancelBookingRequestAction;
