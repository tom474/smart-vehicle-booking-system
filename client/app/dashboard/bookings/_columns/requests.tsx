/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useSetAtom } from "jotai";
import { Car, Check, CircleOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import {
  type BookingRequestData,
  BookingRequestSchema,
  rejectBookingRequest,
} from "@/apis/booking-request";
import { getUser } from "@/apis/user";
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { f } from "@/components/dashboard-table/filter/table-filter";
import { DataFetcher } from "@/components/data-fetcher";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { ColumnProps } from "@/types/column-props";
import { alertCancelAtom } from "../_components/cancel-alert-dialog";
import { Button } from "@/components/ui/button";
import { capitalize } from "@/lib/string-utils";
import { apiErrHandler } from "@/lib/error-handling";
import AssignVehicle from "@/app/requester/bookings/_components/assign-vehicle";

type Request = {
  id: string;
  passengers: string;
  driver: string;
  timeStamp: string;
  status: "Approved" | "Pending" | "Outsourced" | "Cancelled";
  actions: ReactNode;
};

export const bookingRequestColumns = ({
  onView,
  onEdit,
  onDestructiveAction: onDelete,
}: ColumnProps): ColumnDef<BookingRequestData>[] => [
    {
      accessorKey: "id",
      header: () => <p>ID</p>,
      cell: ({ row }) => <p>{row.original.id}</p>,
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
          typeof BookingRequestSchema.shape.status
        >;
        switch (status) {
          case "cancelled":
            return <Badge variant="destructive">Cancelled</Badge>;
          case "rejected":
            return <Badge variant="destructive">Rejected</Badge>;
          case "pending":
            return <Badge variant="warning">Pending</Badge>;
          case "completed":
            return <Badge variant="success">Completed</Badge>;
          case "approved":
            return <Badge variant="success">Approved</Badge>;
        }
      },
      meta: {
        filter: f.enum(BookingRequestSchema.shape.status.options, (opt) => {
          switch (opt) {
            case "cancelled":
              return <Badge variant="destructive">Cancelled</Badge>;
            case "pending":
              return <Badge variant="warning">Pending</Badge>;
            case "completed":
              return <Badge variant="success">Completed</Badge>;
            case "approved":
              return <Badge variant="success">Approved</Badge>;
            case "rejected":
              return <Badge variant="destructive">Rejected</Badge>;
          }
        }),
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as z.infer<
          typeof BookingRequestSchema.shape.priority
        >;
        switch (priority) {
          case "normal":
            return <Badge variant="info">{capitalize(priority)}</Badge>;
          case "high":
            return (
              <Badge variant="warning">{capitalize(priority)}</Badge>
            );
          case "urgent":
            return (
              <Badge variant="destructive">
                {capitalize(priority)}
              </Badge>
            );
        }
      },
      meta: {
        filter: f.enum(
          BookingRequestSchema.shape.priority.options,
          (opt) => {
            switch (opt) {
              case "normal":
                return (
                  <Badge variant="info">{capitalize(opt)}</Badge>
                );
              case "high":
                return (
                  <Badge variant="warning">
                    {capitalize(opt)}
                  </Badge>
                );
              case "urgent":
                return (
                  <Badge variant="destructive">
                    {capitalize(opt)}
                  </Badge>
                );
            }
          },
        ),
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return <p className="capitalize">{type.replaceAll("_", " ")}</p>;
      },
      meta: {
        filter: f.enum(BookingRequestSchema.shape.type.options, (opt) => {
          return <p className="capitalize">{opt.replaceAll("_", " ")}</p>;
        }),
      },
    },
    {
      accessorKey: "requesterId",
      header: "Requester",
      cell: ({ row }) => {
        const reqId = row.original.requesterId;

        return (
          <DataFetcher
            urlId={`/api/users/${reqId}`}
            loading={reqId}
            fetcher={getUser(reqId)}
            onFetchFinished={(user) => user.name}
          />
        );
      },
      meta: {
        isSearchable: {
          id: "requesterName",
        },
      },
    },
    {
      accessorKey: "contactName",
      header: "Contact Name",
      cell: ({ row }) => {
        const name = row.original.contactName;
        return <p className="truncate max-w-32">{name}</p>;
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "contactPhoneNumber",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.original.contactPhoneNumber;
        return <p>{phone}</p>;
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "numberOfPassengers",
      header: "Passengers",
      cell: ({ row }) => {
        const count = row.original.numberOfPassengers;
        return <p>{count}</p>;
      },
      meta: {
        filter: f.number(
          "minNumberOfPassengers",
          0,
          "maxNumberOfPassengers",
          100,
          1,
        ),
      },
    },
    {
      accessorKey: "tripPurpose",
      header: "Purpose",
      cell: ({ row }) => {
        const purpose = row.original.tripPurpose;
        return (
          <p className="truncate max-w-40">
            {purpose || (
              <span className="text-muted-foreground">-</span>
            )}
          </p>
        );
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => {
        const note = row.original.note;
        return (
          <p className="truncate max-w-40">
            {note || <span className="text-muted-foreground">-</span>}
          </p>
        );
      },
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },

    {
      accessorKey: "isReserved",
      header: "Reserved",
      cell: ({ row }) => {
        const isReserved = row.original.isReserved;
        return isReserved ? (
          <Check className="text-success" />
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      meta: {
        filter: f.boolean(),
      },
    },
    {
      accessorKey: "departureLocation",
      header: "From",
      cell: ({ row }) => {
        const location = row.original.departureLocation;
        return (
          <p className="truncate max-w-32">{location?.name || "N/A"}</p>
        );
      },
    },
    {
      accessorKey: "departureTime",
      header: "Departure Time",
      cell: ({ row }) => {
        const dateTime = row.original.departureTime;
        return <p>{format(dateTime, "HH:mm - dd/MM/yyyy")}</p>;
      },
      meta: {
        isSortable: true,
        filterConfig: {
          label: "Departure Time",
        },
        filter: f.dateRange(
          "departureTimeFrom",
          undefined,
          "departureTimeTo",
          undefined,
        ),
      },
    },
    {
      accessorKey: "arrivalLocation",
      header: "To",
      cell: ({ row }) => {
        const location = row.original.arrivalLocation;
        return (
          <p className="truncate max-w-32">{location?.name || "N/A"}</p>
        );
      },
    },
    {
      accessorKey: "arrivalTime",
      header: "Arrival Deadline",
      cell: ({ row }) => {
        const dateTime = row.original.arrivalTime;
        return <p>{format(dateTime, "HH:mm - dd/MM/yyyy")}</p>;
      },
      meta: {
        isSortable: true,
        filterConfig: {
          label: "Arrival Time",
        },
        filter: f.dateRange(
          "arrivalTimeFrom",
          undefined,
          "arrivalTimeTo",
          undefined,
        ),
      },
    },
    {
      accessorKey: "returnDepartureLocation",
      header: "Return From",
      cell: ({ row }) => {
        const location = row.original.returnDepartureLocation;
        return (
          <p className="truncate max-w-32">
            {location?.name || (
              <span className="text-muted-foreground">-</span>
            )}
          </p>
        );
      },
    },
    {
      accessorKey: "returnDepartureTime",
      header: "Return Departure",
      cell: ({ row }) => {
        const dateTime = row.original.returnDepartureTime;
        const type = row.original.type;
        if (type === "round_trip" && dateTime) {
          return <p>{format(dateTime, "HH:mm - dd/MM/yyyy")}</p>;
        }
        return <span className="text-muted-foreground">-</span>;
      },
      meta: {
        isSortable: true,
      },
    },
    {
      accessorKey: "returnArrivalLocation",
      header: "Return To",
      cell: ({ row }) => {
        const location = row.original.returnArrivalLocation;
        return (
          <p className="truncate max-w-32">
            {location?.name || (
              <span className="text-muted-foreground">-</span>
            )}
          </p>
        );
      },
    },
    {
      accessorKey: "returnArrivalTime",
      header: "Return Arrival",
      cell: ({ row }) => {
        const dateTime = row.original.returnArrivalTime;
        const type = row.original.type;
        return type === "round_trip" && dateTime ? (
          <p>{format(dateTime, "HH:mm - dd/MM/yyyy")}</p>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      meta: {
        isSortable: true,
      },
    },
    {
      accessorKey: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => {
        const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
        const [isVehicleSelectOpen, setIsVehicleSelectOpen] =
          useState<boolean>(false);

        const alert = useSetAtom(alertCancelAtom);

        const router = useRouter();
        const t = useTranslations("Coordinator.bookingRequest");
        // const tToast = useTranslations("Coordinator.bookingRequest.toast");
        const trd = useTranslations(
          "Coordinator.bookingRequest.dialog.reject",
        );

        const RejectSchema = z.object({
          reason: z.string("Reason cant be empty"),
        });

        // const fetchBookingData = async () => {
        //   setIsLoading(true);
        //   // Fetch booking data if not provided
        //   if (!booking) {
        //     try {
        //       const data = await getBookingRequest(bookingId);
        //       setBookingData(data);
        //       if (data && data.status !== "pending") {
        //         setDisableFields(true);
        //       }
        //       let trips: TripTicketData[] | TripData[] = [];
        //       if (coordinator) {
        //         trips = await getTrips({
        //           bookingRequestId: data.id,
        //         });
        //       } else {
        //         trips = await getTripTickets({
        //           userId: data.requesterId,
        //           bookingRequestId: data.id,
        //         });
        //       }
        //       const _sortedTrips = trips.sort(
        //         (a, b) =>
        //           new Date(a.departureTime).getTime() -
        //           new Date(b.departureTime).getTime(),
        //       );
        //       setSortedTrips(_sortedTrips || []);
        //     } catch (error) {
        //       console.error("Failed to fetch booking:", error);
        //     } finally {
        //       setIsLoading(false);
        //     }
        //   } else {
        //     setBookingData(booking);
        //     if (booking.status !== "pending") {
        //       setDisableFields(true);
        //     }
        //     let trips: TripTicketData[] | TripData[] = [];
        //     if (coordinator) {
        //       trips = await getTrips({
        //         bookingRequestId: booking.id,
        //       });
        //     } else {
        //       trips = await getTripTickets({
        //         userId: booking.requesterId,
        //         bookingRequestId: booking.id,
        //       });
        //     }
        //     const _sortedTrips = trips.sort(
        //       (a, b) =>
        //         new Date(a.departureTime).getTime() -
        //         new Date(b.departureTime).getTime(),
        //     );
        //     setSortedTrips(_sortedTrips || []);
        //     setIsLoading(false);
        //   }
        // };

        const form = useForm<z.infer<typeof RejectSchema>>({
          resolver: zodResolver(RejectSchema),
        });

        const bookingId = row.original.id;
        const status = row.original.status;

        // const handleAssignVehicleSubmit = (vehicleId: string) => {
        //   toast.promise(assignVehicleToBookingReq(bookingId, vehicleId), {
        //     loading: tToast("assignVehicle.loading"),
        //     success: () => {
        //       router.refresh();
        //       return tToast("assignVehicle.success", {
        //         id: bookingId,
        //       });
        //     },
        //     error: (e) => {
        //       const apiErr = apiErrHandler(e);
        //       if (apiErr) return apiErr;
        //
        //       return tToast("assignVehicle.error", {
        //         id: bookingId,
        //       });
        //     },
        //   });
        // };

        const handleRejectSubmit = () => {
          toast.promise(rejectBookingRequest(bookingId), {
            loading: t("toast.reject.loading"),
            success: () => {
              router.refresh();
              return t("toast.reject.success", { id: bookingId });
            },
            error: (e) => {
              const apiErr = apiErrHandler(e);
              if (apiErr) return apiErr;

              return t("toast.reject.error", { id: bookingId });
            },
          });
        };

        return (
          <div className="flex items-center justify-end gap-2">
            <ColumnActions
              targetId={bookingId ?? "N/A"}
              onView={onView}
              onEdit={onEdit}
              editDisable={status !== "pending"}
              onDestructiveAction={onDelete}
              extrasActions={[
                {
                  icon: Car,
                  label: "Assign vehicle",
                  //renderCondition: status === "pending",
                  onClick() {
                    setIsVehicleSelectOpen(true);
                  },
                },
                {
                  icon: CircleOff,
                  label: t("dialog.cancel.button"),
                  renderCondition: status === "pending",
                  onClick: (id) => alert(id),
                },
                {
                  icon: X,
                  label: trd("button"),
                  renderCondition: status === "pending",
                  onClick: () => setIsDialogOpen(true),
                },
              ]}
            />

            <AssignVehicle
              detach
              open={isVehicleSelectOpen}
              onOpenChange={setIsVehicleSelectOpen}
              bookingRequestId={bookingId}
            />

            <AlertDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            >
              <AlertDialogContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(
                      handleRejectSubmit,
                    )}
                    className="flex flex-col gap-4"
                  >
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {trd("title")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {trd("description")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {trd("label")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={trd(
                                "placeholder",
                              )}
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {trd("cancel")}
                      </AlertDialogCancel>
                      <Button
                        type="submit"
                        variant="destructive"
                      >
                        {trd("confirm")}
                      </Button>
                    </AlertDialogFooter>
                  </form>
                </Form>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

export type { Request };
