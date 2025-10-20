import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  MessageSquare,
  NotepadText,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type DriverData, getDriver, getDrivers } from "@/apis/driver";
import {
  type CreateLeaveRequestData,
  CreateLeaveRequestSchema,
  createLeaveRequest,
  type LeaveRequestData,
  updateLeaveRequest,
} from "@/apis/leave-request";
import { driverColumns } from "@/app/admin/drivers/_columns/driver";
import ViewDriver from "@/app/admin/drivers/_components/view";
import DateTimeField from "@/components/form-field/date-time";
import FieldSeparator from "@/components/form-field/field-separator";
import TextAreaField from "@/components/form-field/text-area";
import { DataSelector } from "@/components/selector/data-selector";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { excludeActions } from "@/lib/columnsUtils";
import { cn } from "@/lib/utils";
import { mapParam } from "@/lib/build-query-param";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

interface Props {
  /// Passing default value will convert this component into an editing rather than view
  defaultValue?: LeaveRequestData;
}

export default function CreateForm({ defaultValue }: Props) {
  const router = useRouter();

  const t = useTranslations("Coordinator.leaveRequest");
  const tToast = useTranslations("Coordinator.leaveRequest.toast");

  const form = useForm<CreateLeaveRequestData>({
    resolver: zodResolver(CreateLeaveRequestSchema),
    defaultValues: defaultValue,
  });

  function onSubmit(values: CreateLeaveRequestData) {
    console.log(values);
    toast.promise(createLeaveRequest(values), {
      loading: tToast("create.loading"),
      success: () => {
        router.refresh();
        return tToast("create.success");
      },
      error: (e) => {
        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return tToast("create.error");
      },
    });
  }

  function onEditSubmit(values: CreateLeaveRequestData) {
    if (!defaultValue) return;
    console.log(values);
    toast.promise(updateLeaveRequest(defaultValue.id, values), {
      loading: tToast("edit.loading"),
      success: () => {
        router.refresh();
        return tToast("edit.success");
      },
      error: (e) => {
        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return tToast("edit.error");
      },
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          if (defaultValue) {
            form.handleSubmit(onEditSubmit)(e);
          } else {
            form.handleSubmit(onSubmit)(e);
          }
        }}
        className="flex flex-col gap-2 h-full"
      >
        <FieldSeparator>
          {/* Driver */}
          {!defaultValue && (
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex flex-col items-start w-full gap-2 p-1">
                    <FormLabel className="flex h-full">
                      <User />
                      {t("driver")}
                    </FormLabel>
                    <FormControl>
                      <DataSelector
                        targetData={t("driver")}
                        label={t("selectDriver")}
                        columns={excludeActions<DriverData>(
                          driverColumns,
                        )}
                        fetcher={mapParam(getDrivers)}
                        getTargetId={(row) =>
                          row.original.id
                        }
                        value={field.value}
                        renderView={{
                          fetcher: (id) =>
                            getDriver(id),
                          render: (data) => (
                            <ViewDriver
                              data={data}
                            />
                          ),
                        }}
                        onRowSelect={(row) => {
                          form.setValue(
                            "driverId",
                            row.original.id,
                          );
                        }}
                        onReset={() => {
                          form.setValue(
                            "driverId",
                            "",
                          );
                        }}
                        asChild
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )}

          {/* Reason */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <TextAreaField
                {...field}
                name="reason"
                placeholder={t("placeholders.reason")}
                icon={MessageSquare}
                label={t("placeholders.reason")}
                variant="dropdown"
              />
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <TextAreaField
                {...field}
                name="notes"
                placeholder={t("placeholders.notes")}
                icon={NotepadText}
                label={t("placeholders.notes")}
                variant="dropdown"
              />
            )}
          />

          {/* From */}
          <DateTimeField
            form={form}
            name="startTime"
            icon={Clock}
            label={t("from")}
          />

          {/* To */}
          <DateTimeField
            form={form}
            name="endTime"
            icon={Clock}
            label={t("to")}
          />
        </FieldSeparator>

        {/* Submit */}
        <div className="flex items-end h-full">
          <Button
            className="w-full"
            type="submit"
            variant="secondary"
            disabled={form.formState.isSubmitting}
          >
            {defaultValue
              ? t("actions.update")
              : t("actions.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface DateTimePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const handleDateChange = (date?: Date) => {
    if (!date) return;

    // Preserve the existing time when changing the date
    const newDate = new Date(date);
    if (value) {
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      newDate.setSeconds(value.getSeconds());
    }
    onChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (!time || !value) return;

    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(value);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    onChange(newDate);
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[180px] pl-3 text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            {value ? (
              format(value, "PPP")
            ) : (
              <span>Pick a date</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateChange}
            disabled={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        step="60"
        value={value ? format(value, "HH:mm") : ""}
        onChange={handleTimeChange}
        className="w-[100px] [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </div>
  );
}
