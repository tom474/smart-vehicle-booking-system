"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Car, ClockAlert, ClockFading, MapPin, MapPinCheck, Text, ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";
import SectionDivider from "@/components/section-divider";
import Spinner from "@/components/spinner";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";

import ContactPointField from "@/app/requester/create-booking/_form-components/contact-point";
import PassengerSection from "@/app/requester/create-booking/_form-components/passenger";
import TripTypeSection from "@/app/requester/create-booking/_form-components/trip-type";
import PrioritySection from "@/app/requester/create-booking/_form-components/priority";
import TextInputField from "@/app/requester/create-booking/_form-components/text-input";
import LocationButton from "@/app/requester/create-booking/_form-components/location-button";
import SelectLocation from "@/app/requester/create-booking/_form-components/select-location";
import DateTimeField from "@/app/requester/create-booking/_form-components/date-time";
import CarReserveSection from "@/app/requester/create-booking/_form-components/car-reserve";
import AssignVehicle from "@/app/requester/bookings/_components/assign-vehicle";

import StatusBadge from "@/components/status-badge";
import { TripType, LocationFieldType, LocationSchema, fieldMap } from "@/apis/location";
import { getBookingRequest, BookingRequestSchema, BookingRequestData } from "@/apis/booking-request";
import { UserTokenData } from "@/apis/user";
import { getUserFromToken } from "@/lib/utils";
import { getTripTickets, TripTicketData } from "@/apis/trip-ticket";
import { getTrips, TripData } from "@/apis/trip";
import CancelDialog from "@/app/requester/bookings/_components/cancel-dialog";
import ModifyDialog from "@/app/requester/bookings/_components/modify-dialog";
import BookingTrips from "@/app/requester/bookings/_components/booking-trips";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LocationData } from "@/apis/location";

interface BookingDetailsProps {
	bookingId: number | string;
	booking?: BookingRequestData;
	trigger?: React.ReactNode;
	mobile?: boolean;
	openInitially?: boolean;
	onBookingChange?: () => void | Promise<void>;
	coordinator?: boolean;
}

export default function BookingDetails({
	bookingId,
	booking,
	trigger,
	mobile = true,
	openInitially = false,
	onBookingChange,
	coordinator = false,
}: BookingDetailsProps) {
	const [isSheetOpen, setIsSheetOpen] = useState(openInitially);

	return (
		<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
			{trigger && <SheetTrigger className="w-full">{trigger}</SheetTrigger>}
			<SheetContent
				className={`[&>button]:hidden ${
					mobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl"
				}`}
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<SheetHeader className="hidden">
					<SheetTitle>Booking Details</SheetTitle>
					<SheetDescription>View Previous Created Booking</SheetDescription>
				</SheetHeader>
				<BookingDetailsSheet
					bookingId={bookingId}
					booking={booking}
					mobile={mobile}
					setIsSheetOpen={setIsSheetOpen}
					onBookingChange={onBookingChange}
					coordinator={coordinator}
				/>
			</SheetContent>
		</Sheet>
	);
}

function BookingDetailsHeader({ bookingId }: { bookingId?: number | string }) {
	const t = useTranslations("RequesterBookings.bookingForm");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<p className="text-subtitle-1">
				{t("booking")} #{bookingId}
			</p>
			<div className="size-6"></div>
		</div>
	);
}

interface BookingDetailsSheetProps {
	className?: string;
	bookingId: number | string;
	booking?: BookingRequestData;
	mobile?: boolean;
	coordinator?: boolean;
	modify?: boolean;
	onCancel?: () => void;
	setIsSheetOpen?: (isOpen: boolean) => void;
	onBookingChange?: () => void | Promise<void>;
}

