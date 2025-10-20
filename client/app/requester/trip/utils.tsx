// Start watching user's location for real-time tracking
export const startLocationTracking = (
	setUserLocation: (location: { lat: number; lng: number }) => void,
	setWatchId: (id: number | null) => void,
	maxErrors: number = 3, // Maximum number of errors before stopping
) => {
	if (!navigator.geolocation) {
		console.error("Geolocation is not supported by this browser.");
		return;
	}

	let errorCount = 0;
	let watchId: number | null = null;

	const watchPosition = () => {
		watchId = navigator.geolocation.watchPosition(
			(position) => {
				const newLocation = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				setUserLocation(newLocation);
				// Reset error count on successful location update
				errorCount = 0;
			},
			(error) => {
				errorCount++;
				console.warn(`Error getting location (attempt ${errorCount}/${maxErrors}):`, error);

				if (errorCount >= maxErrors) {
					console.warn("Maximum location errors reached. Stopping location tracking.");
					if (watchId) {
						navigator.geolocation.clearWatch(watchId);
						setWatchId(null);
					}
					return;
				}
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 1000,
			},
		);
	};

	watchPosition();
	if (watchId) {
		setWatchId(watchId);
	}
};
