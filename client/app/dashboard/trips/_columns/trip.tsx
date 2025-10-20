/* eslint-disable react-hooks/rules-of-hooks */

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Car, Check, CircleMinus, CopyPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type z from "zod/v4";
import {
  getBookingRequest,
  getBookingRequests,
  getCombinableRequestsForTrip,
} from "@/apis/booking-request";
import {
  addRequestToTrip,
  approveTrip,
  assignVehicleToTrip,
  removeRequestfromTrip,
  type TripData,
  TripSchema,
  uncombineTrip,
} from "@/apis/trip";
import { getAvailableVehiclesForTrip, getVehicle } from "@/apis/vehicle";
import { vehicleColumns } from "@/app/admin/vehicles/owned/_columns/vehicle";
import { ViewVehicle } from "@/app/admin/vehicles/owned/_components/vehicle-sheet";
import { BookingDetailsSheet } from "@/app/requester/bookings/booking-details";
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { f } from "@/components/dashboard-table/filter/table-filter";
import SheetForm from "@/components/dashboard-table/sheet-form";
import TableView from "@/components/dashboard-table/table-view";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dateTimeFormat } from "@/lib/date-time-format";
import type { ColumnProps } from "@/types/column-props";
import { bookingRequestColumns } from "../../bookings/_columns/requests";
import { CombineTripForm } from "../_components/combine-trip-form";
import { apiErrHandler } from "@/lib/error-handling";
import { Errorable } from "@/components/undefinable";

