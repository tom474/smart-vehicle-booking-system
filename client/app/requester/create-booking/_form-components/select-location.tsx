"use client";

import { ChevronLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import {
	APIProvider,
	ControlPosition,
	MapControl,
	AdvancedMarker,
	Map,
	useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { MapHandler, PlaceAutocomplete } from "@/app/requester/create-booking/_form-components/place-autocomplete";
import { LocationFieldType, LocationData, getLocations } from "@/apis/location";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

const DEFAULT_LOCATION = {
	lat: 10.772477646096544,
	lng: 106.72258191246434,
};

interface SelectLocationProps {
	mobile?: boolean;
	setIsSelectLocation: (value: boolean) => void;
	onLocationSelect: (location: LocationData) => void;
	locationType: LocationFieldType;
	fixedLocationsOnly?: boolean;
	initialLocation?: LocationData;
	coordinator?: boolean;
}

export default function SelectLocation({
	mobile = true,
	setIsSelectLocation,
	onLocationSelect,
	fixedLocationsOnly = false,
	initialLocation,
	coordinator = false,
}: SelectLocationProps) {
	const t = useTranslations("RequesterBookings.bookingForm.form.selectLocation");
	const ggmap_api_key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

	const [isDrawerOpen, setIsDrawerOpen] = useState(true);
	const [markerRef, marker] = useAdvancedMarkerRef();

	const [useCenter, setUseCenter] = useState(false);
	const [mapCenter, setMapCenter] = useState(DEFAULT_LOCATION);
	const [selectedPosition, setSelectedPosition] = useState(DEFAULT_LOCATION);
	const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
	const [selectedFixedLocation, setSelectedFixedLocation] = useState<LocationData | null>(null);
	const [fixedLocations, setFixedLocations] = useState<LocationData[]>([]);
	const [page, setPage] = useState(1);
	const [hasNextPage, setHasNextPage] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const drawerListRef = useRef<HTMLDivElement>(null);

	// Refs to track the source of updates
	const isUpdatingFromPlace = useRef(false);
	const isUpdatingFromPosition = useRef(false);
	const isUsingFixedLocation = useRef(false);

	// Search state
	const [searchQuery, setSearchQuery] = useState("");
	const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
	const [debouncing, setDebouncing] = useState(false);

	useEffect(() => {
		// If there's an initial location, set it
		if (initialLocation) {
			console.log("Initial location:", initialLocation);
			if (initialLocation.latitude && initialLocation.longitude) {
				const newPosition = {
					lat: initialLocation.latitude,
					lng: initialLocation.longitude,
				};
				setSelectedPosition(newPosition);
				setMapCenter(newPosition);
			}
			setSelectedFixedLocation(initialLocation);

			// Fix: Check if google.maps.LatLng is available
			if (window.google && window.google.maps && typeof window.google.maps.LatLng === "function") {
				setSelectedPlace({
					name: initialLocation.name,
					formatted_address: initialLocation.address,
					geometry: {
						location: new window.google.maps.LatLng(
							initialLocation.latitude || 0,
							initialLocation.longitude || 0,
						),
					},
				});
			} else {
				// Optionally, setSelectedPlace to null or fallback
				setSelectedPlace(null);
				console.warn("Google Maps API not loaded yet when setting initial location.");
			}
		}
	}, [initialLocation]);

	// Debounced search function
	const debouncedSearch = useCallback(
		(query: string) => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
			setDebouncing(true);
			const timeout = setTimeout(() => {
				setPage(1);
				fetchFixedLocations(1, query);
				setDebouncing(false);
			}, 300); // 300ms delay
			setSearchTimeout(timeout);
		},
		[searchTimeout],
	);

	const fetchFixedLocations = async (pageNum: number, searchTerm?: string) => {
		try {
			setIsLoading(true);

			if (searchTerm && searchTerm.trim() !== "") {
				// Search both name and address separately, then combine results
				const [nameResults, addressResults] = await Promise.all([
					getLocations({
						type: "fixed",
						page: pageNum,
						limit: 10,
						searchField: "name",
						searchValue: searchTerm.trim(),
					}),
					getLocations({
						type: "fixed",
						page: pageNum,
						limit: 10,
						searchField: "address",
						searchValue: searchTerm.trim(),
					}),
				]);

				// Combine and deduplicate results
				const combinedResults = [...nameResults, ...addressResults];
				const uniqueResults = combinedResults.filter(
					(location, index, self) => index === self.findIndex((l) => l.id === location.id),
				);

				const locations = uniqueResults.slice(0, 10); // Limit to 10 results

				if (pageNum === 1) {
					setFixedLocations(locations);
				} else {
					setFixedLocations((prev) => [...prev, ...locations]);
				}

				setHasNextPage(locations.length === 10);
			} else {
				// No search term, get all locations
				const locations = await getLocations({
					type: "fixed",
					page: pageNum,
					limit: 10,
				});

				if (pageNum === 1) {
					setFixedLocations(locations);
				} else {
					setFixedLocations((prev) => [...prev, ...locations]);
				}

				setHasNextPage(locations.length === 10);
			}
		} catch (error) {
			console.error("Failed to fetch fixed locations:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchFixedLocations(1);
	}, []);

	// Handle search input changes
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);

		// Reset pagination when searching
		setPage(1);
		setFixedLocations([]);

		// Debounce the search
		debouncedSearch(query);
	};

	// Infinite scroll handler
	const handleScroll = useCallback(() => {
		if (!drawerListRef.current || isLoading || !hasNextPage) return;

		const { scrollTop, scrollHeight, clientHeight } = drawerListRef.current;
		if (scrollTop + clientHeight >= scrollHeight - 5) {
			const nextPage = page + 1;
			setPage(nextPage);
			fetchFixedLocations(nextPage, searchQuery);
		}
	}, [isLoading, hasNextPage, page, searchQuery]);

	useEffect(() => {
		const ref = drawerListRef.current;
		if (ref) {
			ref.addEventListener("scroll", handleScroll);
			return () => ref.removeEventListener("scroll", handleScroll);
		}
	}, [handleScroll]);

	// Clean up timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	// Sync selectedPlace -> selectedPosition (only if not in fixed locations mode)
	useEffect(() => {
		if (
			!fixedLocationsOnly &&
			selectedPlace &&
			selectedPlace.geometry &&
			selectedPlace.geometry.location &&
			!isUpdatingFromPosition.current
		) {
			isUpdatingFromPlace.current = true;
			const newPosition = {
				lat: selectedPlace.geometry.location.lat(),
				lng: selectedPlace.geometry.location.lng(),
			};
			setSelectedPosition(newPosition);
			setTimeout(() => {
				isUpdatingFromPlace.current = false;
			}, 100);
		}
	}, [selectedPlace, fixedLocationsOnly]);

	// Sync selectedPosition -> selectedPlace (with reverse geocoding) - only if not in fixed locations mode
	useEffect(() => {
		if (fixedLocationsOnly || !selectedPosition || isUpdatingFromPlace.current || isUsingFixedLocation.current)
			return;

		// Check if Google Maps API is fully loaded
		if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
			console.warn("Google Maps API not ready yet");
			return;
		}

		isUpdatingFromPosition.current = true;
		const geocoder = new window.google.maps.Geocoder();
		const latLng = new window.google.maps.LatLng(selectedPosition.lat, selectedPosition.lng);

		geocoder.geocode({ location: latLng }, (results, status) => {
			if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
				// Use Places Service to get detailed place information including name
				const service = new window.google.maps.places.PlacesService(document.createElement("div"));

				const request = {
					placeId: results[0].place_id,
					fields: ["name", "formatted_address", "geometry"],
				};

				service.getDetails(request, (place, status) => {
					if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
						// Use the actual place name from Places API
						const geocodedPlace: google.maps.places.PlaceResult = {
							formatted_address: place.formatted_address,
							geometry: place.geometry,
							name: place.name || place.formatted_address, // Use actual name or fallback to address
						};
						setSelectedPlace(geocodedPlace);
					} else {
						// Fallback to geocoding result if Places API fails
						const geocodedPlace: google.maps.places.PlaceResult = {
							formatted_address: results[0].formatted_address,
							geometry: {
								location: latLng,
								viewport: results[0].geometry.viewport,
							},
							name: results[0].formatted_address,
						};
						setSelectedPlace(geocodedPlace);
					}
					setTimeout(() => {
						isUpdatingFromPosition.current = false;
					}, 100);
				});
			} else {
				setSelectedPlace(null);
				setTimeout(() => {
					isUpdatingFromPosition.current = false;
				}, 100);
			}
		});
	}, [selectedPosition, fixedLocationsOnly]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleMapClick = (event: any) => {
		// Disable map click if in fixed locations only mode
		if (fixedLocationsOnly) return;

		if (event.detail.latLng) {
			const newPosition = {
				lat: event.detail.latLng.lat,
				lng: event.detail.latLng.lng,
			};
			setSelectedPosition(newPosition);
		}
	};

	const handleFixedLocationSelect = (location: LocationData) => {
		// Set flag to prevent reverse geocoding
		isUsingFixedLocation.current = true;

		// Update the selected fixed location and position
		setSelectedFixedLocation(location);

		// Update map position to show the fixed location
		if (location.latitude && location.longitude) {
			const newPosition = {
				lat: location.latitude,
				lng: location.longitude,
			};
			setSelectedPosition(newPosition);

			// Instead of using panBy, offset the center to show the location higher up
			// let offset = 0.0045;
			// if (fixedLocationsOnly) {
			// 	offset = 0.0175;
			// }
			// const offsetCenter = {
			// 	lat: location.latitude - offset,
			// 	lng: location.longitude,
			// };
			const offsetCenter = {
				lat: location.latitude, // Move center north to show location lower on screen
				lng: location.longitude,
			};
			setMapCenter(offsetCenter);
			setUseCenter(true);

			// Disable center after a short delay to allow free movement
			setTimeout(() => {
				setUseCenter(false);
			}, 1000);
		}

		// Update selected place for display
		setSelectedPlace({
			name: location.name,
			formatted_address: location.address,
			geometry: {
				location: new google.maps.LatLng(location.latitude || 0, location.longitude || 0),
			},
		});

		// Reset flag after a short delay to allow for future custom selections
		setTimeout(() => {
			isUsingFixedLocation.current = false;
		}, 100);
	};

	const handleConfirmLocation = () => {
		// Handle fixed location confirmation
		if (fixedLocationsOnly && selectedFixedLocation) {
			onLocationSelect(selectedFixedLocation);
			setIsSelectLocation(false);
			return;
		}

		// Handle custom location confirmation (existing logic)
		if (fixedLocationsOnly) return;

		const locationId = "LOC-" + Math.floor(Math.random() * 1000000).toString();
		onLocationSelect({
			id: locationId,
			type: "custom",
			name: selectedPlace?.name,
			address: selectedPlace?.formatted_address,
			latitude: selectedPosition.lat,
			longitude: selectedPosition.lng,
		});

		setIsSelectLocation(false);
	};

	if (!ggmap_api_key) {
		console.error("Google Maps API key is not defined.");
		return null;
	}

	return (
		<div className="relative w-full h-full">
			<div className="flex flex-col w-full h-full bg-background">
				<Button
					variant="ghost"
					className="absolute z-50 hover:bg-transparent hover:text-success hover:cursor-pointer top-4 left-4"
					onClick={() => setIsSelectLocation(false)}
				>
					<ChevronLeft className="size-6" />
				</Button>

				{/* Map Background - disable interactions in fixed locations mode */}
				<div className="w-full h-full">
					<APIProvider apiKey={ggmap_api_key} solutionChannel="GMP_devsite_samples_v3_rgmautocomplete">
						<Map
							style={{ width: "100%", height: "100%" }}
							{...(useCenter ? { center: mapCenter } : { defaultCenter: mapCenter })}
							defaultZoom={15}
							gestureHandling="greedy"
							disableDefaultUI={true}
							mapId="random-map-id"
							onClick={handleMapClick}
						>
							<AdvancedMarker position={selectedPosition} ref={markerRef} />
						</Map>
						{/* Hide search bar in fixed locations mode */}
						{!fixedLocationsOnly && (
							<MapControl position={mobile ? ControlPosition.TOP_CENTER : ControlPosition.TOP}>
								<div
									className={`px-2 pt-4 autocomplete-control z-1000 ${mobile ? "w-60" : "w-md"}`}
									style={{ pointerEvents: "auto" }}
								>
									<PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
								</div>
							</MapControl>
						)}
						{!fixedLocationsOnly && <MapHandler place={selectedPlace} marker={marker} />}
					</APIProvider>
				</div>
			</div>

			{/* Drawer */}
			<div
				className="absolute bottom-0 w-full transition-all duration-300 ease-in-out rounded-t-3xl bg-background"
				style={{
					height: isDrawerOpen ? (mobile ? "80vh" : "70vh") : "4vh",
				}}
			>
				{/* Drawer Handle */}
				<div className="flex justify-center pt-1">
					<Button
						variant="ghost"
						className="w-full max-w-xs hover:bg-background hover:cursor-pointer focus:outline-none focus:bg-background"
						onClick={() => setIsDrawerOpen(!isDrawerOpen)}
					>
						<div className="w-12 h-1 mb-2 bg-gray-300 rounded-full"></div>
					</Button>
				</div>

				{/* Drawer Content */}
				<div
					className={`flex flex-col justify-between px-4 pb-15 overflow-hidden transition-all duration-300 ${
						isDrawerOpen ? "opacity-100 max-h-full" : "opacity-0 max-h-0"
					}`}
					style={{ height: isDrawerOpen ? "100%" : "0" }}
				>
					<p className="text-headline-3">{t("chooseYourLocation")}</p>
					<div defaultValue="de-heus" className="flex flex-col flex-1 w-full mt-4 overflow-hidden">
						<Input
							type="text"
							placeholder={t("searchLocation")}
							value={searchQuery}
							onChange={handleSearchChange}
							className="w-full p-2 border rounded-md focus-visible:ring-0"
						/>
						<div
							className="flex flex-col flex-1 w-full min-h-0 gap-4 my-4 overflow-y-auto"
							ref={drawerListRef}
						>
							{fixedLocations.map((location, index) => (
								<div
									key={`${location.id}-${index}`}
									className={`flex flex-row items-center flex-shrink-0 gap-4 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
										selectedFixedLocation?.id === location.id
											? "bg-blue-50 border-2 border-blue-300"
											: ""
									}`}
									onClick={() => handleFixedLocationSelect(location)}
								>
									<MapPin className="flex-shrink-0" />
									<div className="flex flex-col">
										<p className="text-subtitle-1">{location.name}</p>
										<p className="text-gray-600 text-body-2">{location.address}</p>
									</div>
								</div>
							))}
							{isLoading && (
								<div className="flex justify-center py-2 text-sm text-muted-foreground">
									{t("loadingMoreLocations")}
								</div>
							)}
							{!hasNextPage && !isLoading && fixedLocations.length > 0 && (
								<div className="flex justify-center py-2 text-sm text-muted-foreground">
									{t("noMoreLocations")}
								</div>
							)}
							{!isLoading && fixedLocations.length === 0 && (
								<div className="flex justify-center py-4 text-sm text-muted-foreground">
									{debouncing
										? `${t("searchingFor")} "${searchQuery}"...`
										: searchQuery
											? `${t("noLocationFoundFor")} "${searchQuery}"`
											: t("noLocationAvailable")}
								</div>
							)}
						</div>
					</div>
					{/* Only show location confirmation for custom locations */}
					<div className="flex flex-col justify-between w-full gap-2 mt-1">
						<div className="h-full line-clamp-2 min-h-[3rem]">
							<span className="text-subtitle-1">{t("selectedLocation")}: </span>
							<span className="text-gray-600 text-body-2">
								{fixedLocationsOnly && selectedFixedLocation
									? `${selectedFixedLocation.name} - ${selectedFixedLocation.address}`
									: selectedPlace
										? selectedPlace.formatted_address
										: t("noLocation")}
							</span>
						</div>
						<Button
							className="w-full text-white bg-success hover:bg-success/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
							onClick={handleConfirmLocation}
							disabled={fixedLocationsOnly ? !selectedFixedLocation : !selectedPlace || coordinator}
						>
							{t("confirm")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
