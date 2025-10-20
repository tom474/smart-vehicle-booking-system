"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, ClockAlert, ClockFading, MapPin, MapPinCheck, Text, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import SectionDivider from "@/components/section-divider";

import { TripType, LocationFieldType, LocationSchema, fieldMap } from "@/apis/location";
import { BookingRequestSchema, BookingRequestData, createBookingRequest } from "@/apis/booking-request";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import BookingDetails from "@/app/requester/bookings/booking-details";
import { useTranslations } from "next-intl";
import { cn, getUserFromCookie } from "@/lib/utils";
import { calculateTravelTime } from "@/lib/google-map";
import { format } from "date-fns";
import { apiErrHandler } from "@/lib/error-handling";

interface CreateBookingProps {
	mobile?: boolean;
	button?: boolean;
	onBookingChange?: () => void | Promise<void>;
	coordinator?: boolean;
}

export default function CreateBooking({ mobile, button, onBookingChange, coordinator = false }: CreateBookingProps) {
	const t = useTranslations("RequesterBookings");

	const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
	const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
	const [submittedBookingId, setsubmittedBookingId] = useState<number | string>();

	const handleBookingCreated = async (bookingId: number | string) => {
		setIsCreateSheetOpen(false);
		setsubmittedBookingId(bookingId);
		setIsDetailsSheetOpen(true);
	};

	return (
		<>
			<Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
				<SheetTrigger asChild>
					{button ? (
						<Button className="flex-1 bg-success hover:bg-success/90">
							{t("bookingForm.createNewBooking")}
						</Button>
					) : (
						<Button className="fixed z-10 ml-auto rounded-full bottom-20 right-4 bg-success size-10">
							<Plus className="size-6" />
						</Button>
					)}
				</SheetTrigger>
				<SheetContent
					className={`[&>button]:hidden ${
						mobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl"
					}`}
					onInteractOutside={(e) => e.preventDefault()}
					onEscapeKeyDown={(e) => e.preventDefault()}
				>
					<SheetHeader className="hidden">
						<SheetTitle>Create Booking</SheetTitle>
						<SheetDescription>Create New Booking</SheetDescription>
					</SheetHeader>
					<CreateForm
						mobile={mobile}
						onBookingCreated={async (bookingId: number | string) => {
							if (onBookingChange) {
								await onBookingChange();
							}
							await handleBookingCreated(bookingId);
						}}
					/>
				</SheetContent>
			</Sheet>

			{isDetailsSheetOpen && submittedBookingId && (
				<BookingDetails
					bookingId={submittedBookingId}
					mobile={mobile}
					openInitially={isDetailsSheetOpen}
					coordinator={coordinator}
					onBookingChange={onBookingChange}
				/>
			)}
		</>
	);
}

function FormHeader() {
	const t = useTranslations("RequesterBookings");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<div className="text-headline-3">{t("bookingForm.requestNewBooking")}</div>
			<div className="size-6"></div>
		</div>
	);
}

interface CreateFormProps {
	mobile?: boolean;
	coordinator?: boolean;
	onBookingCreated?: (bookingId: number | string) => void | Promise<void>;
	className?: string;
	setIsSheetOpen?: (open: boolean) => void;
}

