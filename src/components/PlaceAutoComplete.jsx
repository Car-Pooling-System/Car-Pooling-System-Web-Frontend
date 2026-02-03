import { useEffect, useRef } from "react";

export default function PlaceAutocomplete({ onSelect, placeholder }) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (!window.google) return;

        const autocomplete = new window.google.maps.places.Autocomplete(
            inputRef.current,
            { fields: ["name", "geometry"] }
        );

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;

            onSelect({
                name: place.name,
                location: {
                    type: "Point",
                    coordinates: [
                        place.geometry.location.lng(),
                        place.geometry.location.lat(),
                    ],
                },
            });
        });
    }, []);

    return (
        <input
            ref={inputRef}
            placeholder={placeholder}
            className="w-full px-4 py-2 border rounded"
        />
    );
}
