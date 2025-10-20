"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";

type Activity = {
	id: string;
	driver: string;
	use: "Transportation" | "Maintanance";
	date: Date;
};

const columns: ColumnDef<Activity>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "driver",
		header: "Driver",
	},
	{
		accessorKey: "use",
		header: "Use",
	},
	{
		accessorKey: "date",
		header: () => <div className="text-right">Date</div>,
		cell: ({ row }) => {
			return (
				<div className="text-right">
					{(row.getValue("date") as Date).toDateString()}
				</div>
			);
		},
	},
];

export { columns };
export type { Activity };
