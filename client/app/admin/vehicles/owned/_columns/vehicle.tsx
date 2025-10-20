import type { ColumnDef } from "@tanstack/react-table";
import { VehicleSchema, type VehicleData } from "@/apis/vehicle"; // Adjust the import path
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import type { ColumnProps } from "@/types/column-props";
import { f } from "@/components/dashboard-table/filter/table-filter";
import { capitalize } from "@/lib/string-utils";
import { Errorable } from "@/components/undefinable";
import { DataFetcher } from "@/components/data-fetcher";
import { getDriver } from "@/apis/driver";
import { getVendor } from "@/apis/vendor";
import { getUser } from "@/apis/user";

export const vehicleColumns = ({
  onView,
  onEdit,
  onDestructiveAction,
}: ColumnProps): ColumnDef<VehicleData>[] => {
  return [
    {
      accessorKey: "id",
      header: () => <p className="text-right">ID</p>,
      cell: ({ row }) => {
        const id = row.original.id;
        return <p className="text-left">{id}</p>;
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "licensePlate",
      header: "License Plate",
      cell: ({ row }) => {
        const licensePlate = row.original.licensePlate;
        return <p className="font-medium">{licensePlate}</p>;
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "model",
      header: "Model",
      cell: ({ row }) => {
        const model = row.original.model;
        return <p>{model}</p>;
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "color",
      header: "Color",
      cell: ({ row }) => {
        const color = row.original.color;
        return (
          <div className="flex items-center gap-2">
            <div
              className="border rounded-full size-4"
              style={{ backgroundColor: color.toLowerCase() }}
            />
            <span>{color}</span>
          </div>
        );
      },
      meta: {
        isSortable: true,
        filter: f.enum(VehicleSchema.shape.color.options, (opt) => {
          return (
            <div className="flex items-center gap-2">
              <div
                className="border rounded-full size-4"
                style={{ backgroundColor: opt.toLowerCase() }}
              />
              <span>{opt}</span>
            </div>
          );
        }),
      },
    },
    {
      accessorKey: "capacity",
      header: () => <p className="text-right">Capacity</p>,
      cell: ({ row }) => {
        const capacity = row.original.capacity;
        return <p className="text-right">{capacity} pax</p>;
      },
      meta: {
        isSortable: true,
        filter: f.number("minCapacity", 1, "maxCapacity", 100, 1),
      },
    },
    {
      accessorKey: "availability",
      header: "Availability",
      cell: ({ row }) => {
        const availability = row.original.availability;

        const availabilityVariant = {
          available: "success",
          unavailable: "warning",
          in_use: "info",
          under_maintenance: "warning",
          under_repair: "warning",
          out_of_service: "destructive",
        } as const;

        return (
          <Badge variant={availabilityVariant[availability]}>
            {availability.split("_").map(capitalize).join(" ")}
          </Badge>
        );
      },
      meta: {
        filter: f.enum(
          VehicleSchema.shape.availability.options,
          (opt) => {
            const availabilityVariant = {
              available: "success",
              unavailable: "warning",
              in_use: "info",
              under_maintenance: "warning",
              under_repair: "warning",
              out_of_service: "destructive",
            } as const;

            return (
              <Badge variant={availabilityVariant[opt]}>
                {opt.split("_").map(capitalize).join(" ")}
              </Badge>
            );
          },
        ),
      },
    },
    {
      accessorKey: "ownershipType",
      header: "Ownership",
      cell: ({ row }) => {
        const ownershipType = row.original.ownershipType;

        const ownershipVariants = {
          company: "info",
          vendor: "warning",
        } as const;

        return (
          <Badge variant={ownershipVariants[ownershipType]}>
            {ownershipType}
          </Badge>
        );
      },
      meta: {
        filter: f.enum(
          VehicleSchema.shape.ownershipType.options,
          (opt) => {
            const ownershipVariants = {
              company: "info",
              vendor: "warning",
            } as const;

            return (
              <div className="flex items-center">
                <Badge variant={ownershipVariants[opt]}>
                  {capitalize(opt)}
                </Badge>
              </div>
            );
          },
        ),
      },
    },
    {
      accessorKey: "driverId",
      header: "Driver",
      cell: ({ row }) => {
        const driverId = row.original.driverId;
        if (!driverId)
          return <Errorable variant="missing" value={driverId} />;

        return (
          <DataFetcher
            urlId={`/api/drivers/${driverId}`}
            loading={driverId}
            fetcher={getDriver(driverId)}
            onFetchFinished={(user) => user.name}
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
      accessorKey: "vendorId",
      header: "Vendor",
      cell: ({ row }) => {
        const vendorId = row.original.vendorId;
        if (!vendorId)
          return <Errorable variant="missing" value={vendorId} />;

        return (
          <DataFetcher
            urlId={`/api/vendors/${vendorId}`}
            loading={vendorId}
            fetcher={getVendor(vendorId)}
            onFetchFinished={(user) => user.name}
          />
        );
      },
      meta: {
        isSearchable: {
          id: "vendorName",
          label: "Vendor Name",
        },
      },
    },
    {
      accessorKey: "executiveId",
      header: "Executive",
      cell: ({ row }) => {
        const executiveId = row.original.executiveId;
        if (!executiveId)
          return <Errorable variant="missing" value={executiveId} />;

        return (
          <DataFetcher
            urlId={`/api/users/${executiveId}`}
            loading={executiveId}
            fetcher={getUser(executiveId)}
            onFetchFinished={(user) => user.name}
          />
        );
      },
      meta: {
        isSearchable: {
          id: "executiveName",
          label: "Executive Name",
        },
      },
    },
    {
      accessorKey: "baseLocation",
      header: "Base Location",
      cell: ({ row }) => {
        const baseLocation = row.original.baseLocationId;
        return <p>{baseLocation}</p>;
      },
      meta: {
        isSearchable: {
          id: "baseLocationName",
          label: "Base Location Name",
        },
      },
    },
    {
      accessorKey: "currentLocation",
      header: "Current Location",
      cell: ({ row }) => {
        const currentLocation = row.original.currentLocationId;
        return <p>{currentLocation}</p>;
      },
    },
    // {
    //   accessorKey: "numberOfTrips",
    //   header: () => <p className="text-right">Trips</p>,
    //   cell: ({ row }) => {
    //     const count = row.original.numberOfTrips;
    //     return <p className="text-left">{count ?? 0}</p>;
    //   },
    // },
    {
      accessorKey: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => {
        const vehicleId = row.original.id;
        // const availability = row.original.availability

        return (
          <ColumnActions
            targetId={vehicleId}
            onView={onView}
            onEdit={onEdit}
            onDestructiveAction={onDestructiveAction}
          />
        );
      },
    },
  ] as ColumnDef<VehicleData>[];
};
