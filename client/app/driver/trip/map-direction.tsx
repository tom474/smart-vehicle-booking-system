import { useState, useEffect } from "react";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { TripData } from "@/apis/trip";

export const MapWithDirections = ({
	userLocation,
	tripData,
	getStopMarkerColor,
}: {
	userLocation: { lat: number; lng: number } | null;
	tripData: TripData | null;
	getStopMarkerColor: (index: number, isCompleted: boolean) => string;
}) => {
	const map = useMap();
	const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
	const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

	// Initialize directions service and renderer when map is available
	useEffect(() => {
		if (map && window.google && window.google.maps) {
			const service = new google.maps.DirectionsService();
			const renderer = new google.maps.DirectionsRenderer({
				suppressMarkers: true, // We'll use custom markers
				polylineOptions: {
					strokeColor: "#4285F4",
					strokeWeight: 4,
					strokeOpacity: 0.8,
				},
			});

			renderer.setMap(map);
			setDirectionsService(service);
			setDirectionsRenderer(renderer);
		}
	}, [map]);

	// Calculate route when dependencies change
	useEffect(() => {
		if (userLocation && tripData?.stops && directionsService && directionsRenderer) {
			calculateRoute();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userLocation, tripData, directionsService, directionsRenderer]);

	const calculateRoute = () => {
		if (!userLocation || !tripData?.stops || !directionsService || !directionsRenderer) return;

		// Get remaining stops (not completed yet)
		const remainingStops = tripData.stops.filter((stop) => !stop.actualArrivalTime);

		// If no remaining stops, clear the route
		if (remainingStops.length === 0) {
			directionsRenderer.setDirections({
				routes: [],
				request: {
					origin: userLocation!,
					destination: userLocation!,
					travelMode: google.maps.TravelMode.DRIVING,
				},
			} as google.maps.DirectionsResult);
			return;
		}

		// Handle case with only one remaining stop
		if (remainingStops.length === 1) {
			const singleStop = remainingStops[0];
			const destination = { lat: singleStop.location.latitude, lng: singleStop.location.longitude };

			const request: google.maps.DirectionsRequest = {
				origin: userLocation,
				destination: destination,
				travelMode: google.maps.TravelMode.DRIVING,
			};

			directionsService.route(request, (result, status) => {
				if (status === "OK" && result) {
					directionsRenderer.setDirections(result);
				} else {
					console.error("Directions request failed due to " + status);
				}
			});
			return;
		}

		// Handle multiple remaining stops
		const waypoints = remainingStops.slice(0, -1).map((stop) => ({
			location: { lat: stop.location.latitude, lng: stop.location.longitude },
			stopover: true,
		}));

		const lastStop = remainingStops[remainingStops.length - 1];
		const destinationPoint = { lat: lastStop.location.latitude, lng: lastStop.location.longitude };

		const request: google.maps.DirectionsRequest = {
			origin: userLocation,
			destination: destinationPoint,
			waypoints: waypoints,
			optimizeWaypoints: false,
			travelMode: google.maps.TravelMode.DRIVING,
		};

		directionsService.route(request, (result, status) => {
			if (status === "OK" && result) {
				directionsRenderer.setDirections(result);
			} else {
				console.error("Directions request failed due to " + status);
			}
		});
	};

	return (
		<>
			{/* User's current location marker */}
			{userLocation && (
				<AdvancedMarker position={userLocation} title="Your Location">
					<div
						style={{
							width: "20px",
							height: "20px",
							backgroundColor: "#4285F4",
							border: "3px solid white",
							borderRadius: "50%",
							boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
						}}
					/>
				</AdvancedMarker>
			)}

			{/* Stop markers */}
			{tripData?.stops?.map((stop, index) => (
				<AdvancedMarker
					key={index}
					position={{
						lat: stop.location.latitude,
						lng: stop.location.longitude,
					}}
					title={`Stop ${index + 1}: ${stop.location.name || stop.location.address}`}
				>
					<div
						style={{
							width: "24px",
							height: "24px",
							backgroundColor: getStopMarkerColor(index, !!stop.actualArrivalTime),
							border: "3px solid white",
							borderRadius: "50%",
							boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "12px",
							fontWeight: "bold",
							color: "white",
						}}
					>
						{index + 1}
					</div>
				</AdvancedMarker>
			))}
		</>
	);
};
