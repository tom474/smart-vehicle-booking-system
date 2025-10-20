import React, { useState, useEffect, useRef } from "react"
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import { Input } from "@/components/ui/input"

interface MapHandlerProps {
    place: google.maps.places.PlaceResult | null
    marker: google.maps.marker.AdvancedMarkerElement | null
}

export const MapHandler = ({ place, marker }: MapHandlerProps) => {
    const map = useMap()

    useEffect(() => {
        if (!map || !place || !marker) return

        if (place.geometry?.viewport) {
            map.fitBounds(place.geometry?.viewport)
        }
        marker.position = place.geometry?.location
    }, [map, place, marker])

    return null
}

interface PlaceAutocompleteProps {
    onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void
}

export const PlaceAutocomplete = ({
    onPlaceSelect,
}: PlaceAutocompleteProps) => {
    const [placeAutocomplete, setPlaceAutocomplete] =
        useState<google.maps.places.Autocomplete | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const places = useMapsLibrary("places")

    useEffect(() => {
        if (!places || !inputRef.current) return

        const options = {
            fields: ["geometry", "name", "formatted_address"],
        }

        setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options))
    }, [places])

    useEffect(() => {
        if (!placeAutocomplete) return

        placeAutocomplete.addListener("place_changed", () => {
            onPlaceSelect(placeAutocomplete.getPlace())
        })
    }, [onPlaceSelect, placeAutocomplete])

    return (
        <div className="autocomplete-container">
            <Input
                type="text"
                placeholder="Search"
                className="bg-white"
                ref={inputRef}
            />
        </div>
    )
}
