"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Text } from "lucide-react";
import { useTranslations } from "next-intl";
import { ExecutiveDailyActivityData } from "@/apis/executive";

export default function NoteField({
	form,
	disabled = false,
}: {
	form: UseFormReturn<ExecutiveDailyActivityData>;
	disabled?: boolean;
}) {
	const t = useTranslations("DriverLogActivity.logActivity");

	return (
		<FormField
			control={form.control}
			name="notes"
			render={({ field }) => (
				<FormItem>
					<div>
						<FormControl>
							<div className="flex flex-row items-center w-full gap-2 p-1">
								<Text />
								<Input
									type="text"
									placeholder={t("notesOptional")}
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
				</FormItem>
			)}
		/>
	);
}
