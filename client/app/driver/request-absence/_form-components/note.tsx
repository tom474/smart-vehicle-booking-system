"use client";

import { UseFormReturn, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Text } from "lucide-react";
import { useTranslations } from "next-intl";

type NoteFormData = {
	notes?: string | null;
	description?: string | null;
};

export function NoteField<T extends NoteFormData>({
	form,
	fieldName,
	disabled = false,
}: {
	form: UseFormReturn<T>;
	fieldName: keyof NoteFormData;
	disabled?: boolean;
}) {
	const t = useTranslations("DriverRequest.requestForm");

	// Get the appropriate placeholder text based on field name
	const getPlaceholder = () => {
		switch (fieldName) {
			case "description":
				return t("description") || "Description";
			case "notes":
			default:
				return t("notes") || "Notes";
		}
	};

	return (
		<FormField
			control={form.control}
			name={fieldName as Path<T>}
			render={({ field }) => (
				<FormItem>
					<div>
						<FormControl>
							<div className="flex flex-row items-center w-full gap-2 p-1">
								<Text />
								<Input
									type="text"
									placeholder={getPlaceholder()}
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
