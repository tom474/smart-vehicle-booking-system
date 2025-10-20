import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { origin, destination } = await request.json();

		const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Note: No NEXT_PUBLIC_ prefix
		if (!apiKey) {
			console.warn("Google Maps API key not found");
			return NextResponse.json({ travelTime: 30 });
		}

		const originStr = `${origin.latitude},${origin.longitude}`;
		const destinationStr = `${destination.latitude},${destination.longitude}`;

		const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destinationStr}&key=${apiKey}&units=metric&departure_time=now&traffic_model=best_guess`;

		const response = await fetch(url);
		const data = await response.json();

		if (data.status === "OK" && data.rows?.[0]?.elements?.[0]?.status === "OK") {
			const durationInTraffic =
				data.rows[0].elements[0].duration_in_traffic?.value || data.rows[0].elements[0].duration?.value;

			// Convert to minutes and add 20% buffer
			const travelTimeMinutes = Math.ceil(durationInTraffic / 60);
			const travelTimeWithBuffer = Math.ceil(travelTimeMinutes * 1.2);

			return NextResponse.json({ travelTime: travelTimeWithBuffer });
		} else {
			console.warn("Google Maps API returned error:", data);
			return NextResponse.json({ travelTime: 30 });
		}
	} catch (error) {
		console.error("Error calculating travel time:", error);
		return NextResponse.json({ travelTime: 30 });
	}
}
