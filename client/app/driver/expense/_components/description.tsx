"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Text } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { ExpenseData } from "@/apis/expense";

export default function DescriptionField({
	form,
	disabled = false,
	hasSeparator = true,
}: {
	form: UseFormReturn<ExpenseData>;
	disabled?: boolean;
	hasSeparator?: boolean;
}) {
	const t = useTranslations("DriverExpenses.form");

	return (
		<FormField
			control={form.control}
			name="description"
			render={({ field }) => (
				<FormItem>
					<div>
						<FormControl>
							<div className="flex flex-row items-center w-full gap-2 p-1">
								<Text />
								<Input
									type="text"
									placeholder={t("enterDescription")}
									disabled={disabled}
									className={`w-full p-0 border-none shadow-none focus-visible:ring-0 md:text-md ${
										disabled ? "opacity-60 cursor-not-allowed" : ""
									}`}
									{...field}
									value={field.value || ""}
								/>
							</div>
						</FormControl>
					</div>
					<FormMessage className="text-end" />
					{hasSeparator && <Separator />}
				</FormItem>
			)}
		/>
	);
}
