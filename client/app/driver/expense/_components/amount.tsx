"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ExpenseData } from "@/apis/expense";

export const formatCurrency = (value: string) => {
	// Remove all non-digit characters
	const numericValue = value.replace(/\D/g, "");
	// Add commas every 3 digits
	return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function AmountField({
	form,
	disabled = false,
}: {
	form: UseFormReturn<ExpenseData>;
	disabled?: boolean;
}) {
	const t = useTranslations("DriverExpenses.form");

	const [displayValue, setDisplayValue] = useState("");

	// Watch the form field value to sync display value when form resets
	const fieldValue = form.watch("amount");

	useEffect(() => {
		// Clear display value when field value is 0 or undefined
		if (!fieldValue || fieldValue === 0) {
			setDisplayValue("");
		} else {
			setDisplayValue(formatCurrency(fieldValue.toString()));
		}
	}, [fieldValue]);

	// Handle input change to format the value as currency
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
		const inputValue = e.target.value;
		const formatted = formatCurrency(inputValue);
		setDisplayValue(formatted);

		// Convert back to number for form value (remove commas)
		const numericValue = parseFloat(inputValue.replace(/,/g, "")) || 0;
		field.onChange(numericValue);
	};

	return (
		<FormField
			control={form.control}
			name="amount"
			render={({ field }) => (
				<FormItem>
					<div className="flex justify-between p-1">
						<div className="flex flex-row items-center gap-2 text-subtitle-1">
							<DollarSign />
							{t("amount")}
						</div>
						<FormControl>
							<div className="relative">
								<Input
									type="text"
									placeholder="0"
									value={displayValue}
									className="pr-12 border-none shadow-none text-end focus-visible:ring-0 md:text-md"
									onChange={(e) => handleInputChange(e, field)}
									onBlur={() => {
										// Sync display value with actual field value on blur
										if (field.value && field.value > 0) {
											setDisplayValue(formatCurrency(field.value.toString()));
										}
									}}
									disabled={disabled}
								/>
								<span className="absolute mt-0.4 transform -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
									{t("currency")}
								</span>
							</div>
						</FormControl>
					</div>
					<FormMessage className="text-end" />
					<Separator />
				</FormItem>
			)}
		/>
	);
}
