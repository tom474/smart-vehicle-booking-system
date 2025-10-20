"use client";

import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleServiceData } from "@/apis/vehicle-service";
import { Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

export function ServiceCategoryField({ disabled = false }: { disabled?: boolean }) {
	const t = useTranslations("DriverRequest.requestForm");

	const form = useFormContext<VehicleServiceData>();

	const serviceCategoryOptions = [
		{ value: "maintenance", label: t("routineMaintenance") },
		{ value: "repair", label: t("urgentRepair") },
		{ value: "other", label: t("other") },
	];

	return (
		<FormField
			control={form.control}
			name="serviceType"
			render={({ field }) => (
				<FormItem>
					<div className="flex justify-between p-1">
						<div className="flex flex-row items-center gap-2 text-subtitle-1">
							<Lightbulb />
							{t("serviceCategory")}
						</div>
						<Select onValueChange={field.onChange} value={field.value || ""} disabled={disabled}>
							<FormControl>
								<SelectTrigger className="border-none shadow-none text-muted-foreground focus-visible:ring-0 md:text-md">
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{serviceCategoryOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<FormMessage className="text-end" />
					<Separator />
				</FormItem>
			)}
		/>
	);
}
