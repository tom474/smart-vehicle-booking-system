"use client";

import { getDriver, getDrivers } from "@/apis/driver";
import TableView from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { driverColumns } from "./_columns/driver";
import { CreateDriver } from "./_components/create-form";
import { UpdateDriver } from "./_components/update-form";
import ViewDriver from "./_components/view";

function Driver() {
	return (
		<TableView
			targetDataStr="Driver"
			tableConfig={{
				columnVisibility: {
					username: false,
				},
			}}
			columns={driverColumns}
			fetcher={mapParam(getDrivers)}
			renderCreate={<CreateDriver />}
			renderView={{
				fetcher: getDriver,
				render: (data) => <ViewDriver data={data} />,
			}}
			renderEdit={{
				fetcher: getDriver,
				render: (data) => <UpdateDriver defaultData={data} />,
			}}
			// renderDestructiveAction={{
			// 	alertTitle: "Are you sure you want to delete this driver?",
			// 	alertDescription:
			// 		"This action is permanent and cannot be undone",
			// 	bodyRenderer: () => <></>,
			// 	onSubmit(id) {
			// 		toast.promise(
			// 			new Promise<void>((r) => {
			// 				setTimeout(() => r(), 5000);
			// 			}),
			// 			{
			// 				loading: "Deleting the driver account...",
			// 				success: () => {
			// 					router.refresh();
			// 					return `Driver deleted successfully`;
			// 				},
			// 				error: `Could not delete driver #${id}, please try again later`,
			// 			},
			// 		);
			// 	},
			// }}
		/>
	);
}

export default Driver;
