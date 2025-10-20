import { useState, useEffect, useRef } from "react";
import { LocationData } from "@/apis/location";

export const AddressComponent = ({
	location,
	onClampDetected,
}: {
	location: LocationData;
	onClampDetected: (isClamped: boolean) => void;
}) => {
	const textRef = useRef<HTMLSpanElement>(null);
	const [hasChecked, setHasChecked] = useState(false);

	useEffect(() => {
		const element = textRef.current;
		if (element && !hasChecked) {
			const timeoutId = setTimeout(() => {
				const isTextClamped = element.scrollHeight > element.clientHeight;
				onClampDetected(isTextClamped);
				setHasChecked(true);
			}, 0);

			return () => clearTimeout(timeoutId);
		}
	}, [onClampDetected, hasChecked]);

	// Reset hasChecked when address changes
	useEffect(() => {
		setHasChecked(false);
	}, [location.address, location.name]);

	return (
		<div className="break-words">
			{location.address ? (
				<span ref={textRef} className="line-clamp-2">
					{location.address}
				</span>
			) : (
				<span ref={textRef} className="line-clamp-2">
					{location.name}
				</span>
			)}
		</div>
	);
};
