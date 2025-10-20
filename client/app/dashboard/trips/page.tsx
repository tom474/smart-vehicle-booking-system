"use client";

import { getTrip, getTrips } from "@/apis/trip";
import TableView from "@/components/dashboard-table/table-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mapParam } from "@/lib/build-query-param";
import { tripColumns } from "./_columns/trip";
import { CombineTripForm } from "./_components/combine-trip-form";
import TripView from "./_components/trip-form";

function Driver() {
	return (
		<Tabs defaultValue="scheduling">
			<TabsList>
				<TabsTrigger value="scheduling">All</TabsTrigger>
				<TabsTrigger value="scheduled">Scheduling</TabsTrigger>
			</TabsList>
			<TabsContent value="scheduling">
				<TableView
					targetDataStr="Trips"
					columns={tripColumns}
					fetcher={mapParam(getTrips, {
						filterData(trip) {
							return trip.status !== "scheduling";
						},
					})}
					renderCreate={<CombineTripForm />}
					renderView={{
						fetcher: (id) => getTrip(id),
						render: (data) => <TripView data={data} />,
					}}
					//renderEdit={{
					//	fetcher: (id) => getTrip(id),
					//	render: () => "Editing Trip data",
					//}}
					renderDestructiveAction={{
						onSubmit: (id) => {
							console.log("Deleting trip with id:", id);
						},
						alertTitle:
							"Are you sure you want to delete this trip?",
						alertDescription:
							"This will permanently delete this trip.",
					}}
				/>
			</TabsContent>
			<TabsContent value="scheduled">
				<TableView
					targetDataStr="Trips"
					columns={tripColumns}
					fetcher={mapParam(getTrips, { status: "scheduling" })}
					renderCreate={<CombineTripForm />}
					renderView={{
						fetcher: (id) => getTrip(id),
						render: (data) => <TripView data={data} />,
					}}
					//renderEdit={{
					//	fetcher: (id) => getTrip(id),
					//	render: () => "Editing Trip data",
					//}}
					renderDestructiveAction={{
						onSubmit: (id) => {
							console.log("Deleting trip with id:", id);
						},
						alertTitle:
							"Are you sure you want to delete this trip?",
						alertDescription:
							"This will permanently delete this trip.",
					}}
				/>
			</TabsContent>
		</Tabs>
	);
}

export default Driver;