export function CreateForm({
	mobile,
	coordinator = false,
	onBookingCreated,
	className,
	setIsSheetOpen,
}: CreateFormProps) {
	const t = useTranslations("RequesterBookings");
	const router = useRouter();

	const [isSelectLocation, setIsSelectLocation] = useState(false);
	const [selectedTripType, setSelectedTripType] = useState<TripType>(TripType.OneWay);
	const [currentLocationField, setCurrentLocationField] = useState<LocationFieldType>("departureLocation");
	const [isValid, setIsValid] = useState(true);
	const [timeValidMessage, setTimeValidMessage] = useState<string>("");
	const [returnTimeValidMessage, setReturnTimeValidMessage] = useState<string>("");
	const [tab, setTab] = useState("details");

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

	const onTabChange = (value: string) => {
		setTab(value);
	};

	const form = useForm<BookingRequestData>({
		resolver: zodResolver(BookingRequestSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			id: "",
			status: "pending",
			requesterId: "",
			contactName: "",
			contactPhoneNumber: "",
			type: TripType.OneWay,
			isReserved: false,
			priority: "normal",
			numberOfPassengers: 1,
			passengerIds: [""],
			tripPurpose: "",
			note: "",
			departureLocation: undefined,
			arrivalLocation: undefined,
			departureTime: undefined,
			arrivalTime: undefined,
			returnDepartureLocation: undefined,
			returnArrivalLocation: undefined,
			returnDepartureTime: undefined,
			returnArrivalTime: undefined,
		},
	});

	useEffect(() => {
		const user = getUserFromCookie();
		if (user) {
			// Reset form with user data after currentUser is loaded
			form.reset({
				id: "",
				status: "pending",
				requesterId: user.id || "",
				contactName: user.name || "",
				contactPhoneNumber: user.phoneNumber || "",
				type: TripType.OneWay,
				isReserved: false,
				priority: "normal",
				numberOfPassengers: 1,
				passengerIds: [user.id || ""],
				tripPurpose: "",
				note: "",
				departureLocation: undefined,
				arrivalLocation: undefined,
				departureTime: undefined,
				arrivalTime: undefined,
				returnDepartureLocation: undefined,
				returnArrivalLocation: undefined,
				returnDepartureTime: undefined,
				returnArrivalTime: undefined,
			});
		} else {
			console.error("No user found in token");
		}
	}, [form]);

	// check travel time validity before submit
	async function checkTravelTimeValidity() {
		let valid = true;
		const departureLocation = form.getValues("departureLocation");
		const arrivalLocation = form.getValues("arrivalLocation");
		const departureTime = form.getValues("departureTime");
		const arrivalTime = form.getValues("arrivalTime");

		if (departureLocation && arrivalLocation && departureTime && arrivalTime) {
			const oneWayTravelTime = await calculateTravelTime(
				{
					latitude: departureLocation.latitude,
					longitude: departureLocation.longitude,
				},
				{
					latitude: arrivalLocation.latitude,
					longitude: arrivalLocation.longitude,
				},
			);
			const departure = new Date(departureTime);
			const arrival = new Date(arrivalTime);
			const diffInMinutes = (arrival.getTime() - departure.getTime()) / 60000;
			const now = new Date();
			const oneHourFromNow = new Date(now.getTime() + 60 * 60000); // 1 hour from now

			if (oneWayTravelTime === null) {
				toast.error(t("bookingForm.form.timeValidattion.locationUnableToCalculate"));
				valid = false;
			}
			if (diffInMinutes < oneWayTravelTime) {
				// Calculate the new departure time to meet minimum travel time requirement
				const newDepartureTime = new Date(arrival.getTime() - oneWayTravelTime * 60000);

				// Check if adjusted departure time is less than 1 hour from now
				if (newDepartureTime < oneHourFromNow) {
					// Adjust arrival time instead
					const newArrivalTime = new Date(departure.getTime() + oneWayTravelTime * 60000);
					form.setValue("arrivalTime", newArrivalTime);
					toast.info(
						`${t("bookingForm.form.timeValidattion.minimumTravelTimeArrival")} ${format(newArrivalTime, "MM/dd/yyyy hh:mm aa")}`,
					);
				} else {
					// Adjust departure time as originally intended
					form.setValue("departureTime", newDepartureTime);
					toast.info(
						`${t("bookingForm.form.timeValidattion.minimumTravelTimeDeparture")} ${format(newDepartureTime, "MM/dd/yyyy hh:mm aa")}`,
					);
				}
				valid = false;
			}
		}

		if (selectedTripType === TripType.RoundTrip) {
			const returnDepartureLocation = form.getValues("returnDepartureLocation");
			const returnArrivalLocation = form.getValues("returnArrivalLocation");
			const returnDepartureTime = form.getValues("returnDepartureTime");
			const returnArrivalTime = form.getValues("returnArrivalTime");

			if (returnDepartureLocation && returnArrivalLocation && returnDepartureTime && returnArrivalTime) {
				const returnTravelTime = await calculateTravelTime(
					{
						latitude: returnDepartureLocation.latitude,
						longitude: returnDepartureLocation.longitude,
					},
					{
						latitude: returnArrivalLocation.latitude,
						longitude: returnArrivalLocation.longitude,
					},
				);
				const returnDeparture = new Date(returnDepartureTime);
				const returnArrival = new Date(returnArrivalTime);
				const returnDiffInMinutes = (returnArrival.getTime() - returnDeparture.getTime()) / 60000;
				const now = new Date();
				const oneHourFromNow = new Date(now.getTime() + 60 * 60000); // 1 hour from now

				if (returnTravelTime === null) {
					toast.error(t("bookingForm.form.timeValidattion.locationUnableToCalculate"));
					valid = false;
				}
				if (returnDiffInMinutes < returnTravelTime) {
					// Calculate the new return departure time to meet minimum travel time requirement
					const newReturnDepartureTime = new Date(returnArrival.getTime() - returnTravelTime * 60000);

					// Check if adjusted return departure time is less than 1 hour from now
					if (newReturnDepartureTime < oneHourFromNow) {
						// Adjust return arrival time instead
						const newReturnArrivalTime = new Date(returnDeparture.getTime() + returnTravelTime * 60000);
						form.setValue("returnArrivalTime", newReturnArrivalTime);
						toast.info(
							`${t("bookingForm.form.timeValidattion.minimumReturnTravelTimeArrival")} ${format(newReturnArrivalTime, "MM/dd/yyyy hh:mm aa")}`,
						);
					} else {
						// Adjust return departure time as originally intended
						form.setValue("returnDepartureTime", newReturnDepartureTime);
						toast.info(
							`${t("bookingForm.form.timeValidattion.minimumReturnTravelTimeDeparture")} ${format(newReturnDepartureTime, "MM/dd/yyyy hh:mm aa")}`,
						);
					}
					valid = false;
				}
			}
		}

		if (!valid) {
			return false;
		}
		setTimeValidMessage("");
		return true;
	}

	const onSubmit = async (data: BookingRequestData) => {
		try {
			const valid = await checkTravelTimeValidity();
			if (!valid) {
				// If there's a time validity message, do not proceed with submission
				return;
			}
			console.log("Submitting booking request with data:", data);
			const createdBooking = await createBookingRequest(data);
			toast.success(t("bookingForm.toast.success"));
			if (onBookingCreated) {
				await onBookingCreated(createdBooking[0].id);
			}
			if (coordinator) {
				router.refresh();
			}
			if (setIsSheetOpen) {
				setIsSheetOpen(false);
			}
		} catch (error) {
			const apiErr = apiErrHandler(error);
			if (apiErr) {
				toast.error(apiErr);
			} else {
				toast.error(t("bookingForm.toast.error"));
			}
		}
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

		// Auto-fill return trip locations for round trips
		if (currentLocationField === "departureLocation") {
			// When departure location is selected, set it as return arrival location
			form.setValue("returnArrivalLocation", LocationSchema.parse(location));
		} else if (currentLocationField === "arrivalLocation") {
			// When arrival location is selected, set it as return departure location
			form.setValue("returnDepartureLocation", LocationSchema.parse(location));
		}
	};

	const openLocationSelector = (locationType: LocationFieldType) => {
		setCurrentLocationField(locationType);
		setIsSelectLocation(true);
	};

	return (
		<div className={cn("flex flex-col w-full h-screen p-4", className)}>
			<FormHeader />

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col justify-between h-full pt-2">
					<Tabs value={tab} onValueChange={onTabChange} className="h-full">
						<TabsList className="w-full my-1 bg-background">
							<TabsTrigger
								value="details"
								className="data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:font-semibold data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0"
								disabled={!isValid}
							>
								{t("bookingForm.tabs.details")}
							</TabsTrigger>
							<TabsTrigger
								value="location"
								className="data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:font-semibold data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0"
								disabled={!isValid}
							>
								{t("bookingForm.tabs.location")}
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
								{t("bookingForm.tabs.time")}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="details" className="flex flex-col justify-between w-full h-full">
							<div className="flex-1 space-y-2">
								<ContactPointField form={form} setIsValid={setIsValid} />

								<PassengerSection form={form} mobile={mobile} />

								<TripTypeSection form={form} setSelectedTripType={setSelectedTripType} />

								{selectedTripType === TripType.RoundTrip && <CarReserveSection form={form} />}

								<PrioritySection form={form} />

								<TextInputField
									form={form}
									name="tripPurpose"
									placeholder={t("bookingForm.form.tripPurpose")}
									icon={Car}
									setIsValid={setIsValid}
									overridePlaceholder={t("bookingForm.form.tripPurposeRequired")}
								/>

								<TextInputField
									form={form}
									name="note"
									placeholder={t("bookingForm.form.note")}
									icon={Text}
								/>
							</div>
							<div>
								<Button
									variant="default"
									className="w-full bg-success hover:bg-success/90"
									type="button"
									onClick={() => setTab("location")}
									disabled={!isValid}
								>
									{t("bookingForm.next")}
								</Button>
							</div>
						</TabsContent>
						<TabsContent value="location" className="flex flex-col justify-between w-full h-full">
							<div className="flex-1 space-y-2">
								<LocationButton
									icon={MapPin}
									label={t("bookingForm.form.pickUp")}
									address={form.watch("departureLocation")?.address}
									onClick={() => openLocationSelector("departureLocation")}
								/>

								<LocationButton
									icon={MapPinCheck}
									label={t("bookingForm.form.destination")}
									address={form.watch("arrivalLocation")?.address}
									onClick={() => openLocationSelector("arrivalLocation")}
								/>

								{/* Round Trip Section */}
								{selectedTripType === TripType.RoundTrip && (
									<>
										<SectionDivider title={t("bookingForm.returnTrip")} />

										<LocationButton
											icon={MapPin}
											label={t("bookingForm.form.pickUp")}
											address={form.watch("returnDepartureLocation")?.address}
											onClick={() => openLocationSelector("returnDepartureLocation")}
										/>

										<LocationButton
											icon={MapPinCheck}
											label={t("bookingForm.form.destination")}
											address={form.watch("returnArrivalLocation")?.address}
											onClick={() => openLocationSelector("returnArrivalLocation")}
										/>
									</>
								)}
							</div>
							<div className="flex flex-row gap-2">
								<Button
									variant="outline"
									className="flex-1 hover:bg-primary"
									type="button"
									onClick={() => setTab("details")}
									disabled={!isValid}
								>
									{t("bookingForm.back")}
								</Button>
								<Button
									variant="default"
									className="flex-1 bg-success hover:bg-success/90"
									type="button"
									onClick={() => setTab("time")}
									disabled={
										!isValid ||
										!form.getValues("departureLocation") ||
										!form.getValues("arrivalLocation") ||
										(selectedTripType === TripType.RoundTrip &&
											(!form.getValues("returnDepartureLocation") ||
												!form.getValues("returnArrivalLocation")))
									}
								>
									{t("bookingForm.next")}
								</Button>
							</div>
						</TabsContent>
						<TabsContent value="time" className="flex flex-col justify-between w-full h-full">
							<div className="flex-1 space-y-2">
								<DateTimeField
									form={form}
									name="departureTime"
									label={t("bookingForm.form.preferredDeparture")}
									icon={ClockFading}
									setTimeValidMessage={setTimeValidMessage}
								/>

								<DateTimeField
									form={form}
									name="arrivalTime"
									label={t("bookingForm.form.arrivalDeadline")}
									icon={ClockAlert}
									setTimeValidMessage={setTimeValidMessage}
								/>

								{timeValidMessage && (
									<p className="w-full text-red-600 text-caption text-end">{timeValidMessage}</p>
								)}

								{/* Round Trip Section */}
								{selectedTripType === TripType.RoundTrip && (
									<>
										<SectionDivider title="Return Trip" />

										<DateTimeField
											form={form}
											name="returnDepartureTime"
											label={t("bookingForm.form.preferredDeparture")}
											icon={ClockFading}
											setTimeValidMessage={setReturnTimeValidMessage}
										/>

										<DateTimeField
											form={form}
											name="returnArrivalTime"
											label={t("bookingForm.form.arrivalDeadline")}
											icon={ClockAlert}
											setTimeValidMessage={setReturnTimeValidMessage}
										/>

										{returnTimeValidMessage && (
											<p className="w-full text-red-600 text-caption text-end">
												{returnTimeValidMessage}
											</p>
										)}
									</>
								)}
							</div>
							<div className="flex flex-row gap-2">
								<Button
									variant="outline"
									className="flex-1 hover:bg-primary"
									type="button"
									onClick={() => setTab("location")}
									disabled={!isValid}
								>
									{t("bookingForm.back")}
								</Button>
								<Button
									variant="default"
									className="flex-1 bg-success hover:bg-success/90"
									type="button"
									onClick={() => {
										form.trigger().then(async (_isValid) => {
											if (!_isValid) {
												console.log("Form validation errors:", form.formState.errors);
												toast.error("Please fill in all required fields.");
												return;
											} else {
												form.handleSubmit(onSubmit)();
											}
										});
									}}
									disabled={
										form.formState.isSubmitting ||
										!isValid ||
										timeValidMessage !== "" ||
										returnTimeValidMessage !== "" ||
										!form.watch("departureLocation") ||
										!form.watch("arrivalLocation") ||
										!form.watch("departureTime") ||
										!form.watch("arrivalTime") ||
										(selectedTripType === TripType.RoundTrip &&
											(!form.watch("returnDepartureLocation") ||
												!form.watch("returnArrivalLocation") ||
												!form.watch("returnDepartureTime") ||
												!form.watch("returnArrivalTime")))
									}
								>
									{form.formState.isSubmitting
										? t("bookingForm.submitting")
										: t("bookingForm.submit")}
								</Button>
							</div>
						</TabsContent>
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
							/>
						</div>
					)}
				</form>
			</Form>
		</div>
	);
}