export function BookingDetailsSheet({
	className,
	bookingId,
	booking,
	mobile = true,
	setIsSheetOpen,
	onBookingChange,
	coordinator = false,
	modify = true,
	onCancel: onPropCancel,
}: BookingDetailsSheetProps) {
	const t = useTranslations("RequesterBookings.bookingForm");
	const user = getUserFromToken() as UserTokenData;
	const [isValid, setIsValid] = useState(true);
	const [timeValidMessage, setTimeValidMessage] = useState<string>("");

	const [disableFields, setDisableFields] = useState(true);
	const [tab, setTab] = useState("trips");

	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [bookingData, setBookingData] = useState<BookingRequestData>();
	const [sortedTrips, setSortedTrips] = useState<TripTicketData[] | TripData[]>([]);

	const [isSelectLocation, setIsSelectLocation] = useState(false);
	const [selectedTripType, setSelectedTripType] = useState<TripType>();
	const [currentLocationField, setCurrentLocationField] = useState<LocationFieldType>("departureLocation");

	// Define which location fields should be restricted to fixed locations only
	const fixedLocationFields: LocationFieldType[] = [
		// "departureLocation",
		// "arrivalLocation",
		// "returnDepartureLocation",
		// "returnArrivalLocation",
	];

	// Helper function to check if current field should be restricted to fixed locations
	const isFixedLocationField = (fieldType: LocationFieldType): boolean => {
		return fixedLocationFields.includes(fieldType);
	};

	const form = useForm<BookingRequestData>({
		resolver: zodResolver(BookingRequestSchema),
		defaultValues: bookingData,
	});

	useEffect(() => {
		if (modify) {
			setDisableFields(false);
			if (modify) {
				setTab("details");
			}
		}
	}, [modify]);

	const fetchBookingData = async () => {
		setIsLoading(true);
		// Fetch booking data if not provided
		if (!booking) {
			try {
				const data = await getBookingRequest(bookingId);
				setBookingData(data);
				if (data && data.status !== "pending") {
					setDisableFields(true);
				}
				let trips: TripTicketData[] | TripData[] = [];
				if (coordinator) {
					trips = await getTrips({ bookingRequestId: data.id });
				} else {
					trips = await getTripTickets({
						userId: data.requesterId,
						bookingRequestId: data.id,
					});
				}
				const _sortedTrips = trips.sort(
					(a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
				);
				setSortedTrips(_sortedTrips || []);
			} catch (error) {
				console.error("Failed to fetch booking:", error);
			} finally {
				setIsLoading(false);
			}
		} else {
			setBookingData(booking);
			if (booking.status !== "pending") {
				setDisableFields(true);
			}
			let trips: TripTicketData[] | TripData[] = [];
			if (coordinator) {
				trips = await getTrips({ bookingRequestId: booking.id });
			} else {
				trips = await getTripTickets({
					userId: booking.requesterId,
					bookingRequestId: booking.id,
				});
			}
			const _sortedTrips = trips.sort(
				(a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
			);
			setSortedTrips(_sortedTrips || []);
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchBookingData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [booking, bookingId, coordinator]);

	useEffect(() => {
		if (bookingData) {
			if (modify) {
				setTab("details");
			}
			if (bookingData.status === "approved") {
				setTab("trips");
			}
			setSelectedTripType(bookingData.type as TripType);
			form.reset(bookingData);
		}
	}, [bookingData, form, modify]);

	const onTabChange = (value: string) => {
		setTab(value);
	};

	const handleLocationSelect = (location: {
		type: "fixed" | "custom";
		latitude: number;
		longitude: number;
		id?: string;
		name?: string;
		address?: string;
	}) => {
		form.setValue(fieldMap[currentLocationField], LocationSchema.parse(location));
	};

	const openLocationSelector = (locationType: LocationFieldType) => {
		setCurrentLocationField(locationType);
		setIsSelectLocation(true);
	};

	if (isLoading || !bookingData) {
		return (
			<div className="flex flex-col w-full h-screen p-4">
				<BookingDetailsHeader />
				<div className="flex flex-col items-center justify-center w-full h-screen">
					<Spinner />
				</div>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col w-full h-screen p-4", className)}>
			<BookingDetailsHeader bookingId={bookingData.id} />

			{/* Status */}
			<div className="flex flex-row items-center justify-center w-full gap-2 mt-2">
				<span className="text-md text-muted-foreground">{t("status")}:</span>
				<StatusBadge status={bookingData.status} />
			</div>

			<Form {...form}>
				<div className="flex flex-col justify-between h-full pt-2">
					<Tabs value={tab} onValueChange={onTabChange} className="h-full">
						<TabsList className="w-full my-1 bg-background">
							<TabsTrigger
								value="trips"
								className="data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:font-semibold data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0"
								disabled={!isValid}
							>
								{t("tabs.trips")}
							</TabsTrigger>
							<TabsTrigger
								value="details"
								className="data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:font-semibold data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0"
								disabled={!isValid}
							>
								{t("tabs.details")}
							</TabsTrigger>
							<TabsTrigger
								value="location"
								className="data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:font-semibold data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0"
								disabled={!isValid}
							>
								{t("tabs.location")}
							</TabsTrigger>
							<TabsTrigger
								value="time"
								className="data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:font-semibold data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0"
								disabled={
									!isValid ||
									!form.getValues("departureLocation") ||
									!form.getValues("arrivalLocation") ||
									(selectedTripType === TripType.RoundTrip &&
										(!form.getValues("returnDepartureLocation") ||
											!form.getValues("returnArrivalLocation")))
								}
							>
								{t("tabs.time")}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="trips" className="flex flex-col justify-between w-full h-full gap-4">
							{coordinator && booking && booking.status === "pending" && (
								<AssignVehicle
									bookingRequestId={booking.id}
									onTripChange={fetchBookingData}
									mobile={mobile}
								/>
							)}
							<BookingTrips
								mobile={mobile}
								coordinator={coordinator}
								bookingData={bookingData}
								sortedTrips={sortedTrips}
							/>
						</TabsContent>
						<TabsContent value="details" className="flex flex-col justify-between w-full h-full">
							<div className="flex-1 space-y-2">
								<ContactPointField form={form} setIsValid={setIsValid} disabled={disableFields} />

								<PassengerSection
									form={form}
									disabled={disableFields}
									mobile={mobile}
									coordinator={coordinator}
								/>

								<TripTypeSection
									form={form}
									setSelectedTripType={setSelectedTripType}
									disabled={true}
								/>

								{selectedTripType === TripType.RoundTrip && (
									<CarReserveSection form={form} disabled={true} />
								)}

								<PrioritySection form={form} disabled={true} />

								<TextInputField
									form={form}
									name="tripPurpose"
									placeholder={t("form.tripPurpose")}
									icon={Car}
									setIsValid={setIsValid}
									disabled={disableFields}
									overridePlaceholder={t("form.tripPurposeRequired")}
								/>

								<TextInputField
									form={form}
									name="note"
									placeholder={t("form.note")}
									icon={Text}
									disabled={disableFields}
								/>
							</div>
						</TabsContent>
						<TabsContent value="location" className="flex flex-col justify-between w-full h-full">
							<div className="flex-1 space-y-2">
								<LocationButton
									icon={MapPin}
									label={t("form.pickUp")}
									address={form.watch("departureLocation")?.address}
									onClick={() => openLocationSelector("departureLocation")}
									disabled={disableFields}
									coordinator={coordinator}
								/>

								<LocationButton
									icon={MapPinCheck}
									label={t("form.destination")}
									address={form.watch("arrivalLocation")?.address}
									onClick={() => openLocationSelector("arrivalLocation")}
									disabled={disableFields}
									coordinator={coordinator}
								/>

								{/* Round Trip Section */}
								{selectedTripType === TripType.RoundTrip && (
									<>
										<SectionDivider title={t("returnTrip")} />

										<LocationButton
											icon={MapPin}
											label={t("form.pickUp")}
											address={form.watch("returnDepartureLocation")?.address}
											onClick={() => openLocationSelector("returnDepartureLocation")}
											disabled={disableFields}
											coordinator={coordinator}
										/>

										<LocationButton
											icon={MapPinCheck}
											label={t("form.destination")}
											address={form.watch("returnArrivalLocation")?.address}
											onClick={() => openLocationSelector("returnArrivalLocation")}
											disabled={disableFields}
											coordinator={coordinator}
										/>
									</>
								)}
							</div>
						</TabsContent>
						<TabsContent value="time" className="flex flex-col justify-between w-full h-full">
							<div className="flex-1 space-y-2">
								<DateTimeField
									form={form}
									name="departureTime"
									label={t("form.preferredDeparture")}
									icon={ClockFading}
									disabled={disableFields}
									setTimeValidMessage={setTimeValidMessage}
								/>

								<DateTimeField
									form={form}
									name="arrivalTime"
									label={t("form.arrivalDeadline")}
									icon={ClockAlert}
									disabled={disableFields}
									setTimeValidMessage={setTimeValidMessage}
								/>

								{timeValidMessage && (
									<p className="w-full text-red-600 text-caption text-end">{timeValidMessage}</p>
								)}

								{/* Round Trip Section */}
								{selectedTripType === TripType.RoundTrip && (
									<>
										<SectionDivider title={t("returnTrip")} />

										<DateTimeField
											form={form}
											name="returnDepartureTime"
											label={t("form.preferredDeparture")}
											icon={ClockFading}
											disabled={disableFields}
											setTimeValidMessage={setTimeValidMessage}
										/>

										<DateTimeField
											form={form}
											name="returnArrivalTime"
											label={t("form.arrivalDeadline")}
											icon={ClockAlert}
											disabled={disableFields}
											setTimeValidMessage={setTimeValidMessage}
										/>

										{timeValidMessage && (
											<p className="w-full text-red-600 text-caption text-end">
												{timeValidMessage}
											</p>
										)}
									</>
								)}
							</div>
						</TabsContent>

						{bookingData.requesterId !== user.id && bookingData.passengerIds?.includes(user.id) && (
							<div className="w-full mb-2 font-medium text-center text-caption text-muted-foreground">
								You are a passenger in this booking.
							</div>
						)}
						<div className="flex flex-row gap-1">
							{bookingData.status === "pending" &&
								!disableFields &&
								(bookingData.requesterId === user.id || coordinator) && (
									<>
										<CancelDialog
											onBookingChange={onBookingChange}
											bookingData={bookingData}
											setBookingData={setBookingData}
											setIsSheetOpen={setIsSheetOpen}
											onPropCancel={onPropCancel}
											isProcessing={isProcessing}
											setIsProcessing={setIsProcessing}
											disabled={!isValid || timeValidMessage !== ""}
										/>
										<ModifyDialog
											form={form}
											setBookingData={setBookingData}
											bookingData={bookingData}
											onBookingChange={onBookingChange}
											setIsSheetOpen={setIsSheetOpen}
											isProcessing={isProcessing}
											setIsProcessing={setIsProcessing}
											disabled={!isValid || timeValidMessage !== ""}
										/>
									</>
								)}
						</div>
					</Tabs>
					{isSelectLocation && (
						<div
							className={`fixed bottom-0 right-0 flex flex-col w-full h-screen overflow-hidden z-999 ${mobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl"}`}
						>
							<SelectLocation
								mobile={mobile}
								setIsSelectLocation={setIsSelectLocation}
								onLocationSelect={handleLocationSelect}
								locationType={currentLocationField}
								fixedLocationsOnly={isFixedLocationField(currentLocationField)}
								initialLocation={form.getValues(fieldMap[currentLocationField]) as LocationData}
								coordinator={coordinator}
							/>
						</div>
					)}
				</div>
			</Form>
		</div>
	);
}
