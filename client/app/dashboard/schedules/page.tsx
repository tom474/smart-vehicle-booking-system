"use client";

import { deleteSchedule, getSchedule, getSchedules } from "@/apis/schedule";
import TableView from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { scheduleColumns } from "./_columns/schedule";
import { ViewSchedule } from "./_components/view";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";
import { CreateSchedule } from "./_components/create-form";

export default function Schedules() {
  const router = useRouter();

  const tToast = useTranslations("Coordinator.schedule.toast");

  return (
    <TableView
      targetDataStr="Schedule"
      tableConfig={{
        columnVisibility: {
          createdAt: false,
          updatedAt: false,
        },
      }}
      columns={scheduleColumns}
      fetcher={mapParam(getSchedules)}
      renderView={{
        fetcher: (id) => getSchedule(id),
        render: (data) => <ViewSchedule data={data} />,
      }}
      renderCreate={<CreateSchedule />}
      renderEdit={{
        fetcher: (id) => getSchedule(id),
        render: (data) => <CreateSchedule defaultValue={data} />,
      }}
      renderDestructiveAction={{
        onSubmit(id) {
          toast.promise(deleteSchedule(id), {
            loading: tToast("delete.loading"),
            success: () => {
              router.refresh();
              return tToast("delete.success", {
                id: id,
              });
            },
            error: (e) => {
              const apiErr = apiErrHandler(e);
              if (apiErr) return apiErr;

              return tToast("delete.error", {
                id: id,
              });
            },
          });
        },
      }}
    />
  );
}
