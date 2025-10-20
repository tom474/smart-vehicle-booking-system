"use client";

import { getLocationById, getLocations } from "@/apis/location";
import TableView from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { locationColumns } from "./_columns/location";
import CreateLocation from "./_components/create";
import ViewLocation from "./_components/view";

function Driver() {
	return (
		<TableView
			targetDataStr="Location"
			columns={locationColumns}
			fetcher={mapParam(getLocations, { type: "fixed" })}
			renderCreate={<CreateLocation />}
			renderView={{
				fetcher: (id) => getLocationById(id),
				render: (data) => <ViewLocation data={data} />,
			}}
			renderEdit={{
				fetcher: (id) => getLocationById(id),
				render: (data) => <CreateLocation defaultValue={data} />,
			}}
			// renderDestructiveAction={{
			// 	alertTitle: "Are you sure you want to delete this location?",
			// 	alertDescription: "This action is permanent and can't be undone.",
			// 	onSubmit(id) {
			// 		toast.promise(deleteLocation(id), {
			// 			loading: "Deleting location...",
			// 			success: `New location has been deleted`,
			// 			error: `Could not delete location, please try again later`,
			// 		})
			// 	},
			// }}
		/>
	);
}

export default Driver;
