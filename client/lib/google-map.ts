// Google Maps API function to calculate travel time
export async function calculateTravelTime(
	origin: { latitude: number; longitude: number },
	destination: { latitude: number; longitude: number },
): Promise<number> {
	try {
		const response = await fetch("/api/travel-time", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				origin,
				destination,
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.travelTime || 30;
	} catch (error) {
		console.error("Error calculating travel time:", error);
		return 30; // Default 30 minutes
	}
}
