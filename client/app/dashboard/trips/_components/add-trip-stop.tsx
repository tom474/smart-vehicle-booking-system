import { LocationSchema } from "@/apis/location";
import {
  type CreateTripStopData,
  CreateTripStopSchema,
  type TripStopData,
  TripStopSchema,
} from "@/apis/stop";
import { truncateAddress } from "@/app/requester/create-booking/_form-components/location-button";
import SelectLocation from "@/app/requester/create-booking/_form-components/select-location";
import DateTimeField from "@/components/form-field/date-time";
import FieldSeparator from "@/components/form-field/field-separator";
import FixedSelectorField from "@/components/form-field/fixed-selector";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Clock, MapPin, Route } from "lucide-react";
import { useTranslations } from "next-intl";
import { type Dispatch, type SetStateAction, useId, useState } from "react";
import { useForm } from "react-hook-form";

interface CreateTripStopFormProps {
  setTripStop: Dispatch<SetStateAction<TripStopData[]>>;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export function CreateTripStopForm({
  setTripStop,
  setOpen,
}: CreateTripStopFormProps) {
  const t = useTranslations("Coordinator.trip");
  const tbf = useTranslations("RequesterBookings.bookingForm.form");

  const [isSelectLocation, setIsSelectLocation] = useState(false);

  const formId = useId();

  const form = useForm<CreateTripStopData>({
    resolver: zodResolver(CreateTripStopSchema),
  });

  const handleLocationSelect = (location: {
    type: "fixed" | "custom";
    latitude: number;
    longitude: number;
    id?: string;
    name?: string;
    address?: string;
  }) => {
    console.log("SELECTED-LOC: ", location);
    form.setValue("location", LocationSchema.parse(location));
    if (location.type !== "custom") {
      form.setValue("locationId", location.id);
    } else {
      form.setValue("locationId", undefined);
    }
  };

  const onAdd = (values: CreateTripStopData) => {
    setTripStop((prev) => [
      ...prev,
      TripStopSchema.parse({
        ...values,
        id: crypto.randomUUID(),
      }),
    ]);
    setOpen(false);
  };

  const address = form.watch("location")?.address;

  return (
    <>
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(onAdd)}
          className="flex flex-col gap-2 h-full"
        >
          <FieldSeparator>
            <FormField
              control={form.control}
              name="location"
              render={() => (
                <FormItem>
                  <div className="flex justify-between p-1">
                    <FormLabel className="flex flex-row items-center gap-2 text-subtitle-1">
                      <MapPin />
                      {t("location")}
                    </FormLabel>

                    <FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        className={`font-normal text-md text-muted-foreground hover:bg-background hover:underline hover:text-foreground`}
                        onClick={() =>
                          setIsSelectLocation(true)
                        }
                      >
                        {truncateAddress(
                          address,
                          tbf("locationAddress"),
                        )}{" "}
                        <ChevronRight className="text-black" />
                      </Button>
                    </FormControl>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FixedSelectorField
                  field={field}
                  icon={Route}
                  label={t("type.self")}
                  items={TripStopSchema.shape.type.options.map(
                    (opt) => [opt, t(`type.${opt}`)],
                  )}
                />
              )}
            />

            <DateTimeField
              form={form}
              name="arrivalTime"
              icon={Clock}
              label={t("form.arrivalTime")}
            />
          </FieldSeparator>
          <div className="flex justify-end items-end h-full w-full">
            <Button
              form={formId}
              className="w-full"
              variant="secondary"
            >
              {t("form.addStop")}
            </Button>
          </div>
        </form>
      </Form>
      {isSelectLocation && (
        <div
          className={cn(
            "fixed bottom-0 right-0 flex flex-col overflow-hidden z-999 ",
            "h-full w-full max-w-xl sm:max-w-xl",
          )}
        >
          <SelectLocation
            mobile={false}
            setIsSelectLocation={setIsSelectLocation}
            onLocationSelect={handleLocationSelect}
            locationType="departureLocation"
            fixedLocationsOnly={false}
          />
        </div>
      )}
    </>
  );
}
