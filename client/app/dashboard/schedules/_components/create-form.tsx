"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Clock, MessageSquareText, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type DriverData, getDriver, getDrivers } from "@/apis/driver";
import {
  type CreateScheduleData,
  CreateScheduleSchema,
  createSchedule,
  type ScheduleData,
  type UpdateScheduleData,
  updateSchedule,
} from "@/apis/schedule";
import { getVehicle, getVehicles, type VehicleData } from "@/apis/vehicle";
import { driverColumns } from "@/app/admin/drivers/_columns/driver";
import ViewDriver from "@/app/admin/drivers/_components/view";
import { vehicleColumns } from "@/app/admin/vehicles/owned/_columns/vehicle";
import { ViewVehicle } from "@/app/admin/vehicles/owned/_components/vehicle-sheet";
import DateTimeField from "@/components/form-field/date-time";
import FieldSeparator from "@/components/form-field/field-separator";
import TextInputField from "@/components/form-field/input";
import { DataSelector } from "@/components/selector/data-selector";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { mapParam } from "@/lib/build-query-param";
import { excludeActions } from "@/lib/columnsUtils";
import { apiErrHandler } from "@/lib/error-handling";
import { useRouter } from "next/navigation";

interface Props {
  defaultValue?: ScheduleData;
}

export const CreateSchedule = ({ defaultValue }: Props) => {
  const router = useRouter();

  const form = useForm<CreateScheduleData>({
    resolver: zodResolver(CreateScheduleSchema),
    defaultValues: defaultValue,
  });

  function onSubmit(values: CreateScheduleData) {
    toast.promise(createSchedule(values), {
      loading: "Submitting schedule...",
      success: () => {
        router.refresh();
        return "Schedule submitted!";
      },
      error: (e) => {
        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return "Failed to submit schedule.";
      },
    });
  }

  function onEditSubmit(values: UpdateScheduleData) {
    if (!defaultValue) return;
    toast.promise(updateSchedule(defaultValue.id, values), {
      loading: "Editing expense...",
      success: () => {
        router.refresh();
        return "Expense Edited";
      },
      error: (e) => {
        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return "Failed to edit expense, please try again later.";
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
        className="flex flex-col h-full gap-6"
      >
        <FieldSeparator>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <TextInputField
                {...field}
                variant="dropdown"
                icon={MessageSquareText}
                label="Title"
                placeholder="Title"
              />
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <TextInputField
                {...field}
                value={field.value ?? undefined}
                variant="dropdown"
                icon={MessageSquareText}
                label="Description"
                placeholder="Description"
              />
            )}
          />

          <DateTimeField
            form={form}
            name="startTime"
            icon={Clock}
            label={"From"}
          />

          <DateTimeField
            form={form}
            name="endTime"
            icon={Clock}
            label="To"
          />

          {!defaultValue && (
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex flex-col items-start w-full gap-2 p-1">
                    <FormLabel className="flex h-full">
                      <User />
                      Driver
                    </FormLabel>
                    <FormControl>
                      <DataSelector
                        targetData="Driver"
                        columns={excludeActions<DriverData>(
                          driverColumns,
                        )}
                        fetcher={mapParam(getDrivers)}
                        value={field.value ?? undefined}
                        getTargetId={(row) =>
                          row.original.id
                        }
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
                        onReset={() =>
                          form.resetField("driverId")
                        }
                        asChild
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )}

          {!defaultValue && (
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex flex-col items-start w-full gap-2 p-1">
                    <FormLabel className="flex h-full">
                      <Car />
                      Vehicle
                    </FormLabel>
                    <FormControl>
                      <DataSelector
                        targetData="Vehicle"
                        columns={excludeActions<VehicleData>(
                          vehicleColumns,
                        )}
                        fetcher={mapParam(getVehicles)}
                        value={field.value ?? undefined}
                        getTargetId={(row) =>
                          row.original.id
                        }
                        renderView={{
                          fetcher: (id) =>
                            getVehicle(id),
                          render: (data) => (
                            <ViewVehicle
                              vehicle={data}
                            />
                          ),
                        }}
                        onRowSelect={(row) => {
                          form.setValue(
                            "vehicleId",
                            row.original.id,
                          );
                        }}
                        onReset={() =>
                          form.resetField("vehicleId")
                        }
                        asChild
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )}
        </FieldSeparator>
        <div className="flex h-full justify-end items-end gap-2">
          <Button
            variant="secondary"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {defaultValue ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
