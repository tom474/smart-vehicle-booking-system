"use client";

import { getVehicle, getVehicles } from "@/apis/vehicle";
import TableView from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { vehicleColumns } from "./_columns/vehicle";
import CreateVehicleForm from "./_components/create";
import UpdateVehicleForm from "./_components/update-vehicle";
import { ViewVehicle } from "./_components/vehicle-sheet";

function Vehicles() {
	return (
		<TableView
			targetDataStr="Vehicle"
			columns={vehicleColumns}
			fetcher={mapParam(getVehicles)}
			renderCreate={<CreateVehicleForm />}
			renderView={{
				fetcher: (id) => getVehicle(id),
				render: (data) => <ViewVehicle vehicle={data} />,
			}}
			renderEdit={{
				fetcher: (id) => getVehicle(id),
				render: (data) => <UpdateVehicleForm data={data} />,
			}}
			// renderDestructiveAction={{
			//   onSubmit(id) {
			//     toast.promise(
			//       new Promise<void>((r) => {
			//         setTimeout(() => r(), 3000);
			//       }),
			//       {
			//         loading: "Deleting the vehicle...",
			//         success: `Vehicle #${id} has been deleted`,
			//         error: `Could not delete vehicle #${id}, please try again later`,
			//       },
			//     );
			//   },
			// }}
		/>
	);
}

export default Vehicles;
