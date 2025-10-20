import type { ColumnDef } from "@tanstack/react-table";
import { type VendorData, VendorSchema } from "@/apis/vendor";
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { f } from "@/components/dashboard-table/filter/table-filter";
import { capitalize } from "@/lib/string-utils";
import type { ColumnProps } from "@/types/column-props";

export const vendorColumns = ({
  onView,
  onEdit,
  onDestructiveAction,
}: ColumnProps): ColumnDef<VendorData>[] => {
  return [
    {
      accessorKey: "id",
      header: () => <p>ID</p>,
      cell: ({ row }) => {
        const id = row.original.id;
        return <p className="font-mono text-sm">{id}</p>;
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const name = row.original.name;
        return (
          <p className="font-medium">{name || "Unnamed Vendor"}</p>
        );
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusVariants = {
          active: "success",
          inactive: "destructive",
        } as const;
        return (
          <Badge variant={statusVariants[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
      meta: {
        filter: f.enum(VendorSchema.shape.status.options, (opt) => {
          const statusVariants = {
            active: "success",
            inactive: "destructive",
          } as const;

          return (
            <div className="flex items-center">
              <Badge variant={statusVariants[opt]}>
                {capitalize(opt)}
              </Badge>
            </div>
          );
        }),
      },
    },
    {
      accessorKey: "contactPerson",
      header: "Contact Person",
      cell: ({ row }) => {
        const contactPerson = row.original.contactPerson;
        return <span>{contactPerson}</span>;
      },
      meta: {
        isSortable: true,
        isSearchable: true,
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.original.email;
        return <span className="text-sm">{email}</span>;
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => {
        const phoneNumber = row.original.phoneNumber;
        return <span className="text-sm font-mono">{phoneNumber}</span>;
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
        return <p className="max-w-[512px] truncate">{address}</p>;
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "numberOfDrivers",
      header: "No. Drivers",
      cell: ({ row }) => {
        const numberOfDrivers = row.original.numberOfDrivers;
        return <span className="text-sm">{numberOfDrivers}</span>;
      },
    },
    {
      accessorKey: "numberOfVehicles",
      header: "No. Vehicles",
      cell: ({ row }) => {
        const numberOfVehicles = row.original.numberOfVehicles;
        return <span className="text-sm">{numberOfVehicles}</span>;
      },
    },
    {
      accessorKey: "driverName",
      enableHiding: false,
      header: undefined,
      cell: undefined,
      meta: {
        isSearchable: {
          label: "Driver name",
        },
      },
    },
    {
      accessorKey: "vehicleLicensePlate",
      enableHiding: false,
      header: undefined,
      cell: undefined,
      meta: {
        isSearchable: {
          label: "Vehicle license plate",
        },
      },
    },
    {
      accessorKey: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => {
        const vendorId = row.original.id;
        return (
          <ColumnActions
            targetId={vendorId}
            onView={onView}
            onEdit={onEdit}
            onDestructiveAction={onDestructiveAction}
          />
        );
      },
    },
  ] as ColumnDef<VendorData>[];
};
