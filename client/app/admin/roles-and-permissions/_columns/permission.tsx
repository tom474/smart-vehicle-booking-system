import type { ColumnDef } from "@tanstack/react-table";
import type { PermissionData } from "@/apis/permission";
import ColumnActions from "@/components/dashboard-table/column-actions";
import type { ColumnProps } from "@/types/column-props";
import { f } from "@/components/dashboard-table/filter/table-filter";

const columns = ({
  onView,
  onEdit,
  onDestructiveAction,
}: ColumnProps): ColumnDef<PermissionData>[] => {
  return [
    {
      accessorKey: "id",
      header: () => <p className="">ID</p>,
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return <p className="text-sm">{id}</p>;
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "roleId",
      header: undefined,
      cell: undefined,
      enableHiding: false,
      meta: {
        isSearchable: {
          id: "roleTitle",
          label: "Role Title",
        },
        isSortable: true,
        filterConfig: {
          label: "Role",
        },
        filter: f.enum(
          ["ROL-1", "ROL-2", "ROL-3", "ROL-4", "ROL-5"],
          (opt) => {
            const roleName = {
              "ROL-1": "Employee",
              "ROL-2": "Executive",
              "ROL-3": "Driver",
              "ROL-4": "Coordinator",
              "ROL-5": "Admin",
            } as const;

            return (
              <div className="flex items-center">
                {roleName[opt]}
              </div>
            );
          },
        ),
      },
    },
    {
      accessorKey: "title",
      header: "Title",
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
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.description;
        return (
          <div className="flex items-center gap-2">{description}</div>
        );
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => {
        const permissionId = row.original.id;
        return (
          <ColumnActions
            targetId={permissionId}
            onView={onView}
            onEdit={onEdit}
            onDestructiveAction={onDestructiveAction}
          />
        );
      },
    },
  ] as ColumnDef<PermissionData>[];
};

export { columns };
