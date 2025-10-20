"use client";

import { useEffect, useState } from "react";
import {
	deleteVehicleServiceRequest,
	getVehicleServiceById,
	getVehicleServices,
} from "@/apis/vehicle-service-request";
import SheetForm from "@/components/dashboard-table/sheet-form";
import TableView from "@/components/dashboard-table/table-view";
import { type CalendarEvent, EventCalendar } from "@/components/event-calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateUpdateVehicleService } from "./_components/create-update-form";
import { ViewVsr } from "./_components/view";
import { vehicleServiceColumns } from "./_columns/vehicle-service-request";
import { mapParam } from "@/lib/build-query-param";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiErrHandler } from "@/lib/error-handling";

function VehicleServiceRequest() {
	const router = useRouter();

	const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
	const [vsrId, setVsrId] = useState<string>("");

	const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

	useEffect(() => {
		const get = async () => {
			const services = await getVehicleServices({});
			const events = services.map((s) => {
				return {
					id: s.id,
					title: s.schedule?.title ?? s.driver?.name,
					start: s.startTime,
					end: s.endTime,
				} as CalendarEvent;
			});

			setCalendarEvents(events);
		};

		get();
	}, []);

	return (
		<>
			<Tabs defaultValue="table">
				<TabsList>
					<TabsTrigger value="table">Table</TabsTrigger>
					<TabsTrigger value="calendar">Calendar</TabsTrigger>
				</TabsList>
				<TabsContent value="table" className="space-y-2">
					<TableView
						targetDataStr="Vehicle Booking Request"
						tableConfig={{
							columnVisibility: {
								vehicleId: false,
							},
						}}
						columns={vehicleServiceColumns}
						fetcher={mapParam(getVehicleServices)}
						renderCreate={<CreateUpdateVehicleService />}
						renderView={{
							fetcher: (id) => getVehicleServiceById(id),
							render: (data) => <ViewVsr data={data} />,
						}}
						renderEdit={{
							fetcher: (id) => getVehicleServiceById(id),
							render: (data) => (
								<CreateUpdateVehicleService
									defaultValue={data}
								/>
							),
						}}
						renderDestructiveAction={{
							onSubmit: (id) => {
								toast.promise(deleteVehicleServiceRequest(id), {
									loading:
										"Deleting vehicle service request...",
									success: () => {
										router.refresh();
										return `Vehicle service request updated successfully`;
									},
									error: (e) => {
										const apiErr = apiErrHandler(e);
										if (apiErr) return apiErr;

										return `Could not delete vehicle service request #${id}, please try again later`;
									},
								});
							},
							alertTitle:
								"Are you sure you want to delete this leave schedule?",
							alertDescription: "This action cannot be undone.",
						}}
					/>
				</TabsContent>
				<TabsContent value="calendar">
					<EventCalendar
						events={calendarEvents}
						onEventSelect={async (e) => {
							setVsrId(e.id);
							setIsSheetOpen(true);
						}}
						disableCreateEvent
					/>
				</TabsContent>
			</Tabs>
			<SheetForm
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
				state="view"
				renderView={{
					fetcher: () => getVehicleServiceById(vsrId),
					render: (data) => <ViewVsr data={data} />,
				}}
			/>
		</>
	);
}

export default VehicleServiceRequest;
