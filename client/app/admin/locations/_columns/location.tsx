import type { ColumnDef } from "@tanstack/react-table";
import { MapPin } from "lucide-react";
import type z from "zod/v4";
import type { LocationData, LocationSchema } from "@/apis/location";
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { capitalize, truncateString } from "@/lib/string-utils";
import type { ColumnProps } from "@/types/column-props";
import { Errorable } from "@/components/undefinable";

export const locationColumns = ({
	onView,
	onEdit,
	onDestructiveAction,
}: ColumnProps): ColumnDef<LocationData>[] => {
	return [
		{
			accessorKey: "id",
			header: () => <p className="text-right">ID</p>,
			cell: ({ row }) => {
				const id = row.getValue("id") as string | undefined;
				return <p className="text-left">{id || "N/A"}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "type",
			header: "Type",
			cell: ({ row }) => {
				const type = row.getValue("type") as z.infer<
					typeof LocationSchema.shape.type
				>;

				const typeVariants = {
					fixed: "info",
					custom: "warning",
				} as const;

				return (
					<Badge variant={typeVariants[type]}>
						{capitalize(type)}
					</Badge>
				);
			},
			// meta: {
			//   filter: f.enum(LocationSchema.shape.type.options, (opt) => {
			//     const typeVariants = {
			//       fixed: "info",
			//       custom: "warning",
			//     } as const;
			//
			//     return (
			//       <div className="flex items-center">
			//         <Badge variant={typeVariants[opt]}>
			//           {capitalize(opt)}
			//         </Badge>
			//       </div>
			//     );
			//   }),
			// },
		},
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => {
				const name = row.original.name;
				return (
					<p className="font-medium">{name || "Unnamed Location"}</p>
				);
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "address",
			header: "Address",
			cell: ({ row }) => {
				const address = row.original.address;
				return (
					<Errorable
						variant="missing"
						value={
							address ? truncateString(address, 100) : undefined
						}
					/>
				);
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "coordinates",
			header: "Coordinates",
			cell: ({ row }) => {
				const latitude = row.original.latitude;
				const longitude = row.original.longitude;

				return (
					<div className="flex items-center gap-1">
						<MapPin className="size-4" />
						<span className="text-sm">
							{latitude.toFixed(4)}, {longitude.toFixed(4)}
						</span>
					</div>
				);
			},
		},
		// {
		// 	accessorKey: "latitude",
		// 	header: undefined,
		// 	cell: undefined,
		// 	meta: {
		// 		isSearchable: true,
		// 	},
		// },
		// {
		// 	accessorKey: "longitude",
		// 	header: undefined,
		// 	cell: undefined,
		// 	meta: {
		// 		isSearchable: true,
		// 	},
		// },
		{
			accessorKey: "actions",
			enableSorting: false,
			enableHiding: false,
			header: () => <div className="text-right"></div>,
			cell: ({ row }) => {
				const locationId = row.original.id;
				const type = row.original.type;

				return (
					<ColumnActions
						targetId={locationId}
						onView={onView}
						onEdit={onEdit}
						onDestructiveAction={onDestructiveAction}
						destructiveActionDisable={type === "fixed"}
					/>
				);
			},
		},
	] as ColumnDef<LocationData>[];
};
