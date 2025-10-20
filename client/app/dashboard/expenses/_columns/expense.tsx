/* eslint-disable react-hooks/rules-of-hooks */
import type { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getDriver } from "@/apis/driver";
import {
  approveExpense,
  type ExpenseData,
  ExpenseSchema,
  rejectExpense,
} from "@/apis/expense";
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { f } from "@/components/dashboard-table/filter/table-filter";
import { DataFetcher } from "@/components/data-fetcher";
import { Errorable } from "@/components/undefinable";
import { capitalize, splitStr } from "@/lib/string-utils";
import type { ColumnProps } from "@/types/column-props";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiErrHandler } from "@/lib/error-handling";

export const expenseColumns = ({
  onView,
  onEdit,
  onDestructiveAction: onDelete,
}: ColumnProps): ColumnDef<ExpenseData>[] => {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <p className="text-left">{row.original.id}</p>,
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <p className="capitalize">
          {row.original ? row.original.type : "N/A"}
        </p>
      ),
      meta: {
        filter: f.enum(
          [
            "trip",
            "vehicleService",
            "tolls",
            "parkings",
            "repair",
            "fuel",
            "operational",
          ],
          (opt) => {
            return (
              <div className="flex items-center">
                {splitStr(capitalize(opt))}
              </div>
            );
          },
        ),
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="font-semibold truncate">
          {row.original.description}
        </p>
      ),
      meta: {
        isSearchable: true,
        isSortable: true,
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="font-semibold">
          {row.original
            ? `${Intl.NumberFormat("vi-VN").format(row.original.amount)} VND`
            : "N/A"}
        </p>
      ),
      meta: {
        isSortable: true,
        filter: f.number(
          "minAmount",
          0,
          "maxAmount",
          10000000,
          1,
          (v) => `${Intl.NumberFormat("vi-VN").format(v)} VND`,
        ),
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        if (!row.original) {
          return <p>N/A</p>;
        }
        const status = row.original.status;
        const variant =
          status === "pending"
            ? "warning"
            : status === "approved"
              ? "success"
              : "destructive";
        return (
          <Badge variant={variant} className="capitalize">
            {status}
          </Badge>
        );
      },
      meta: {
        filter: f.enum(ExpenseSchema.shape.status.options, (opt) => {
          const variant =
            opt === "pending"
              ? "warning"
              : opt === "approved"
                ? "success"
                : "destructive";

          return (
            <Badge variant={variant} className="capitalize">
              {opt}
            </Badge>
          );
        }),
      },
    },
    {
      accessorKey: "driverId",
      header: "Driver Name",
      cell: ({ row }) => {
        const driverId = row.original.driverId;

        if (!driverId)
          return <Errorable variant="missing" shouldError />;

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
        isSearchable: { id: "driverName" },
      },
    },
    {
      accessorKey: "tripId",
      header: "Trip ID",
      cell: ({ row }) => (
        <Errorable variant="missing" value={row.original.tripId} />
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) =>
        row.original?.createdAt ? (
          <p>{new Date(row.original.createdAt).toLocaleString()}</p>
        ) : (
          <p>N/A</p>
        ),
      meta: {
        isSortable: true,
        filterConfig: {
          label: "Created At",
        },
        filter: f.dateRange(
          "createdAfter",
          undefined,
          "createdBefore",
          undefined,
        ),
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) =>
        row.original?.updatedAt ? (
          <p>{new Date(row.original.updatedAt).toLocaleString()}</p>
        ) : (
          <p>N/A</p>
        ),
      meta: {
        isSortable: true,
      },
    },
    {
      accessorKey: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <div className="text-right w-full">Actions</div>,
      cell: ({ row }) => {
        const expenseId = row.original.id;
        const status = row.original.status;

        const RejectSchema = z.object({
          reason: z.string("Reason cant be empty"),
        });

        const [isDialogOpen, setIsDialogOpen] = useState(false);
        const form = useForm<z.infer<typeof RejectSchema>>({
          resolver: zodResolver(RejectSchema),
        });

        const router = useRouter();

        const t = useTranslations("Coordinator.expenses.toast");
        const tca = useTranslations("DataTable.columnActions");
        const trd = useTranslations(
          "Coordinator.expenses.rejectDialog",
        );

        function onSubmit(data: z.infer<typeof RejectSchema>) {
          toast.promise(rejectExpense(expenseId, data.reason), {
            loading: t("reject.loading"),
            success: () => {
              router.refresh();
              return t("reject.success");
            },
            error: (e) => {
              const apiErr = apiErrHandler(e);
              if (apiErr) return apiErr;

              return t("reject.error", { id: expenseId });
            },
          });
        }

        return (
          <>
            <ColumnActions
              targetId={expenseId ?? "N/A"}
              onView={onView}
              onEdit={onEdit}
              onDestructiveAction={onDelete}
              extrasActions={[
                {
                  icon: Check,
                  label: tca("approve"),
                  renderCondition:
                    status === "pending" ||
                    status === "rejected",
                  onClick(id) {
                    toast.promise(approveExpense(id), {
                      loading: t("approve.loading"),
                      success: () => {
                        router.refresh();
                        return t("approve.success");
                      },
                      error: (e) => {
                        const apiErr = apiErrHandler(e);
                        if (apiErr) return apiErr;

                        return t("approve.error", {
                          id,
                        });
                      },
                    });
                  },
                },
                {
                  icon: X,
                  label: tca("reject"),
                  renderCondition: status === "pending",
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
          </>
        );
      },
    },
  ];
};
