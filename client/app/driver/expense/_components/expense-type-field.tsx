"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ExpenseData } from "@/apis/expense";
import { Text, ChevronLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ExpenseTypeFieldProps {
	form: UseFormReturn<ExpenseData>;
	disabled?: boolean;
}

const EXPENSE_TYPES = [
	{ value: "fuel", key: "fuel" },
	{ value: "tolls", key: "tolls" },
	{ value: "parking", key: "parking" },
	{ value: "maintenance", key: "maintenance" },
	{ value: "repair", key: "repair" },
];

export default function ExpenseTypeField({ form, disabled = false }: ExpenseTypeFieldProps) {
	const t = useTranslations("DriverExpenses.form");
	const description = useTranslations("DriverExpenses.description");
	const [isCustomType, setIsCustomType] = useState(false);

	// Check if the current form value exists and determine if it's a custom type
	useEffect(() => {
		const currentValue = form.getValues("description");
		if (currentValue) {
			const isPresetType = EXPENSE_TYPES.some((type) => type.value === currentValue);
			setIsCustomType(!isPresetType);
		}
	}, [form]);

	const handleTypeChange = (value: string) => {
		if (disabled) return;

		if (value === "custom") {
			setIsCustomType(true);
			form.setValue("description", "");
		} else {
			setIsCustomType(false);
			form.setValue("description", value);
		}
	};

	return (
		<FormField
			control={form.control}
			name="description"
			render={({ field }) => (
				<FormItem>
					<div className="flex justify-between p-1">
						<div className="flex flex-row items-center gap-2 text-subtitle-1 whitespace-nowrap">
							<Text />
							{t("expenseType")}
						</div>
						<FormControl>
							{!isCustomType ? (
								<Select
									onValueChange={handleTypeChange}
									value={field.value ?? undefined}
									disabled={disabled}
								>
									<SelectTrigger className="border-none shadow-none">
										<SelectValue placeholder={t("selectExpenseType")} />
									</SelectTrigger>
									<SelectContent>
										{EXPENSE_TYPES.map((type) => (
											<SelectItem key={type.value} value={type.value}>
												{type.value === "custom"
													? t("customType")
													: // eslint-disable-next-line
														description(type.key as any)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<div className="flex flex-row">
									{!disabled && (
										<button
											type="button"
											onClick={() => {
												setIsCustomType(false);
												form.setValue("description", "");
											}}
											className="text-sm hover:text-foreground"
										>
											<ChevronLeft className="size-4" />
										</button>
									)}
									<Input
										placeholder={t("enterCustomType")}
										value={field.value ?? undefined}
										onChange={field.onChange}
										disabled={disabled}
										className="border-none shadow-none focus-visible:ring-0"
									/>
								</div>
							)}
						</FormControl>
					</div>
					<FormMessage className="text-end" />
					<Separator />
				</FormItem>
			)}
		/>
	);
}
