"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Construction, Settings } from "lucide-react";
import { ExpenseData } from "@/apis/expense";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { ExpenseType } from "@/app/driver/expense/request-expense";

interface ExpenseTypeSelectProps {
	form: UseFormReturn<ExpenseData>;
	selectedType: ExpenseType | "";
	setSelectedType: (type: ExpenseType) => void;
	disabled?: boolean;
}

export default function ExpenseTypeSelect({
	form,
	selectedType,
	setSelectedType,
	disabled = false,
}: ExpenseTypeSelectProps) {
	const t = useTranslations("DriverExpenses");

	const handleTypeChange = (val: ExpenseType) => {
		// Get current driverId before resetting
		const currentDriverId = form.getValues("driverId");

		// Reset form with new type
		form.reset({
			id: "",
			status: "pending",
			type: val,
			driverId: currentDriverId,
			tripId: undefined,
			vehicleServiceId: undefined,
			amount: 0,
			receiptImageUrl: undefined,
			description: undefined,
			attachments: undefined,
		});

		setSelectedType(val);
	};

	return (
		<FormField
			control={form.control}
			name="type"
			render={() => (
				<FormItem>
					<div className="flex justify-between p-1">
						<div className="flex flex-row items-center gap-2 text-subtitle-1">
							<Settings />
							{t("selectExpenseType")}
						</div>
						<FormControl>
							<Select value={selectedType} onValueChange={handleTypeChange} disabled={disabled}>
								<SelectTrigger className="border-none shadow-none text-start">
									<SelectValue placeholder={t("selectExpenseType")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="trip">
										<span className="flex items-center gap-2">
											<Car className="w-4 h-4 hover:text-background focus:text-background" />
											{t("trip")}
										</span>
									</SelectItem>
									<SelectItem value="maintenance">
										<span className="flex items-center gap-2">
											<Construction className="w-4 h-4 hover:text-background focus:text-background" />
											{t("vehicleService")}
										</span>
									</SelectItem>
									<SelectItem value="operational">
										<span className="flex items-center gap-2">
											<Settings className="w-4 h-4 hover:text-background focus:text-background" />
											{t("operational")}
										</span>
									</SelectItem>
								</SelectContent>
							</Select>
						</FormControl>
					</div>
					<FormMessage className="text-end" />
					<Separator />
				</FormItem>
			)}
		/>
	);
}
