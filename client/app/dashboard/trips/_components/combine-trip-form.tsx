import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Clock, Flag, NotebookPen } from "lucide-react";
import { useEffect, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWR from "swr";
import {
	type BookingRequestData,
	BookingRequestSchema,
	getBookingRequest,
	getBookingRequests,
} from "@/apis/booking-request";
import type { TripStopData } from "@/apis/stop";
import {
	type CreateCombinedTripData,
	CreateCombinedTripSchema,
	createCombineTrip,
	type TripData,
} from "@/apis/trip";
import { getVehicle, getVehicles, type VehicleData } from "@/apis/vehicle";
import { vehicleColumns } from "@/app/admin/vehicles/owned/_columns/vehicle";
import { ViewVehicle } from "@/app/admin/vehicles/owned/_components/vehicle-sheet";
import { BookingDetailsSheet } from "@/app/requester/bookings/booking-details";
import DateTimeField from "@/components/form-field/date-time";
import FieldSeparator from "@/components/form-field/field-separator";
import { DataSelector } from "@/components/selector/data-selector";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { mapParam } from "@/lib/build-query-param";
import { excludeActions } from "@/lib/columnsUtils";
import { bookingRequestColumns } from "../../bookings/_columns/requests";
import { TripStopsTimeline } from "./trip-stop-timeline";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CreateTripStopForm } from "./add-trip-stop";
import SheetForm from "@/components/dashboard-table/sheet-form";
import { visibilityState } from "@/components/dashboard-table/table-view";
import { apiErrHandler } from "@/lib/error-handling";

interface Props {
	data?: TripData;
}

