import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ActivityLogSchema, type ActivityLogData } from "@/apis/activity-log";
import Badge from "@/components/badge";
import { dateTimeFormat } from "@/lib/date-time-format";
import { capitalize } from "@/lib/string-utils";
import { f } from "@/components/dashboard-table/filter/table-filter";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export const activityLogColumns = (): ColumnDef<ActivityLogData>[] => {
	return [
		{
			accessorKey: "id",
			header: () => <p>ID</p>,
			cell: ({ row }) => {
				const id = row.original.id;
				return <p>{id}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "actorRole",
			header: () => <p>Actor Role</p>,
			cell: ({ row }) => {
				const actorRole = row.original.actorRole;
				return <p>{capitalize(actorRole)}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "actorId",
			header: () => <p>Actor ID</p>,
			cell: ({ row }) => {
				const actorId = row.original.actorId;
				return <p>{actorId}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "entityName",
			header: () => <p>Entity</p>,
			cell: ({ row }) => {
				const entityName = row.original.entityName;

				const displayName = entityName
					.split("_")
					.map(capitalize)
					.join(" ");

				return <p>{displayName}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "entityId",
			header: () => <p>Entity ID</p>,
			cell: ({ row }) => {
				const entityId = row.original.entityId;
				return <p>{entityId}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "actionType",
			header: () => <p>Action</p>,
			cell: ({ row }) => {
				const actionType = row.original.actionType;

				const actionTypeBadge = {
					create: "success",
					approve: "success",
					update: "warning",
					delete: "destructive",
					reject: "destructive",
					cancel: "destructive",
				} as const;

				return (
					<Badge
						className="capitalize"
						variant={actionTypeBadge[actionType]}
					>
						{actionType}
					</Badge>
				);
			},
			meta: {
				isSearchable: true,
				isSortable: true,
				filter: f.enum(
					ActivityLogSchema.shape.actionType.options,
					(opt) => {
						const actionTypeBadge = {
							create: "success",
							approve: "success",
							update: "warning",
							delete: "destructive",
							reject: "destructive",
							cancel: "destructive",
						} as const;

						return (
							<Badge
								className="capitalize"
								variant={actionTypeBadge[opt]}
							>
								{opt}
							</Badge>
						);
					},
				),
			},
		},
		{
			accessorKey: "actionDetails",
			header: () => <p>Details</p>,
			cell: ({ row }) => {
				const actionDetails = row.original.actionDetails;

				return (
					<Popover>
						<PopoverTrigger className="truncate">
							{actionDetails}
						</PopoverTrigger>
						<PopoverContent>{actionDetails}</PopoverContent>
					</Popover>
				);
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		// {
		// 	accessorKey: "metadata",
		// 	header: () => <p>Metadata</p>,
		// 	cell: ({ row }) => {
		// 		const metadata = row.original.metadata;
		// 		return <p>{metadata ? JSON.stringify(metadata) : "-"}</p>;
		// 	},
		// },
		{
			accessorKey: "timestamp",
			header: () => <p>Timestamp</p>,
			cell: ({ row }) => {
				const timestamp = row.original.timestamp;
				return <p>{format(timestamp, dateTimeFormat)}</p>;
			},
			meta: {
				isSortable: true,
				filter: f.dateRange("from", undefined, "to", undefined),
				filterConfig: {
					label: "Activity time",
				},
			},
		},
		// {
		// 	accessorKey: "actions",
		// 	enableSorting: false,
		// 	enableHiding: false,
		// 	header: () => <div className="text-right"></div>,
		// 	cell: ({ row }) => {
		// 		const activityLogId = row.original.id;
		// 		return (
		// 			<ColumnActions
		// 				targetId={activityLogId}
		// 				onView={onView}
		// 				onEdit={onEdit}
		// 				onDestructiveAction={onDestructiveAction}
		// 			/>
		// 		);
		// 	},
		// },
	] as ColumnDef<ActivityLogData>[];
};
