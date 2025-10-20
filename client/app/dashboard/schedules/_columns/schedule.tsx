import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { getDriver } from "@/apis/driver";
import type { ScheduleData } from "@/apis/schedule";
import { getVehicle } from "@/apis/vehicle";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { DataFetcher } from "@/components/data-fetcher";
import { Errorable } from "@/components/undefinable";
import { dateTimeFormat } from "@/lib/date-time-format";
import { apiURL } from "@/lib/utils";
import type { ColumnProps } from "@/types/column-props";
import { f } from "@/components/dashboard-table/filter/table-filter";

export const scheduleColumns = ({
	onView,
	onEdit,
	onDestructiveAction: onDelete,
}: ColumnProps): ColumnDef<ScheduleData>[] => {
	return [
		{
			accessorKey: "id",
			header: "ID",
			cell: ({ row }) => <p>{row.original.id}</p>,
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "title",
			header: "Title",
			cell: ({ row }) => <p>{row.original.title}</p>,
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => (
				<Errorable
					value={row.original.description}
					variant="missing"
					errorMsg="-"
				/>
			),
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "startTime",
			header: "From",
			cell: ({ row }) => (
				<p>{format(row.original.startTime, dateTimeFormat)}</p>
			),
			meta: {
				isSortable: true,
				filterConfig: {
					label: "Start Time",
				},
				filter: f.dateRange(
					"startTimeFrom",
					undefined,
					"startTimeTo",
					undefined,
				),
			},
		},
		{
			accessorKey: "endTime",
			header: "To",
			cell: ({ row }) => (
				<p>{format(row.original.endTime, dateTimeFormat)}</p>
			),
			meta: {
				isSortable: true,
				filterConfig: {
					label: "End Time",
				},
				filter: f.dateRange(
					"endTimeFrom",
					undefined,
					"endTimeTo",
					undefined,
				),
			},
		},
		{
			accessorKey: "driverId",
			header: "Driver",
			cell: ({ row }) => {
				const driverId = row.original.driverId;
				if (!driverId)
					return (
						<Errorable shouldError variant="missing" errorMsg="-" />
					);

				return (
					<DataFetcher
						urlId={`${apiURL}/drivers/${driverId}`}
						fetcher={getDriver(driverId)}
						onFetchFinished={(driver) => driver.name}
					/>
				);
			},
			meta: {
				isSearchable: {
					id: "driverName",
					label: "Driver Name",
				},
			},
		},
		{
			accessorKey: "vehicleId",
			header: "Vehicle ID",
			cell: ({ row }) => {
				const vehicleId = row.original.vehicleId;
				if (!vehicleId)
					return (
						<Errorable shouldError variant="missing" errorMsg="-" />
					);

				return (
					<DataFetcher
						urlId={`${apiURL}/vehicles/${vehicleId}`}
						fetcher={getVehicle(vehicleId)}
						onFetchFinished={(driver) =>
							`${driver.model} - ${driver.licensePlate}`
						}
					/>
				);
			},
			meta: {
				isSearchable: {
					id: "vehicleLicensePlate",
					label: "Vehicle License Plate",
				},
			},
		},
		{
			accessorKey: "tripId",
			header: "Trip ID",
			cell: ({ row }) => (
				<Errorable
					value={row.original.tripId}
					variant="missing"
					errorMsg="-"
				/>
			),
		},
		{
			accessorKey: "vehicleService",
			header: "Vehicle Service",
			cell: ({ row }) => (
				<Errorable
					value={row.original.vehicleService}
					variant="missing"
					errorMsg="-"
				/>
			),
		},
		{
			accessorKey: "leaveRequest",
			header: "Leave Request",
			cell: ({ row }) => (
				<Errorable
					value={row.original.leaveRequest}
					variant="missing"
					errorMsg="-"
				/>
			),
		},

		{
			accessorKey: "createdAt",
			header: "Created At",
			cell: ({ row }) => (
				<p>{format(row.original.createdAt, dateTimeFormat)}</p>
			),
			meta: {
				isSortable: true,
			},
		},
		{
			accessorKey: "updatedAt",
			header: "Last Modified",
			cell: ({ row }) => (
				<p>{format(row.original.updatedAt, dateTimeFormat)}</p>
			),
			meta: {
				isSortable: true,
			},
		},
		{
			accessorKey: "actions",
			enableSorting: false,
			enableHiding: false,
			header: undefined,
			cell: ({ row }) => {
				const feedbackId = row.original.id;
				return (
					<ColumnActions
						targetId={feedbackId}
						onView={onView}
						onEdit={onEdit}
						onDestructiveAction={onDelete}
					/>
				);
			},
		},
	];
};