export function CombineTripForm({ data }: Props) {
	const [open, setOpen] = useState(false);

	const [additionalTripStops, setAdditionalTripStops] = useState<
		TripStopData[]
	>([]);

	const router = useRouter();

	const t = useTranslations("Coordinator.trip");
	const tToast = useTranslations("Coordinator.trip.toast");

	const form = useForm<CreateCombinedTripData>({
		resolver: zodResolver(CreateCombinedTripSchema),
		defaultValues: {
			departureTime: data?.departureTime,
		},
	});

	const bookingIds = form.watch("bookingRequestIds");

	const onSubmit = (values: CreateCombinedTripData) => {
		console.log(values);
		toast.promise(createCombineTrip(values), {
			loading: tToast("combine.loading"),
			success: () => {
				router.refresh();
				return tToast("combine.success");
			},
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return tToast("combine.error");
			},
		});
	};

	return (
		<>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col h-full"
				>
					<FieldSeparator>
						{/* Departure Time */}
						<DateTimeField
							form={form}
							name="departureTime"
							icon={Clock}
							label={t("form.departureTime")}
						/>

						{/* Vehicle Selector */}
						<FormField
							control={form.control}
							name="vehicleId"
							render={({ field }) => (
								<FormItem className="w-full">
									<div className="flex flex-col items-start w-full gap-2 p-1">
										<FormLabel className="flex h-full">
											<Car />
											{t("form.vehicle")}
										</FormLabel>
										<FormControl>
											<DataSelector
												targetData="Vehicle"
												label="Add Vehicle"
												columns={excludeActions<VehicleData>(
													vehicleColumns,
												)}
												fetcher={mapParam(getVehicles)} // TODO: Fix this unknown bug
												value={field.value ?? undefined}
												getTargetId={(row) =>
													row.original.id
												}
												renderView={{
													fetcher: (id) =>
														getVehicle(id),
													render: (data) => (
														<ViewVehicle
															vehicle={data}
														/>
													),
												}}
												onRowSelect={(row) => {
													form.setValue(
														"vehicleId",
														row.original.id,
													);
												}}
												onReset={() =>
													form.resetField("vehicleId")
												}
												asChild
											/>
										</FormControl>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						{/* Booking requests selector */}
						<FormField
							control={form.control}
							name="bookingRequestIds"
							render={({ field }) => (
								<FormItem className="w-full">
									<div className="flex flex-col items-start w-full gap-2 p-1">
										<FormLabel className="flex h-full">
											<NotebookPen />
											{t("form.bookingRequests")}
										</FormLabel>
										<FormControl>
											<DataSelector
												targetData="Booking Request"
												label="Add Booking Requests"
												tableConfig={{
													columnVisibility:
														visibilityState(
															BookingRequestSchema.shape,
															false,
															{
																id: true,
																status: true,
																requesterId: true,
																type: true,
																isReserved: true,
																priority: true,
																tripPurpose: true,

																departureTime: true,
																arrivalTime: true,
															},
														),
												}}
												columns={excludeActions<BookingRequestData>(
													bookingRequestColumns,
												)}
												fetcher={mapParam(
													getBookingRequests,
													{
														type: "one_way",
														status: "pending",
													},
												)}
												values={Array.from(
													field.value?.values() ?? [],
												)}
												multiple
												getTargetId={(row) =>
													row.original.id
												}
												renderView={{
													fetcher: (id) =>
														getBookingRequest(id),
													render: (data) => (
														<BookingDetailsSheet
															bookingId={data.id}
															booking={data}
															mobile={false}
															onCancel={() => {}}
															coordinator={true}
															modify={false}
														/>
													),
												}}
												onRowSelect={(row) => {
													const newValue =
														field.value ??
														new Set();
													if (
														newValue.has(
															row.original.id,
														)
													) {
														toast.warning(
															"Data is already selected",
														);
														return;
													} else {
														newValue.add(
															row.original.id,
														);
													}
													form.setValue(
														"bookingRequestIds",
														newValue,
													);
												}}
												onReset={(id) => {
													const newValue =
														field.value;
													if (newValue) {
														const isDeleted =
															newValue.delete(id);
														if (isDeleted) {
															form.setValue(
																"bookingRequestIds",
																newValue,
															);
														}
													}
												}}
												asChild
											/>
										</FormControl>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>
						<div className="flex flex-col items-start w-full gap-2 p-1">
							<FormLabel className="flex h-full">
								<Flag />
								{t("form.routeStops")}
								<Button
									type="button"
									onClick={() => setOpen(true)}
								>
									Add stop
								</Button>
							</FormLabel>
							<StopsList
								form={form}
								initialTripData={data}
								additionalTripStops={additionalTripStops}
								bookingIds={Array.from(
									bookingIds?.values() ?? [],
								)}
							/>
						</div>
					</FieldSeparator>
					<div className="flex h-full justify-end items-end">
						<Button type="submit" variant="secondary">
							{t("form.createCombined")}
						</Button>
					</div>
				</form>
			</Form>
			<SheetForm
				config={{
					description: "trip stop",
				}}
				open={open}
				onOpenChange={setOpen}
				state="create"
				renderCreate={
					<CreateTripStopForm
						setTripStop={setAdditionalTripStops}
						setOpen={setOpen}
					/>
				}
			/>
		</>
	);
}

interface StopsListProps {
	form: UseFormReturn<CreateCombinedTripData>;
	initialTripData?: TripData;
	additionalTripStops?: TripStopData[];
	bookingIds: string[];
}

function StopsList({
	form,
	initialTripData,
	additionalTripStops,
	bookingIds,
}: StopsListProps) {
	const [stops, setStops] = useState<TripStopData[]>([]);

	const { data, isLoading, error } = useSWR(
		["bookings", bookingIds],
		async ([, ids]) => Promise.all(ids.map((id) => getBookingRequest(id))),
	);

	useEffect(() => {
		form.setValue("tripStopOrders", stops);
	}, [form, stops]);

	useEffect(() => {
		if (!data) return;

		const tripDataStops =
			initialTripData?.stops?.map((s) => {
				return {
					id: crypto.randomUUID(),
					arrivalTime: s.arrivalTime,
					location: s.location,
					locationId: s.location.id,
					// order: s.order,
					type: s.type,
				} as TripStopData;
			}) ?? [];

		const newStops = data
			.filter((d) => d.type === "one_way")
			.flatMap((br) => {
				return [
					{
						id: crypto.randomUUID(),
						arrivalTime: br.departureTime,
						location: br.departureLocation,
						locationId: br.departureLocation.id,
						// order: idx * 2 + 1 + tripDataStops.length,
						type: "pickup",
					},
					{
						id: crypto.randomUUID(),
						arrivalTime: br.arrivalTime,
						location: br.arrivalLocation,
						locationId: br.arrivalLocation.id,
						// order: idx * 2 + 2 + tripDataStops.length,
						type: "drop_off",
					},
				] as TripStopData[];
			});

		let allNewStops = [
			...tripDataStops,
			...newStops,
			...(additionalTripStops ? additionalTripStops : []),
		];

		allNewStops = allNewStops.map((stop, idx) => {
			return {
				...stop,
				order: idx,
			};
		});

		console.log("STOPS ACTUAL: ", allNewStops);

		form.setValue("tripStopOrders", allNewStops);
		setStops(allNewStops);
	}, [form, data, additionalTripStops, initialTripData?.stops]);

	if (isLoading) return <Spinner />;
	if (error) return "There was an error fetching booking requests";
	if (!data) return "No data could be found";

	return <TripStopsTimeline stops={stops} setStops={setStops} />;
}
