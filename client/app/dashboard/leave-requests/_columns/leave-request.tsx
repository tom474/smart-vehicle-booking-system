/* eslint-disable react-hooks/rules-of-hooks */

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import { getDriver } from "@/apis/driver";
import {
  approveLeaveRequest,
  type LeaveRequestData,
  LeaveRequestSchema,
  rejectLeaveRequest,
} from "@/apis/leave-request";
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
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Errorable } from "@/components/undefinable";
import { dateFormat, dateTimeFormat } from "@/lib/date-time-format";
import { apiErrHandler } from "@/lib/error-handling";
import { capitalize } from "@/lib/string-utils";
import type { ColumnProps } from "@/types/column-props";

export const leaveRequestColumns = ({
  onView,
  onEdit,
  onDestructiveAction,
}: ColumnProps): ColumnDef<LeaveRequestData>[] => {
  return [
    {
      accessorKey: "id",
      header: () => <p className="text-right">Request ID</p>,
      cell: ({ row }) => {
        const id = row.original.id;
        return <p className="text-left">{id}</p>;
      },
      meta: {
        isSortable: true,
        isSearchable: true,
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;

        const statusVariants = {
          pending: "warning",
          approved: "success",
          rejected: "destructive",
          cancelled: "destructive",
          completed: "info",
        } as const;

        return (
          <div className="flex items-center">
            <Badge variant={statusVariants[status]}>
              {capitalize(status)}
            </Badge>
          </div>
        );
      },
      meta: {
        filter: f.enum(
          LeaveRequestSchema.shape.status.options,
          (opt) => {
            const statusVariants = {
              pending: "warning",
              approved: "success",
              rejected: "destructive",
              cancelled: "destructive",
              completed: "info",
            } as const;

            return (
              <div className="flex items-center">
                <Badge variant={statusVariants[opt]}>
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

        if (!driverId) return <Errorable shouldError />;

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
          id: "Name",
        },
      },
    },
    {
      accessorKey: "startTime",
      header: "From",
      cell: ({ row }) => {
        const startTime = row.original.startTime;
        return (
          <div className="flex gap-1 items-center">
            <span className="text-sm font-medium">
              {format(startTime, dateTimeFormat)}
            </span>
          </div>
        );
      },
      meta: {
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
      cell: ({ row }) => {
        const endTime = row.original.endTime;
        return (
          <div className="flex gap-1 items-center">
            <span className="text-sm font-medium">
              {format(endTime, dateTimeFormat)}
            </span>
          </div>
        );
      },
      meta: {
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
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.original.reason;
        return (
          <Errorable
            variant="missing"
            value={reason}
            errorMsg="No reason provided"
          />
        );
      },
      meta: {
        isSortable: true,
        isSearchable: true,
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.original.notes;
        return (
          <Errorable variant="missing" value={notes} errorMsg="-" />
        );
      },
      meta: {
        isSortable: true,
        isSearchable: true,
      },
    },
    // {
    // 	accessorKey: "schedule",
    // 	header: "Schedule",
    // 	cell: ({ row }) => {
    // 		const schedule = row.original.schedule;
    // 		if (!schedule)
    // 			return <p className="text-muted-foreground">No schedule</p>;
    //
    // 		return (
    // 			<div className="space-y-1">
    // 				<div className="flex items-center gap-1">
    // 					<AlertCircle className="size-3 text-muted-foreground" />
    // 					<span className="text-sm font-medium">
    // 						{capitalize(schedule.status)}
    // 					</span>
    // 				</div>
    // 				<div className="text-xs text-muted-foreground">
    // 					{format(schedule.startTime, "MMM dd")} -{" "}
    // 					{format(schedule.endTime, "MMM dd")}
    // 				</div>
    // 			</div>
    // 		);
    // 	},
    // },
    {
      accessorKey: "createdAt",
      header: "Requested on",
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        return <div>{format(createdAt, dateFormat)}</div>;
      },
      meta: {
        isSortable: true,
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Last modified",
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        const updatedAt = row.original.updatedAt;

        return <div>{format(updatedAt || createdAt, dateFormat)}</div>;
      },
      meta: {
        isSortable: true,
      },
    },
    {
      accessorKey: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <div className="text-right hidden">Actions</div>,
      cell: ({ row }) => {
        const requestId = row.original.id;
        const status = row.original.status;

        const router = useRouter();

        const RejectSchema = z.object({
          reason: z.string("Reason cant be empty"),
        });

        const [isDialogOpen, setIsDialogOpen] = useState(false);
        const form = useForm<z.infer<typeof RejectSchema>>({
          resolver: zodResolver(RejectSchema),
        });

        const t = useTranslations("Coordinator.leaveRequest.toast");
        const tca = useTranslations("DataTable.columnActions");
        const trd = useTranslations(
          "Coordinator.leaveRequest.rejectDialog",
        );

        function onSubmit(data: z.infer<typeof RejectSchema>) {
          toast.promise(rejectLeaveRequest(requestId, data.reason), {
            loading: t("reject.loading"),
            success: () => {
              router.refresh();
              return t("reject.success");
            },
            error: (e) => {
              const apiErr = apiErrHandler(e);
              if (apiErr) return apiErr;

              return t("reject.error", { id: requestId });
            },
          });
        }

        return (
          <div className="flex items-center justify-end gap-2">
            <ColumnActions
              targetId={requestId}
              onView={onView}
              onEdit={onEdit}
              onDestructiveAction={onDestructiveAction}
              destructiveActionDisable={status !== "pending"}
              extrasActions={[
                {
                  icon: Check,
                  label: tca("approve"),
                  renderCondition: status !== "approved",
                  onClick(id) {
                    toast.promise(approveLeaveRequest(id), {
                      loading:
                        "Approving leave request...",
                      success: () => {
                        router.refresh();
                        return `Leave request updated successfully`;
                      },
                      error: (e) => {
                        const apiErr = apiErrHandler(e);
                        if (apiErr) return apiErr;

                        return `Could not approve leave request #${id}, please try again later`;
                      },
                    });
                  },
                },
                {
                  icon: X,
                  label: tca("reject"),
                  renderCondition: status !== "rejected",
                  onClick() {
                    setIsDialogOpen(true);
                  },
                },
              ]}
            />
            <AlertDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            >
              <AlertDialogContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
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
  ] as ColumnDef<LeaveRequestData>[];
};
