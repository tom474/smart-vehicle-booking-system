import { useState, useEffect } from "react";

export default function StopConnector({
	isFirst,
	isLast,
	hasActualArrival,
	addressIsClamped,
	isCurrentStop,
}: {
	isFirst: boolean;
	isLast: boolean;
	hasActualArrival?: boolean;
	addressIsClamped?: boolean;
	isCurrentStop?: boolean;
}) {
	const [lineHeight, setLineHeight] = useState(62);

	useEffect(() => {
		let baseHeight = 62; // Base height in pixels

		if (hasActualArrival) {
			baseHeight += 20; // Increase height for completed stops
		}

		if (addressIsClamped) {
			baseHeight -= 20; // Reduce height for clamped address
		}

		setLineHeight(baseHeight);
	}, [hasActualArrival, addressIsClamped]);

	const getDotColor = () => {
		if (hasActualArrival) {
			return "bg-green-500"; // Completed stops are green
		}
		if (isCurrentStop) {
			return "bg-red-500"; // Current/next stop is red
		}
		if (isFirst) {
			return "bg-blue-500"; // First stop (if not current) is blue
		}
		return "bg-gray-400"; // Future stops are gray
	};

	return (
		<div className="relative flex flex-col items-center flex-shrink-0 min-h-full">
			<div className={`size-4 mt-1 rounded-full relative z-10 ${getDotColor()}`} />
			{!isLast && <div className="w-0.5 bg-gray-300 mt-2" style={{ height: `${lineHeight}px` }} />}
		</div>
	);
}
