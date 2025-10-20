import { useState, useEffect, useRef } from "react";
import { StopData } from "@/apis/stop";

export const AddressComponent = ({
	stop,
	onClampDetected,
}: {
	stop: StopData;
	onClampDetected: (isClamped: boolean) => void;
}) => {
	const textRef = useRef<HTMLSpanElement>(null);
	const [hasChecked, setHasChecked] = useState(false);

	useEffect(() => {
		const element = textRef.current;
		if (element && !hasChecked) {
			// Use setTimeout to ensure the element is fully rendered
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
	}, [stop.location.address, stop.location.name]);

	return (
		<div className="break-words">
			{stop.location.address ? (
				<span ref={textRef} className="line-clamp-2">
					{stop.location.address}
				</span>
			) : (
				<span ref={textRef} className="line-clamp-2">
					{stop.location.name}
				</span>
			)}
		</div>
	);
};

export const handleClampDetected = (
	setAddressClampedStates: React.Dispatch<React.SetStateAction<boolean[]>>,
	index: number,
	isClamped: boolean,
) => {
	setAddressClampedStates((prev) => {
		const newStates = [...prev];
		newStates[index] = isClamped;
		return newStates;
	});
};
