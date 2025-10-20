import { BookingRequestData } from "@/apis/booking-request";
import { TripTicketData } from "@/apis/trip-ticket";
import { TripData } from "@/apis/trip";
import TicketOverview from "@/app/requester/bookings/ticket-overview";
import TripOverview from "@/app/driver/trips/trip-overview";
import SectionDivider from "@/components/section-divider";

interface BookingTripsProps {
	mobile?: boolean;
	coordinator?: boolean;
	bookingData: BookingRequestData;
	sortedTrips: TripTicketData[] | TripData[];
	filterByStatus?: boolean;
}

type StatusMapping = {
	[key: string]: string;
};

const STATUS_MAP: StatusMapping = {
	pending: "scheduling",
	cancelled: "cancelled",
	approved: "scheduled",
	completed: "completed",
};

export default function BookingTrips({
	mobile = false,
	coordinator = false,
	bookingData,
	sortedTrips,
	filterByStatus = false,
}: BookingTripsProps) {
	const getFilteredTrips = () => {
		if (!filterByStatus) {
			return sortedTrips;
		}

		const targetStatus = STATUS_MAP[bookingData.status];
		return sortedTrips.filter((trip: TripTicketData | TripData) => trip.status === targetStatus);
	};

	const shouldShowSimpleView = (bookingStatus: string, tripStatus: string): boolean => {
		return (
			(bookingStatus === "pending" && tripStatus === "scheduling") ||
			(bookingStatus === "cancelled" && tripStatus === "cancelled")
		);
	};

	const shouldShowFullView = (bookingStatus: string, tripStatus: string): boolean => {
		return (
			(bookingStatus === "approved" && tripStatus === "scheduled") ||
			(bookingStatus === "completed" && tripStatus === "completed")
		);
	};

	const renderTripComponent = (trip: TripTicketData | TripData) => {
		const { status: bookingStatus } = bookingData;
		const { status: tripStatus } = trip;

		// When filtering is disabled, always show the component
		if (!filterByStatus) {
			return coordinator ? (
				<TripOverview trip={trip as TripData} coordinator={coordinator} />
			) : (
				<TicketOverview trip={trip as TripTicketData} mobile={mobile} />
			);
		}

		// Original logic when filtering is enabled
		if (shouldShowSimpleView(bookingStatus, tripStatus)) {
			return coordinator ? (
				<TripOverview trip={trip as TripData} coordinator={coordinator} />
			) : (
				<TicketOverview trip={trip as TripTicketData} mobile={mobile} />
			);
		}

		if (shouldShowFullView(bookingStatus, tripStatus)) {
			return coordinator ? (
				<TripOverview trip={trip as TripData} coordinator={coordinator} />
			) : (
				<TicketOverview trip={trip as TripTicketData} mobile={mobile} />
			);
		}

		return null;
	};

	const renderTripWithDivider = (
		trip: TripTicketData | TripData,
		index: number,
		filteredTrips: (TripTicketData | TripData)[],
	) => {
		const shouldShowDivider = sortedTrips.length === 2 && filteredTrips.length === 2 && index === 0;

		return (
			<div key={trip.id}>
				{renderTripComponent(trip)}
				{shouldShowDivider && (
					<div className="my-4">
						<SectionDivider title="Return Trip" />
					</div>
				)}
			</div>
		);
	};

	const filteredTrips = getFilteredTrips();

	return (
		<div className="flex-1 space-y-4">
			{filteredTrips.length === 0 ? (
				<p className="text-center text-gray-500">No trips available for this booking yet.</p>
			) : (
				filteredTrips.map((trip, index) => renderTripWithDivider(trip, index, filteredTrips))
			)}
		</div>
	);
}
