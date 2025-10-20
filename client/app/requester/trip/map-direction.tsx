import { useState, useEffect } from "react";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { Car, MapPin, MapPinCheckInside } from "lucide-react";
import { TripTicketData } from "@/apis/trip-ticket";

export const MapWithDirections = ({
	userLocation,
	tripData,
	driverLocation,
}: {
	userLocation: { lat: number; lng: number } | null;
	tripData: TripTicketData | null;
	driverLocation: { lat: number; lng: number } | null;
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
		if (directionsService && directionsRenderer) {
			calculateRoute();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userLocation, tripData, driverLocation, directionsService, directionsRenderer]);

	const calculateRoute = () => {
		if (!directionsService || !directionsRenderer) return;

		let origin, destination;

		// Determine origin and destination based on trip status and available locations
		if (tripData?.ticketStatus === "pending" && driverLocation && tripData?.departureLocation) {
			// When pending: show route from driver to pickup location (user's departure location)
			origin = driverLocation;
			destination = {
				lat: tripData.departureLocation.latitude,
				lng: tripData.departureLocation.longitude,
			};
		} else if (tripData?.ticketStatus === "picked_up" && userLocation && tripData?.arrivalLocation) {
			// When picked up: show route from user's current location to destination
			origin = userLocation;
			destination = {
				lat: tripData.arrivalLocation.latitude,
				lng: tripData.arrivalLocation.longitude,
			};
		} else if (userLocation && tripData?.arrivalLocation) {
			// Fallback: show route from user to destination
			origin = userLocation;
			destination = {
				lat: tripData.arrivalLocation.latitude,
				lng: tripData.arrivalLocation.longitude,
			};
		} else {
			// No valid route can be calculated
			return;
		}

		const request: google.maps.DirectionsRequest = {
			origin: origin,
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

			{/* Driver's location marker */}
			{driverLocation && (
				<AdvancedMarker position={driverLocation} title="Driver Location">
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "30px",
							height: "30px",
							backgroundColor: "#10B981",
							border: "3px solid white",
							borderRadius: "50%",
							boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
							animation: "pulse 2s infinite",
						}}
					>
						<Car size={20} color="white" />
					</div>
				</AdvancedMarker>
			)}

			{/* Destination marker */}
			{tripData?.arrivalLocation && (
				<AdvancedMarker
					position={{
						lat: tripData.arrivalLocation.latitude,
						lng: tripData.arrivalLocation.longitude,
					}}
					title="Destination"
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "30px",
							height: "30px",
							backgroundColor: "#EF4444",
							border: "3px solid white",
							borderRadius: "50%",
							boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
						}}
					>
						<MapPinCheckInside size={20} color="white" />
					</div>
				</AdvancedMarker>
			)}

			{/* Pickup location marker (only show when driver hasn't picked up user yet) */}
			{tripData?.departureLocation && tripData.ticketStatus === "pending" && (
				<AdvancedMarker
					position={{
						lat: tripData.departureLocation.latitude,
						lng: tripData.departureLocation.longitude,
					}}
					title="Pickup Location"
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "30px",
							height: "30px",
							backgroundColor: "#F59E0B",
							border: "3px solid white",
							borderRadius: "50%",
							boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
						}}
					>
						<MapPin size={20} color="white" />
					</div>
				</AdvancedMarker>
			)}

			{/* Add CSS for pulse animation */}
			<style jsx>{`
				@keyframes pulse {
					0% {
						box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
					}
					70% {
						box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
					}
					100% {
						box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
					}
				}
			`}</style>
		</>
	);
};
