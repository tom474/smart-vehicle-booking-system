"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Banknote,
  CardSim,
  CircleDollarSign,
  ImageIcon,
  Landmark,
  NotepadText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type CreateExpenseData,
  CreateExpenseSchema,
  createExpenseData,
  type ExpenseData,
  updateExpenseData,
} from "@/apis/expense";
import { getTrip, getTrips } from "@/apis/trip";
import {
  getVehicleServiceById,
  getVehicleServices,
} from "@/apis/vehicle-service-request";
import FileUpload from "@/components/file-upload";
import FieldSeparator from "@/components/form-field/field-separator";
import FixedSelectorField from "@/components/form-field/fixed-selector";
import TextInputField from "@/components/form-field/input";
import TextAreaField from "@/components/form-field/text-area";
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
import { excludeActions } from "@/lib/columnsUtils";
import { tripColumns } from "../../trips/_columns/trip";
import TripView from "../../trips/_components/trip-form";
import { vehicleServiceColumns } from "../../vehicle-service-requests/_columns/vehicle-service-request";
import { ViewVsr } from "../../vehicle-service-requests/_components/view";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

interface Props {
  defaultValue?: ExpenseData;
}

export const CreateExpense = ({ defaultValue }: Props) => {
  const router = useRouter();

  const t = useTranslations("Coordinator.expenses");
  const tToast = useTranslations("Coordinator.expenses.toast");

  const form = useForm<CreateExpenseData>({
    context: CreateExpenseSchema,
    resolver: zodResolver(CreateExpenseSchema),
    defaultValues: {
      ...defaultValue,
    },
  });

  function onSubmit(values: CreateExpenseData) {
    toast.promise(createExpenseData(values), {
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

  function onEditSubmit(values: CreateExpenseData) {
    if (!defaultValue) return;
    toast.promise(updateExpenseData(defaultValue.id, values), {
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

  const expenseType = form.watch("type");
  // const operationalCustomType = form.watch("operationalType");

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
        className="flex flex-col h-full gap-2"
      >
        <FieldSeparator>
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FixedSelectorField
                field={field}
                name="type"
                label={t("fields.type.label")}
                placeholder={t("fields.type.placeholder")}
                items={[
                  ["trip", t("fields.type.options.trip")],
                  [
                    "vehicleService",
                    t("fields.type.options.vehicleService"),
                  ],
                  [
                    "operational",
                    t("fields.type.options.operational"),
                  ],
                ]}
                icon={Banknote}
              />
            )}
          />

          {expenseType === "vehicleService" ? (
            <FormField
              control={form.control}
              name="vehicleServiceId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex flex-col items-start w-full gap-2 p-1">
                    <FormLabel className="flex h-full">
                      <CardSim />
                      {t("fields.vehicleService.label")}
                    </FormLabel>
                    <FormControl>
                      <DataSelector
                        targetData={t(
                          "fields.vehicleService.label",
                        )}
                        columns={excludeActions(
                          vehicleServiceColumns,
                        )}
                        fetcher={getVehicleServices({})}
                        value={field.value ?? undefined}
                        getTargetId={(row) =>
                          row.original.id
                        }
                        renderView={{
                          fetcher: (id) =>
                            getVehicleServiceById(
                              id,
                            ),
                          render: (data) => (
                            <ViewVsr data={data} />
                          ),
                        }}
                        onRowSelect={(row) => {
                          form.setValue(
                            "vehicleServiceId",
                            row.original.id,
                          );
                        }}
                        onReset={() =>
                          form.resetField(
                            "vehicleServiceId",
                          )
                        }
                        asChild
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          ) : expenseType === "trip" ? (
            <FormField
              control={form.control}
              name="tripId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex flex-col items-start w-full gap-2 p-1">
                    <FormLabel className="flex h-full">
                      <CardSim />
                      {t("fields.trip.label")}
                    </FormLabel>
                    <FormControl>
                      <DataSelector
                        targetData={t(
                          "fields.trip.label",
                        )}
                        columns={excludeActions(
                          tripColumns,
                        )}
                        fetcher={getTrips({})}
                        getTargetId={(row) =>
                          row.original.id
                        }
                        value={field.value ?? undefined}
                        renderView={{
                          fetcher: (id) =>
                            getTrip(id),
                          render: (data) => (
                            <TripView data={data} />
                          ),
                        }}
                        onRowSelect={(row) => {
                          form.setValue(
                            "tripId",
                            row.original.id,
                          );
                        }}
                        onReset={() =>
                          form.resetField("tripId")
                        }
                        asChild
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          ) : (
            expenseType === "operational" && (
              <>
                <FormField
                  control={form.control}
                  name="operationalType"
                  render={({ field }) => (
                    <FixedSelectorField
                      field={field}
                      name="type"
                      label={t(
                        "fields.operationalType.label",
                      )}
                      placeholder={t(
                        "fields.operationalType.placeholder",
                      )}
                      items={CreateExpenseSchema.shape.operationalType.def.innerType.options.map(
                        (opt) => [
                          opt,
                          t(
                            `fields.operationalType.options.${opt}`,
                          ),
                        ],
                      )}
                      icon={Landmark}
                    />
                  )}
                />
                {/* {operationalCustomType === "custom" && ( */}
                {/* 	<FormField */}
                {/* 		control={form.control} */}
                {/* 		name="operationalCustomType" */}
                {/* 		render={({ field }) => ( */}
                {/* 			<TextInputField */}
                {/* 				{...field} */}
                {/* 				name="operationalCustomType" */}
                {/* 				placeholder={t( */}
                {/* 					"fields.operationalCustomType.placeholder", */}
                {/* 				)} */}
                {/* 				icon={Banknote} */}
                {/* 			/> */}
                {/* 		)} */}
                {/* 	/> */}
                {/* )} */}
              </>
            )
          )}

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <TextInputField
                {...field}
                type="number"
                name="amount"
                placeholder={t("fields.amount.placeholder")}
                onChange={(e) =>
                  field.onChange(parseFloat(e.target.value))
                }
                icon={CircleDollarSign}
              />
            )}
          />

          <FormField
            control={form.control}
            name="receipt"
            render={() => (
              <FormItem>
                <div className="flex flex-col items-start w-full gap-2 p-1">
                  <FormLabel className="flex h-full">
                    <ImageIcon />
                    {t("fields.receipt.label")}
                  </FormLabel>
                  <FormControl>
                    <FileUpload
                      initialImageUrl={
                        defaultValue?.receiptImageUrl ??
                        undefined
                      }
                      onFileUpload={(files) => {
                        if (files.length > 0) {
                          form.setValue(
                            "receipt",
                            files[0].file,
                            {
                              shouldValidate: true,
                            },
                          );
                        } else {
                          form.setValue(
                            "receipt",
                            undefined,
                            {
                              shouldValidate: true,
                            },
                          );
                        }
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <TextAreaField
                {...field}
                name="description"
                placeholder={t(
                  "fields.description.placeholder",
                )}
                icon={NotepadText}
                value={field.value ?? undefined}
              />
            )}
          />
        </FieldSeparator>

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
};

// const SchedulesDropDown = () => {
//   const [open, setOpen] = useState(false);
//
//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger>
//         {/* <Button size="sm">Pick a shcedule</Button> */}
//         <Input placeholder="Pick a schedule" />
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[425px] md:max-w-[1024px]">
//         <DialogHeader>
//           <DialogTitle>Select a request</DialogTitle>
//           <DialogDescription>
//             Selected request will be merged together with the current request
//           </DialogDescription>
//         </DialogHeader>
//         {/* <TripList parentTrip={parentTrip} onOpenChange={setOpen} /> */}
//         <ScheduleList onOpenChange={setOpen} />
//       </DialogContent>
//     </Dialog>
//   );
// };
//
// interface TripListProps {
//   onOpenChange: (v: boolean) => void;
// }
//
// const ScheduleList = ({ onOpenChange }: TripListProps) => {
//   const { data, error, isLoading } = useSWR("/api/trips", () => getSchedules());
//
//   if (isLoading)
//     return (
//       <div className="items-center justify-center size-full">
//         <Spinner />
//       </div>
//     );
//   if (error) return <h1>Error getting avaiable requests</h1>;
//   if (!data) return <p>No available requests could be found</p>;
//
//   const handleRowSelect = (id: string) => {
//     toast.promise(new Promise((r) => setTimeout(r, 3000)), {
//       loading: "Adding the request...",
//       success: `Request with trip id #${id} successfully added.`,
//       error: `Could not add request #${id}, please try again later`,
//     });
//   };
//
//   // return (
//   // 	<TableView
//   // 		onRowClick={(row) => {
//   // 			console.log(row.original)
//   // 			handleRowSelect(row.original.id)
//   // 			onOpenChange(false)
//   // 		}}
//   // 		columns={columns}
//   // 		// TODO: Filter out request base on same date
//   // 		fetcher={new Promise<TripData[]>((r) => r(data))}
//   // 	/>
//   // )
//
//   return data.map((schedule) => (
//     <Button
//       variant="transparent"
//       className="justify-start hover:bg-muted"
//       key={schedule.id}
//       onClick={() => {
//         console.log(schedule);
//         handleRowSelect(schedule.id);
//         onOpenChange(false);
//       }}
//     >
//       <div>{schedule.id}</div>
//     </Button>
//   ));
// };
