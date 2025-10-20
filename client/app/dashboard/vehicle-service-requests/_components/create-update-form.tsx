"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Clock, MessageSquare, NotepadText, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getVehicle, getVehicles } from "@/apis/vehicle";
import { updateVehicleService } from "@/apis/vehicle-service";
import {
	type CreateVehicleServiceData,
	CreateVehicleServiceSchemae,
	createVehicleService,
	type VehicleServiceData,
} from "@/apis/vehicle-service-request";
import { vehicleColumns } from "@/app/admin/vehicles/owned/_columns/vehicle";
import { ViewVehicle } from "@/app/admin/vehicles/owned/_components/vehicle-sheet";
import DateTimeField from "@/components/form-field/date-time";
import FieldSeparator from "@/components/form-field/field-separator";
import FixedSelectorField from "@/components/form-field/fixed-selector";
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
import { capitalize } from "@/lib/string-utils";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

interface Props {
	defaultValue?: VehicleServiceData;
}

export const CreateUpdateVehicleService = ({ defaultValue }: Props) => {
	const router = useRouter();

	const t = useTranslations("Coordinator.vehicleService");
	const tToast = useTranslations("Coordinator.vehicleService.toast");

	const form = useForm<CreateVehicleServiceData>({
		resolver: zodResolver(CreateVehicleServiceSchemae),
		defaultValues: {
			...defaultValue,
		},
	});

	function onSubmit(values: CreateVehicleServiceData) {
		console.log(values);
		toast.promise(createVehicleService(values), {
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

	function onEditSubmit(values: CreateVehicleServiceData) {
		if (!defaultValue) return;
		console.log(values);
		const validValues = {
			...values,
			serviceType:
				values.serviceType === "other" ? undefined : values.serviceType,
		};
		toast.promise(updateVehicleService(defaultValue.id, validValues), {
			loading: tToast("edit.loading"),
			success: () => {
				router.refresh();
				return tToast("edit.success", { id: defaultValue.id });
			},
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return tToast("edit.error", { id: defaultValue.id });
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
				className="flex flex-col h-full"
			>
				<FieldSeparator>
					{!defaultValue && (
						<FormField
							control={form.control}
							name="vehicleId"
							render={({ field }) => (
								<FormItem className="w-full">
									<div className="flex flex-col items-start w-full gap-2 p-1">
										<FormLabel className="flex h-full">
											<Car />
											{t("fields.vehicleId")}
										</FormLabel>
										<FormControl>
											<DataSelector
												targetData="Vehicle"
												label="Select Vehicle"
												columns={vehicleColumns}
												fetcher={getVehicles({})}
												getTargetId={(row) =>
													row.original.id
												}
												value={field.value}
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
													console.log(
														row.original.id,
													);
													form.setValue(
														"vehicleId",
														row.original.id,
													);
												}}
												onReset={() =>
													form.setValue(
														"vehicleId",
														"",
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
					)}

					<FormField
						control={form.control}
						name="serviceType"
						render={({ field }) => (
							<FixedSelectorField
								field={field}
								name="serviceType"
								label="Service Type"
								placeholder="Select service type"
								items={CreateVehicleServiceSchemae.shape.serviceType.options.map(
									(k) => [k, capitalize(k)],
								)}
								icon={Settings}
							/>
						)}
					/>

					<FormField
						control={form.control}
						name="reason"
						render={({ field }) => (
							<TextAreaField
								{...field}
								name="reason"
								placeholder={t("placeholders.reason")}
								icon={MessageSquare}
							/>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<TextAreaField
								{...field}
								name="description"
								placeholder="Describe the service details"
								icon={NotepadText}
							/>
						)}
					/>

					<DateTimeField
						form={form}
						name="startTime"
						icon={Clock}
						label="From"
					/>

					<DateTimeField
						form={form}
						name="endTime"
						icon={Clock}
						label="To"
					/>
				</FieldSeparator>
				<div className="flex h-full items-end">
					<Button
						variant="secondary"
						type="submit"
						className="w-full"
						disabled={form.formState.isSubmitting}
					>
						{defaultValue ? t("actions.edit") : t("actions.create")}
					</Button>
				</div>
			</form>
		</Form>
	);
};
