import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { getTrip } from "@/apis/trip";
import type { TripFeedbackData } from "@/apis/trip-feedback";
import { getUser } from "@/apis/user";
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { DataFetcher } from "@/components/data-fetcher";
import { Errorable } from "@/components/undefinable";
import type { ColumnProps } from "@/types/column-props";
import { dateTimeFormat } from "@/lib/date-time-format";

export const feedbackColumns = ({
  onView,
  onEdit,
  onDestructiveAction: onDelete,
}: ColumnProps): ColumnDef<TripFeedbackData>[] => {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <p className="font-mono text-xs">{row.original.id}</p>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        if (!row.original) return <p>N/A</p>;
        const rating = row.original.rating;
        const variant: "success" | "info" | "warning" | "destructive" =
          rating >= 4
            ? "success"
            : rating === 3
              ? "info"
              : rating === 2
                ? "warning"
                : "destructive";
        return <Badge variant={variant}>{rating} / 5</Badge>;
      },
    },
    {
      accessorKey: "comment",
      header: "Comment",
      cell: ({ row }) =>
        row.original.comment ? (
          <p>{row.original.comment}</p>
        ) : (
          <p className="italic text-muted-foreground">No comment</p>
        ),
    },
    {
      accessorKey: "userId",
      header: "Reviewed by",
      cell: ({ row }) => {
        const userId = row.original.userId;

        return (
          <DataFetcher
            urlId={`/api/users/${userId}`}
            loading={userId}
            fetcher={getUser(userId)}
            onFetchFinished={(user) => user.name}
          />
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Reviewed at",
      cell: ({ row }) =>
        row.original.createdAt ? (
          <p>{format(row.original.createdAt, dateTimeFormat)}</p>
        ) : (
          <Errorable shouldError />
        ),
    },
    {
      header: "Driver",
      cell: ({ row }) => {
        const tripId = row.original.tripId;

        return (
          <DataFetcher
            urlId={`/api/trips/${tripId}`}
            loading={tripId}
            fetcher={getTrip(tripId)}
            onFetchFinished={(trip) => {
              return <Errorable value={trip.driver?.name} />;
            }}
          />
        );
      },
    },
    {
      accessorKey: "tripId",
      header: "Trip ID",
      cell: ({ row }) => <p>{row.original.tripId}</p>,
    },
    {
      accessorKey: "actions",
      enableSorting: false,
      enableHiding: false,
      header: undefined,
      cell: ({ row }) => {
        const feedbackId = row.original.id;
        return (
          <ColumnActions
            targetId={feedbackId}
            onView={onView}
            onEdit={onEdit}
            onDestructiveAction={onDelete}
          />
        );
      },
    },
  ];
};
