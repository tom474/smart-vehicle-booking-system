import { zodResolver } from "@hookform/resolvers/zod";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type DriverData,
  type UpdateDriverData,
  UpdateDriverSchema,
  updateDriver,
} from "@/apis/driver";
import { getFixedLocations, getLocationById } from "@/apis/location";
import { getVehicle, getVehicles } from "@/apis/vehicle";
import FileUpload from "@/components/file-upload";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { mapParam } from "@/lib/build-query-param";
import { locationColumns } from "../../locations/_columns/location";
import ViewLocation from "../../locations/_components/view";
import { vehicleColumns } from "../../vehicles/owned/_columns/vehicle";
import { ViewVehicle } from "../../vehicles/owned/_components/vehicle-sheet";
import { apiErrHandler } from "@/lib/error-handling";
import { useRouter } from "next/navigation";

interface Props {
  defaultData: DriverData;
}

export const UpdateDriver: FC<Props> = ({ defaultData }) => {
  console.log("Edit: ", defaultData);
  const router = useRouter();

  const form = useForm<UpdateDriverData>({
    resolver: zodResolver(UpdateDriverSchema),
    defaultValues: {
      ...defaultData,
      email: defaultData.email ?? undefined,
      phoneNumber: defaultData.phoneNumber ?? undefined,
      profileImageUrl: defaultData.profileImageUrl ?? undefined,
      vehicleId: defaultData.vehicleId ?? undefined,
      vendorId: defaultData.vendorId ?? undefined,
      baseLocationId: defaultData.baseLocationId ?? undefined,
    },
  });

  const handleUpdateSubmit = (data: UpdateDriverData) => {
    toast.promise(updateDriver(defaultData.id, data), {
      loading: `Updating driver ${defaultData.id}...`,
      success: () => {
        form.reset();
        router.refresh();
        return `Driver ${defaultData.id} has been updated`;
      },
      error: (e) => {
        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return "Could not update driver account, please try again later";
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleUpdateSubmit)}
        className="flex flex-col gap-6 h-full"
      >
        {/* Personal Information */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter full name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Profile Image */}
          <FormField
            control={form.control}
            name="avatar"
            render={() => (
              <FormItem>
                <div className="flex flex-col items-start w-full gap-2">
                  <FormLabel className="flex h-full">
                    Profile Image
                  </FormLabel>
                  <FormControl>
                    <FileUpload
                      initialImageUrl={
                        defaultData?.profileImageUrl ??
                        undefined
                      }
                      onFileUpload={(files) => {
                        if (files.length > 0) {
                          console.log(
                            "FILE: ",
                            files[0].file,
                          );
                          form.setValue(
                            "avatar",
                            files[0].file,
                            {
                              shouldValidate: true,
                            },
                          );
                        } else {
                          form.setValue(
                            "avatar",
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
        </div>

        <Separator />

        {/* Account Information */}
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter phone number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Assignments */}
        <div>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle (optional)</FormLabel>
                  <FormControl>
                    <DataSelector
                      targetData="Vehicle"
                      columns={vehicleColumns}
                      fetcher={mapParam(getVehicles)}
                      getTargetId={(row) =>
                        row.original.id
                      }
                      value={field.value}
                      renderView={{
                        fetcher: (id) => getVehicle(id),
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
                </FormItem>
              )}
            />

            {/* <FormField */}
            {/* 	control={form.control} */}
            {/* 	name="vendorId" */}
            {/* 	render={({ field }) => ( */}
            {/* 		<FormItem> */}
            {/* 			<FormLabel>Vendor</FormLabel> */}
            {/* 			<FormControl> */}
            {/* 				<DataSelector */}
            {/* 					targetData="Vendor (optional)" */}
            {/* 					columns={vendorColumns} */}
            {/* 					fetcher={mapParam(getVendors)} */}
            {/* 					getTargetId={(row) => */}
            {/* 						row.original.id */}
            {/* 					} */}
            {/* 					value={field.value} */}
            {/* 					onRowSelect={(row) => { */}
            {/* 						form.setValue( */}
            {/* 							"vendorId", */}
            {/* 							row.original.id, */}
            {/* 						); */}
            {/* 					}} */}
            {/* 					onReset={() => */}
            {/* 						form.resetField("vendorId") */}
            {/* 					} */}
            {/* 					asChild */}
            {/* 				/> */}
            {/* 			</FormControl> */}
            {/* 			<FormMessage /> */}
            {/* 		</FormItem> */}
            {/* 	)} */}
            {/* /> */}

            <FormField
              control={form.control}
              name="baseLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Location</FormLabel>
                  <FormControl>
                    <DataSelector
                      targetData="Base Location"
                      columns={locationColumns}
                      fetcher={mapParam(
                        getFixedLocations,
                      )}
                      getTargetId={(row) =>
                        row.original.id
                      }
                      value={field.value}
                      renderView={{
                        fetcher: (id) =>
                          getLocationById(id),
                        render: (data) => (
                          <ViewLocation data={data} />
                        ),
                      }}
                      onRowSelect={(row) => {
                        form.setValue(
                          "baseLocationId",
                          row.original.id,
                        );
                      }}
                      onReset={() =>
                        form.resetField("vendorId")
                      }
                      asChild
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex h-full justify-end items-end">
          <Button type="submit" variant="secondary">
            Update
          </Button>
        </div>
      </form>
    </Form>
  );
};
