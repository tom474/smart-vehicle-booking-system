import TicketOverview from "@/app/requester/bookings/ticket-overview";
import { TripTicketData } from "@/apis/trip-ticket";
import Spinner from "@/components/spinner";
import { useTranslations } from "next-intl";

interface TripSectionProps {
	trips: TripTicketData[];
	mobile?: boolean;
	isLoading?: boolean;
	onBookingChange?: () => void | Promise<void>;
	translationKey: "RequesterHome.upcomingTrips" | "RequesterHome.schedulingTrips" | "RequesterHome.recentTrips";
	customRenderTrip?: (trip: TripTicketData) => React.ReactNode;
}

function TripSection({
	trips,
	mobile = false,
	isLoading = false,
	onBookingChange,
	translationKey,
	customRenderTrip,
}: TripSectionProps) {
	const t = useTranslations(translationKey);

	const renderTrip = (trip: TripTicketData) => {
		if (customRenderTrip) {
			return customRenderTrip(trip);
		}
		return (
			<TicketOverview key={trip.id} trip={trip} mobile={mobile} home={true} onBookingChange={onBookingChange} />
		);
	};

	const content = (
		<>
			{isLoading && (
				<div className="flex items-center justify-center w-full h-full">
					<Spinner />
				</div>
			)}
			{!isLoading && (
				<>
					{trips.map(renderTrip)}
					{!trips.length && (
						<div className="flex items-center justify-center w-full h-full">
							<p className="text-center text-muted-foreground">{t("noTrips")}</p>
						</div>
					)}
				</>
			)}
		</>
	);

	if (mobile) {
		return (
			<div className="flex-1 w-full min-w-0 min-h-0 p-4 pb-0 space-y-4 overflow-y-auto">
				<h1 className="text-headline-3">{t("title")}</h1>
				<div className="space-y-6">{content}</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full max-h-full overflow-hidden rounded-lg bg-background">
			<h1 className="flex-shrink-0 w-full p-6 pb-0 text-headline-2">{t("title")}</h1>
			<div className="flex-1 min-h-0 p-6 pt-4 overflow-y-auto custom-scrollbar">
				<div className="space-y-4">{content}</div>
			</div>
		</div>
	);
}

export function UpcomingTrips({
	upcomingTrips = [],
	mobile = false,
	isLoading = false,
	onBookingChange,
}: {
	upcomingTrips: TripTicketData[];
	mobile?: boolean;
	isLoading?: boolean;
	onBookingChange?: () => void | Promise<void>;
}) {
	return (
		<TripSection
			trips={upcomingTrips}
			mobile={mobile}
			isLoading={isLoading}
			onBookingChange={onBookingChange}
			translationKey="RequesterHome.upcomingTrips"
		/>
	);
}

export function PendingRequests({
	pendingRequests = [],
	mobile = false,
	isLoading = false,
	onBookingChange,
}: {
	pendingRequests: TripTicketData[];
	mobile?: boolean;
	isLoading?: boolean;
	onBookingChange?: () => void | Promise<void>;
}) {
	return (
		<TripSection
			trips={pendingRequests}
			mobile={mobile}
			isLoading={isLoading}
			onBookingChange={onBookingChange}
			translationKey="RequesterHome.schedulingTrips"
		/>
	);
}

export function RecentTrips({
	recentTrips = [],
	mobile = false,
	isLoading = false,
	onBookingChange,
}: {
	recentTrips: TripTicketData[];
	mobile?: boolean;
	isLoading?: boolean;
	onBookingChange?: () => void | Promise<void>;
}) {
	const customRenderTrip = (trip: TripTicketData) => (
		<TicketOverview key={trip.id} trip={trip} mobile={mobile} home={true} onBookingChange={onBookingChange} />
	);

	return (
		<TripSection
			trips={recentTrips}
			mobile={mobile}
			isLoading={isLoading}
			onBookingChange={onBookingChange}
			translationKey="RequesterHome.recentTrips"
			customRenderTrip={customRenderTrip}
		/>
	);
}
