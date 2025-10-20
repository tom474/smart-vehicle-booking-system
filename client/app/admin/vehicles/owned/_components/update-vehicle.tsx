import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Palette, RectangleEllipsis, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type DriverData, getDriver, getDrivers } from "@/apis/driver";
import {
	getFixedLocations,
	getLocationById,
	type LocationData,
} from "@/apis/location";
import { getUser, getUsers, type UserData } from "@/apis/user";
import {
	type UpdateVehicleFormData,
	UpdateVehicleSchema,
	updateVehicle,
	type VehicleData,
	ColorEnumSchema,
} from "@/apis/vehicle";
import { getVendors, type VendorData } from "@/apis/vendor";
import { driverColumns } from "@/app/admin/drivers/_columns/driver";
import ViewDriver from "@/app/admin/drivers/_components/view";
import { locationColumns } from "@/app/admin/locations/_columns/location";
import ViewLocation from "@/app/admin/locations/_components/view";
import { userColumns } from "@/app/admin/users/_columns/user";
import { ViewUser } from "@/app/admin/users/_components/user-form";
import { vendorColumns } from "@/app/admin/vendors/_columns/vendors";
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
import FixedSelectorField from "@/components/form-field/fixed-selector";
import { apiErrHandler } from "@/lib/error-handling";

interface Props {
	data: VehicleData;
}

const UpdateVehicleForm = ({ data }: Props) => {
	const router = useRouter();

	const t = useTranslations("Admin.vehicle");
	const tt = useTranslations("Admin.vehicle.toast.update");
	const tf = useTranslations("Admin.vehicle.form");

	const form = useForm<UpdateVehicleFormData>({
		resolver: zodResolver(UpdateVehicleSchema),
		defaultValues: {
			...data,
			driverId: data.driverId ?? undefined,
			vendorId: data.vendorId ?? undefined,
			executiveId: data.executiveId ?? undefined,
			baseLocationId: data.baseLocationId ?? undefined,
		},
	});

	const onEditSubmit = (updatedData: UpdateVehicleFormData) => {
		toast.promise(updateVehicle(data.id, updatedData), {
			loading: tt("loading"),
			success: () => {
				router.refresh();
				form.reset();
				return tt("success", { id: data.id });
			},
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return tt("error", { id: data.id });
			},
		});
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onEditSubmit)}
				className="flex flex-col h-full"
			>
				<FieldSeparator>
					{/* License Plate */}
					<FormField
						control={form.control}
						name="licensePlate"
						render={({ field }) => (
							<TextInputField
								{...field}
								name="licensePlate"
								placeholder={tf("licensePlatePlaceholder")}
								icon={RectangleEllipsis}
							/>
						)}
					/>

					{/* Model */}
					<FormField
						control={form.control}
						name="model"
						render={({ field }) => (
							<TextInputField
								{...field}
								name="model"
								placeholder={tf("modelPlaceholder")}
								icon={Car}
							/>
						)}
					/>

					{/* Color */}
					<FormField
						control={form.control}
						name="color"
						render={({ field }) => (
							<FixedSelectorField
								field={field}
								icon={Palette}
								label={t("color")}
								placeholder={tf("colorPlaceholder")}
								items={ColorEnumSchema.options.map((c) => {
									return [
										c,
										<div
											key={c}
											className="flex items-center gap-2"
										>
											<div
												className="border rounded-full size-4"
												style={{
													backgroundColor:
														c.toLowerCase(),
												}}
											/>
											<span>{c}</span>
										</div>,
									];
								})}
							/>
						)}
					/>

					{/* Capacity */}
					<FormField
						control={form.control}
						name="capacity"
						render={({ field }) => (
							<TextInputField
								{...field}
								type="number"
								min={1}
								name="capacity"
								placeholder={tf("capacityPlaceholder")}
								onChange={(e) =>
									field.onChange(Number(e.target.value))
								}
								icon={Users}
							/>
						)}
					/>

					{/* Driver */}
					<FormField
						control={form.control}
						name="driverId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("driver")}</FormLabel>
								<FormControl>
									<DataSelector
										targetData="Driver"
										columns={excludeActions<DriverData>(
											driverColumns,
										)}
										fetcher={mapParam(getDrivers, {
											filter(driver) {
												return !driver.vehicleId;
											},
										})}
										getTargetId={(row) => row.original.id}
										value={field.value}
										renderView={{
											fetcher: (id) => getDriver(id),
											render: (data) => (
												<ViewDriver data={data} />
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
							</FormItem>
						)}
					/>

					{/* Executive */}
					<FormField
						control={form.control}
						name="executiveId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("executive")}</FormLabel>
								<FormControl>
									<DataSelector
										targetData="Executive"
										value={field.value}
										columns={excludeActions<UserData>(
											userColumns,
										)}
										fetcher={mapParam(getUsers, {
											roleId: "ROL-2",
										})}
										getTargetId={(row) => row.original.id}
										renderView={{
											fetcher: (id) => getUser(id),
											render: (data) => (
												<ViewUser user={data} />
											),
										}}
										onRowSelect={(row) => {
											form.setValue(
												"executiveId",
												row.original.id,
											);
										}}
										onReset={() =>
											form.resetField("executiveId")
										}
										asChild
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Vendor (Optional) */}
					<FormField
						control={form.control}
						name="vendorId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("vendor")}</FormLabel>
								<FormControl>
									<DataSelector
										targetData="Vendor"
										columns={excludeActions<VendorData>(
											vendorColumns,
										)}
										fetcher={mapParam(getVendors)}
										getTargetId={(row) => row.original.id}
										value={field.value}
										// renderView={{
										//   fetcher: (id) => getVendor(id),
										//   render: (data) => <ViewVendor vendor={data} />,
										// }}
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

					{/* Base Location */}
					<FormField
						control={form.control}
						name="baseLocationId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("baseLocation")}</FormLabel>
								<FormControl>
									<DataSelector
										targetData="Location"
										columns={excludeActions<LocationData>(
											locationColumns,
										)}
										fetcher={mapParam(getFixedLocations)}
										getTargetId={(row) => row.original.id}
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
											form.resetField("baseLocationId")
										}
										asChild
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</FieldSeparator>

				<div className="flex items-end h-full">
					<Button
						type="submit"
						variant="secondary"
						className="flex-1"
					>
						{tf("edit")}
					</Button>
				</div>
			</form>
		</Form>
	);
};

export default UpdateVehicleForm;
