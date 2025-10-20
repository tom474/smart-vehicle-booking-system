import type { ColumnDef } from "@tanstack/react-table";
import type { RoleData } from "@/apis/role";
import ColumnActions from "@/components/dashboard-table/column-actions";
import type { ColumnProps } from "@/types/column-props";

export const roleColumns = ({
	onView,
	onEdit,
	onDestructiveAction,
}: ColumnProps): ColumnDef<RoleData>[] => {
	return [
		{
			accessorKey: "id",
			header: () => <p className="text-right max-w-fit">ID</p>,
			cell: ({ row }) => {
				const id = row.getValue("id") as string;
				return <p className="text-right text-sm max-w-fit">{id}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "title",
			header: "Role Title",
			cell: ({ row }) => {
				const title = row.original.title;
				return (
					<div className="flex items-center gap-2">
						<span className="font-medium">{title}</span>
					</div>
				);
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "key",
			header: "Key",
			cell: ({ row }) => {
				const key = row.original.key;
				return <span className="font-medium">{key}</span>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => {
				const description = row.original.description;
				return <p className="text-sm truncate">{description}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "numberOfPermissions",
			header: () => <p className="text-center w-full">No. Permissions</p>,
			cell: ({ row }) => (
				<div className="flex items-center justify-center gap-1">
					<span className="text-sm">
						{row.original.numberOfPermissions}
					</span>
				</div>
			),
		},
		{
			accessorKey: "numberOfUsers",
			header: () => <p className="text-center w-full">No. Users</p>,
			cell: ({ row }) => {
				const count = row.original.numberOfUsers;
				return (
					<div className="flex items-center justify-center gap-1">
						<span className="text-sm">{count}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "actions",
			enableSorting: false,
			enableHiding: false,
			header: () => <div className="text-right"></div>,
			cell: ({ row }) => {
				const roleId = row.original.id;
				return (
					<ColumnActions
						targetId={roleId}
						onView={onView}
						onEdit={onEdit}
						onDestructiveAction={onDestructiveAction}
					/>
				);
			},
		},
	] as ColumnDef<RoleData>[];
};