export const tripColumns = ({
  onView,
  onEdit,
  onDestructiveAction,
}: ColumnProps): ColumnDef<TripData>[] => {
  return [
    {
      accessorKey: "id",
      header: () => <p className="text-right">Trip ID</p>,
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return <p className="">{id}</p>;
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
        const status = row.getValue("status") as z.infer<
          typeof TripSchema.shape.status
        >;

        const statusVariants = {
          scheduling: "warning",
          scheduled: "info",
          on_going: "success",
          completed: "success",
          cancelled: "destructive",
        } as const;

        const statusLabels = {
          scheduling: "Scheduling",
          scheduled: "Scheduled",
          on_going: "On Going",
          completed: "Completed",
          cancelled: "Cancelled",
        } as const;

        return (
          <Badge variant={statusVariants[status]}>
            {statusLabels[status]}
          </Badge>
        );
      },
      meta: {
        filter: f.enum(TripSchema.shape.status.options, (opt) => {
          const statusVariants = {
            scheduling: "warning",
            scheduled: "info",
            on_going: "success",
            completed: "success",
            cancelled: "destructive",
          } as const;

          const statusLabels = {
            scheduling: "Scheduling",
            scheduled: "Scheduled",
            on_going: "On Going",
            completed: "Completed",
            cancelled: "Cancelled",
          } as const;

          return (
            <Badge variant={statusVariants[opt]}>
              {statusLabels[opt]}
            </Badge>
          );
        }),
        isSortable: true,
      },
    },
    {
      accessorKey: "departureTime",
      header: "Departure",
      cell: ({ row }) => {
        const departureTime = row.original.departureTime;
        const actualDepartureTime = row.original.actualDepartureTime;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {format(departureTime, dateTimeFormat)}
              </span>
            </div>
            {actualDepartureTime && (
              <div className="text-xs text-muted-foreground">
                Actual:{" "}
                {format(actualDepartureTime, dateTimeFormat)}
              </div>
            )}
          </div>
        );
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "arrivalTime",
      header: "Arrival",
      cell: ({ row }) => {
        const arrivalTime = row.original.arrivalTime;
        const actualArrivalTime = row.original.actualArrivalTime;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {format(arrivalTime, dateTimeFormat)}
              </span>
            </div>
            {actualArrivalTime && (
              <div className="text-xs text-muted-foreground">
                Actual:{" "}
                {format(actualArrivalTime, dateTimeFormat)}
              </div>
            )}
          </div>
        );
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "driver",
      header: "Driver",
      cell: ({ row }) => {
        const driver = row.original.driver;

        return <Errorable variant="missing" value={driver?.name} />;
      },
    },
    {
      accessorKey: "vehicleModel",
      header: "Vehicle",
      cell: ({ row }) => {
        const vehicleModel =
          row.original.vehicle?.model ||
          row.original.outsourcedVehicle?.model;
        const licensePlate =
          row.original.vehicle?.licensePlate ||
          row.original.outsourcedVehicle?.licensePlate;

        if (!vehicleModel)
          return (
            <p className="font-medium italic text-destructive">
              Unassigned
            </p>
          );

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {vehicleModel}
              </span>
            </div>
            {licensePlate && (
              <div className="font-mono text-xs text-muted-foreground">
                {licensePlate}
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "stops",
      header: "Stops",
      cell: ({ row }) => {
        const stops = row.original.stops;

        return (
          <p>
            {stops?.length ?? 0} stop
            {stops && stops.length >= 2 && "s"}
          </p>
        );
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "numberOfPassengers",
      header: () => <p className="">Passengers</p>,
      cell: ({ row }) => {
        const count = row.getValue("numberOfPassengers") as number;

        return <span className="text-sm font-medium">{count}</span>;
      },
    },
    {
      accessorKey: "totalCost",
      header: () => <p className="text">Total Cost</p>,
      cell: ({ row }) => {
        const totalCost = Number(row.original.totalCost);
        return (
          <p className="font-medium">{`${Intl.NumberFormat("vi-VN").format(totalCost)} vnd`}</p>
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
        const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
        const [isVehicleSelectOpen, setIsVehicleSelectOpen] =
          useState<boolean>(false);

        const [isBrSelectOpen, setIsBrSelectOpen] =
          useState<boolean>(false);

        const [isBrRemoveOpen, setIsBrRemoveOpen] =
          useState<boolean>(false);

        const [isDialogOpen, setIsDialogOpen] =
          useState<boolean>(false);

        const router = useRouter();
        const t = useTranslations("Coordinator.trip");

        const tripId = row.original.id;
        const status = row.original.status;

        const handleUncombineSubmit = () => {
          toast.promise(uncombineTrip(tripId), {
            loading: t("toast.uncombine.loading"),
            success: () => {
              router.refresh();
              return t("toast.uncombine.success", { id: tripId });
            },
            error: (e) => {
              const apiErr = apiErrHandler(e);
              if (apiErr) return apiErr;

              return t("toast.uncombine.error", { id: tripId });
            },
          });
        };

        const handleAssignVehicleSubmit = (vehicleId: string) => {
          toast.promise(assignVehicleToTrip(tripId, vehicleId), {
            loading: t("toast.assignVehicle.loading"),
            success: () => {
              router.refresh();
              return t("toast.assignVehicle.success", {
                id: tripId,
                vid: vehicleId,
              });
            },
            error: (e) => {
              const apiErr = apiErrHandler(e);
              if (apiErr) return apiErr;

              return t("toast.assignVehicle.error", {
                id: tripId,
                vid: vehicleId,
              });
            },
          });
        };

        const handleAddingRequestSubmit = (
          bookingRequestId: string,
        ) => {
          toast.promise(addRequestToTrip(tripId, bookingRequestId), {
            loading: t("toast.addRequest.loading"),
            success: () => {
              router.refresh();
              return t("toast.addRequest.success", {
                id: bookingRequestId,
              });
            },
            error: t("toast.addRequest.error", {
              id: bookingRequestId,
            }),
          });
        };

        const handleRemoveRequestSubmit = (
          bookingRequestId: string,
        ) => {
          toast.promise(
            removeRequestfromTrip(tripId, bookingRequestId),
            {
              loading: t("toast.removeRequest.loading"),
              success: () => {
                router.refresh();
                return t("toast.removeRequest.success", {
                  id: bookingRequestId,
                });
              },
              error: (e) => {
                const apiErr = apiErrHandler(e);
                if (apiErr) return apiErr;

                return t("toast.removeRequest.error", {
                  id: bookingRequestId,
                });
              },
            },
          );
        };

        return (
          <>
            <div className="flex items-center justify-end gap-2">
              <ColumnActions
                targetId={tripId}
                onView={onView}
                onEdit={onEdit}
                onDestructiveAction={onDestructiveAction}
                destructiveActionDisable={
                  status === "completed" ||
                  status === "cancelled"
                }
                extrasActions={[
                  // {
                  //   icon: Merge,
                  //   label: "Merge trip",
                  //   onClick: () => setIsSheetOpen(true),
                  // },
                  {
                    icon: Check,
                    label: t("columnsActions.approve"),
                    renderCondition:
                      status === "scheduling",
                    onClick: () => {
                      toast.promise(approveTrip(tripId), {
                        loading: t(
                          "toast.approve.loading",
                        ),
                        success: () => {
                          router.refresh();
                          return t(
                            "toast.approve.success",
                            {
                              id: tripId,
                            },
                          );
                        },
                        error: (e) => {
                          const apiErr =
                            apiErrHandler(e);
                          if (apiErr) return apiErr;

                          return t(
                            "toast.approve.error",
                            {
                              id: tripId,
                            },
                          );
                        },
                      });
                    },
                  },
                  // {
                  // 	icon: Split,
                  // 	label: t("uncombineDialog.button"),
                  // 	onClick: () => setIsDialogOpen(true),
                  // },
                  {
                    icon: Car,
                    renderCondition: status !== "completed",
                    label: t(
                      "columnsActions.assignVehicle",
                    ),
                    onClick: () =>
                      setIsVehicleSelectOpen(true),
                  },
                  {
                    icon: CopyPlus,
                    renderCondition: status !== "completed",
                    label: t(
                      "columnsActions.addBookingRequest",
                    ),
                    onClick: () => setIsBrSelectOpen(true),
                  },
                  {
                    icon: CircleMinus,
                    renderCondition: status !== "completed",
                    label: t(
                      "columnsActions.removeBookingRequest",
                    ),
                    onClick: () => setIsBrRemoveOpen(true),
                  },
                ]}
              />
            </div>
            <AlertDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("uncombineDialog.title")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("uncombineDialog.description")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("uncombineDialog.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleUncombineSubmit()}
                  >
                    {t("uncombineDialog.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <SheetForm
              open={isSheetOpen}
              onOpenChange={setIsSheetOpen}
              state="view"
              config={{
                title: `Merging trip for ${row.original.id}`,
                description: `Merging trip for ${row.original.id}`,
              }}
              renderView={{
                fetcher: () =>
                  new Promise<TripData>((r) =>
                    r(row.original),
                  ),
                render: () => (
                  <CombineTripForm data={row.original} />
                ),
              }}
            />
            <Dialog
              open={isVehicleSelectOpen}
              onOpenChange={setIsVehicleSelectOpen}
            >
              <DialogContent className="min-w-[80dvw] max-w-[80dvw] max-h-[80dvh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Select a request</DialogTitle>
                  <DialogDescription>
                    Click on a row to select a request to
                    add to this trip
                  </DialogDescription>
                </DialogHeader>
                <TableView
                  onRowClick={(row) => {
                    setIsVehicleSelectOpen(false);
                    handleAssignVehicleSubmit(
                      row.original.id,
                    );
                  }}
                  columns={vehicleColumns}
                  fetcher={() =>
                    getAvailableVehiclesForTrip({ tripId })
                  }
                  renderView={{
                    fetcher: (id) => getVehicle(id),
                    render: (data) => (
                      <ViewVehicle vehicle={data} />
                    ),
                  }}
                />
              </DialogContent>
            </Dialog>
            <Dialog
              open={isBrSelectOpen}
              onOpenChange={setIsBrSelectOpen}
            >
              <DialogContent className="min-w-[80dvw] max-w-[80dvw] max-h-[80dvh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Select a request</DialogTitle>
                  <DialogDescription>
                    Click on a row to select a request to
                    remove from this trip
                  </DialogDescription>
                </DialogHeader>
                <TableView
                  onRowClick={(row) => {
                    setIsBrSelectOpen(false);
                    handleAddingRequestSubmit(
                      row.original.id,
                    );
                  }}
                  columns={bookingRequestColumns}
                  fetcher={() =>
                    getCombinableRequestsForTrip(tripId)
                  }
                  renderView={{
                    fetcher: (id) => getBookingRequest(id),
                    render: (data) => (
                      <BookingDetailsSheet
                        className="h-full"
                        bookingId={data.id}
                        booking={data}
                        mobile={false}
                        onCancel={() => { }}
                        coordinator={true}
                        // onBookingChange={onBookingChange}
                        modify={false}
                      />
                    ),
                  }}
                />
              </DialogContent>
            </Dialog>
            <Dialog
              open={isBrRemoveOpen}
              onOpenChange={setIsBrRemoveOpen}
            >
              <DialogContent className="min-w-[80dvw] max-w-[80dvw] max-h-[80dvh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Select a request</DialogTitle>
                  <DialogDescription>
                    Click on a row to remove the selected
                    request from this trip
                  </DialogDescription>
                </DialogHeader>
                <TableView
                  onRowClick={(row) => {
                    setIsBrRemoveOpen(false);
                    handleRemoveRequestSubmit(
                      row.original.id,
                    );
                  }}
                  columns={bookingRequestColumns}
                  fetcher={() =>
                    getBookingRequests({ tripId })
                  }
                  renderView={{
                    fetcher: (id) => getBookingRequest(id),
                    render: (data) => (
                      <BookingDetailsSheet
                        className="h-full"
                        bookingId={data.id}
                        booking={data}
                        mobile={false}
                        onCancel={() => { }}
                        coordinator={true}
                        // onBookingChange={onBookingChange}
                        modify={false}
                      />
                    ),
                  }}
                />
              </DialogContent>
            </Dialog>
          </>
        );
      },
    },
  ] as ColumnDef<TripData>[];
};
