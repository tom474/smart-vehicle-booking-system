import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type CreateDriverData,
  CreateDriverSchema,
  createDriver,
} from "@/apis/driver";
import {
  getLocationById,
  getLocations,
  type LocationData,
} from "@/apis/location";
import { getVehicle, getVehicles, type VehicleData } from "@/apis/vehicle";
import { getVendor, getVendors } from "@/apis/vendor";
import FileUpload from "@/components/file-upload";
import { DataSelector } from "@/components/selector/data-selector";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { mapParam } from "@/lib/build-query-param";
import { excludeActions } from "@/lib/columnsUtils";
import ViewVendor from "../../activity-logs/_components/view";
import { locationColumns } from "../../locations/_columns/location";
import ViewLocation from "../../locations/_components/view";
import { vehicleColumns } from "../../vehicles/owned/_columns/vehicle";
import { ViewVehicle } from "../../vehicles/owned/_components/vehicle-sheet";
import { vendorColumns } from "../../vendors/_columns/vendors";
import { apiErrHandler } from "@/lib/error-handling";

const CreateDriver = () => {
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const form = useForm<CreateDriverData>({
    resolver: zodResolver(CreateDriverSchema),
    defaultValues: {
      //startTime: new Date(),
    },
  });

  const handleCreateSubmit = (data: CreateDriverData) => {
    toast.promise(createDriver(data), {
      loading: "Creating driver account...",
      success: () => {
        form.reset();
        router.refresh();
        return "Driver account has been created";
      },
      error: (e) => {
        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return "Could not create new driver account, please try again later";
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCreateSubmit)}
        className="flex flex-col h-full gap-6"
      >
        {/* Personal Information */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter name"
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Password must contain at least 1 uppercase
                  letter, 1 lowercase letter, 1 number, and 1
                  special character (@$!%*?&).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      onFileUpload={(files) => {
                        console.log(
                          "FILE CHANGED: ",
                          files,
                        );
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* <Separator /> */}

        {/* Start Time */}
        {/* <FormField */}
        {/* 	control={form.control} */}
        {/* 	name="startTime" */}
        {/* 	render={({ field }) => ( */}
        {/* 		<FormItem> */}
        {/* 			<FormLabel className="flex items-center gap-2"> */}
        {/* 				<Calendar className="size-4" /> */}
        {/* 				Start Time */}
        {/* 			</FormLabel> */}
        {/* 			<FormControl> */}
        {/* 				<Input */}
        {/* 					type="datetime-local" */}
        {/* 					value={formatDateTimeLocal( */}
        {/* 						field.value ?? new Date(), */}
        {/* 					)} */}
        {/* 					onChange={(e) => */}
        {/* 						handleDateTimeChange(e.target.value) */}
        {/* 					} */}
        {/* 				/> */}
        {/* 			</FormControl> */}
        {/* 			<FormDescription> */}
        {/* 				Select when the driver will start working */}
        {/* 			</FormDescription> */}
        {/* 			<FormMessage /> */}
        {/* 		</FormItem> */}
        {/* 	)} */}
        {/* /> */}

        <Separator />

        {/* Assignments */}
        <div>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <FormControl>
                    <DataSelector
                      targetData="Vehicle (optional)"
                      columns={excludeActions<VehicleData>(
                        vehicleColumns,
                      )}
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

            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <DataSelector
                      targetData="Vendor (optional)"
                      columns={vendorColumns}
                      fetcher={mapParam(getVendors)}
                      getTargetId={(row) =>
                        row.original.id
                      }
                      value={field.value}
                      renderView={{
                        fetcher: (id) => getVendor(id),
                        render: (data) => (
                          <ViewVendor data={data} />
                        ),
                      }}
                      onRowSelect={(row) => {
                        form.setValue(
                          "vendorId",
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

            <FormField
              control={form.control}
              name="baseLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base location</FormLabel>
                  <FormControl>
                    <DataSelector
                      targetData="Base location"
                      columns={excludeActions<LocationData>(
                        locationColumns,
                      )}
                      fetcher={mapParam(getLocations)}
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
        <div className="flex h-full justify-end items-end gap-4">
          <Button type="submit" variant="secondary">
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
};

export { CreateDriver };
