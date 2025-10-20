import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  NotepadText,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import {
  approveLeaveRequest,
  type LeaveRequestData,
  rejectLeaveRequest,
} from "@/apis/leave-request";
import Badge from "@/components/badge";
import FieldSeparator from "@/components/form-field/field-separator";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
import TextViewField from "@/components/ui/view-field";
import { dateTimeFormat } from "@/lib/date-time-format";
import { capitalize } from "@/lib/string-utils";
import { apiErrHandler } from "@/lib/error-handling";
import { DataFetcher } from "@/components/data-fetcher";
import { getDriver } from "@/apis/driver";
import { apiURL } from "@/lib/utils";
import { Errorable } from "@/components/undefinable";
import { getSchedule } from "@/apis/schedule";

interface Props {
  request: LeaveRequestData;
}

export const LeaveRequestView = ({ request }: Props) => {
  const router = useRouter();

  const ta = useTranslations("Coordinator.leaveRequest.actions");
  const tta = useTranslations("Coordinator.leaveRequest.toast.approve");
  const t = useTranslations("Coordinator.leaveRequest");

  const handleApprove = () => {
    toast.promise(approveLeaveRequest(request.id), {
      loading: tta("loading"),
      success: () => {
        router.refresh();
        return tta("success", {
          id: request.id,
        });
      },
      error: (e) => {
        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return tta("error", {
          id: request.id,
        });
      },
    });
  };

  const statusVariants = {
    pending: "warning",
    approved: "success",
    rejected: "destructive",
    cancelled: "destructive",
    completed: "info",
  } as const;

  return (
    <div className="flex flex-col h-full gap-2">
      <FieldSeparator>
        <TextViewField
          icon={User}
          title={t("driver")}
          value={
            <DataFetcher
              urlId={`${apiURL}/drivers/${request.driverId}`}
              fetcher={getDriver(request.driverId)}
              onFetchFinished={(driver) => driver.name}
            />
          }
        />

        <TextViewField
          icon={MessageSquare}
          title={t("reason")}
          value={request.reason}
        />

        <TextViewField
          icon={NotepadText}
          title={t("notes")}
          value={request.notes}
        />

        <TextViewField
          icon={Clock}
          title={t("from")}
          value={format(request.startTime, dateTimeFormat)}
        />

        <TextViewField
          icon={Clock}
          title={t("to")}
          value={format(request.endTime, dateTimeFormat)}
        />

        <TextViewField
          icon={CheckCircle}
          title={t("status")}
          value={
            <Badge variant={statusVariants[request.status]}>
              {capitalize(request.status)}
            </Badge>
          }
        />

        <TextViewField
          icon={Calendar}
          title={t("schedule")}
          value={
            request.scheduleId ? (
              <DataFetcher
                urlId={`${apiURL}/schedules/${request.scheduleId}`}
                fetcher={getSchedule(request.scheduleId)}
                onFetchFinished={(schedule) => schedule.title}
              />
            ) : (
              <Errorable shouldError variant="missing" />
            )
          }
        />

        <TextViewField
          icon={Calendar}
          title={t("createdAt")}
          value={format(request.createdAt, dateTimeFormat)}
        />

        <TextViewField
          icon={Calendar}
          title={t("updatedAt")}
          value={format(
            request.updatedAt ?? request.createdAt,
            dateTimeFormat,
          )}
        />
      </FieldSeparator>

      {/* Actions */}
      {request.status === "pending" && (
        <div className="flex items-end h-full gap-3">
          <Button
            variant="success"
            className="flex-1"
            onClick={() => handleApprove()}
          >
            {ta("approve")}
          </Button>
          <RejectButton request={request} />
        </div>
      )}
    </div>
  );
};

const RejectButton = ({ request }: { request: LeaveRequestData }) => {
  const ta = useTranslations("Coordinator.leaveRequest.actions");
  const ttr = useTranslations("Coordinator.leaveRequest.toast.reject");
  const trd = useTranslations("Coordinator.leaveRequest.rejectDialog");

  const router = useRouter();

  const RejectSchema = z.object({
    reason: z.string("Reason cant be empty"),
  });

  const form = useForm<z.infer<typeof RejectSchema>>({
    resolver: zodResolver(RejectSchema),
  });

  const handleReject = (data: z.infer<typeof RejectSchema>) => {
    toast.promise(rejectLeaveRequest(request.id, data.reason), {
      loading: ttr("loading"),
      success: () => {
        router.refresh();
        return ttr("success", {
          id: request.id,
        });
      },
      error: (e) => {
        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return ttr("error", {
          id: request.id,
        });
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="flex-1">
          {ta("reject")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleReject)}
            className="flex flex-col gap-4"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{trd("title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {trd("description")}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{trd("label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={trd("placeholder")}
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
              <Button type="submit" variant="destructive">
                {trd("confirm")}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
