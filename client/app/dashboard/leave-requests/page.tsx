"use client";

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
  deleteLeaveRequest,
  getLeaveRequestById,
  getLeaveRequests,
} from "@/apis/leave-request";
import SheetForm from "@/components/dashboard-table/sheet-form";
import TableView from "@/components/dashboard-table/table-view";
import { type CalendarEvent, EventCalendar } from "@/components/event-calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leaveRequestColumns } from "./_columns/leave-request";
import CreateForm from "./_components/create";
import { LeaveRequestView } from "./_components/view";
import { mapParam } from "@/lib/build-query-param";
import { useRouter } from "next/navigation";
import { apiErrHandler } from "@/lib/error-handling";

function LeaveRequest() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [id, setId] = useState("");

  const router = useRouter();

  const { data, error } = useSWR("/api/leave-requests", () =>
    getLeaveRequests({}),
  );

  console.log(data);
  console.log(error);
  if (error) return <p>Error</p>;
  if (!data) return;

  const events: CalendarEvent[] = data
    .filter((d) => d.status === "pending")
    .map((d) => {
      return {
        id: d.id,
        title: d.schedule?.title ?? d.driver?.name,
        start: d.startTime,
        end: d.endTime,
        color: "rose",
      } as CalendarEvent;
    });

  return (
    <>
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent className="space-y-2" value="table">
          <TableView
            targetDataStr="Leave Request"
            columns={leaveRequestColumns}
            fetcher={mapParam(getLeaveRequests)}
            renderCreate={<CreateForm />}
            renderView={{
              fetcher: (id) => getLeaveRequestById(id),
              render: (data) => (
                <LeaveRequestView request={data} />
              ),
            }}
            renderEdit={{
              fetcher: (id) => getLeaveRequestById(id),
              render: (data) => (
                <CreateForm defaultValue={data} />
              ),
            }}
            renderDestructiveAction={{
              onSubmit: (id) => {
                toast.promise(deleteLeaveRequest(id), {
                  loading: "Deleting leave request...",
                  success: () => {
                    router.refresh();
                    return `Leave request updated successfully`;
                  },
                  error: (e) => {
                    const apiErr = apiErrHandler(e);
                    if (apiErr) return apiErr;

                    return `Could not delete leave request #${id}, please try again later`;
                  },
                });
              },
              alertTitle:
                "Are you sure you want to delete this leave schedule?",
              alertDescription: "This action cannot be undone.",
            }}
          />
        </TabsContent>
        <TabsContent value="calendar">
          <EventCalendar
            events={events}
            onEventSelect={(e) => {
              setId(e.id);
              setIsSheetOpen(true);
            }}
            disableCreateEvent
          />
        </TabsContent>
      </Tabs>
      <SheetForm
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        state="view"
        config={{
          description: `Viewing #${id}`,
        }}
        renderView={{
          fetcher: () => getLeaveRequestById(id),
          render: (data) => <LeaveRequestView request={data} />,
        }}
      />
    </>
  );
}

export default LeaveRequest;
