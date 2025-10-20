"use client";

import { UseFormReturn, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

type ReasonFormData = {
	reason?: string | null;
};

export function ReasonField<T extends ReasonFormData>({
	form,
	disabled = false,
	requestType,
}: {
	form: UseFormReturn<T>;
	disabled?: boolean;
	requestType: "leave-schedule" | "vehicle-service";
}) {
	const t = useTranslations("DriverRequest.requestForm");

	return (
		<FormField
			control={form.control}
			name={"reason" as Path<T>}
			render={({ field }) => (
				<FormItem>
					<div>
						<FormControl>
							<div className="flex flex-row items-center w-full gap-2 p-1">
								<Lightbulb />
								<Input
									type="text"
									placeholder={requestType === "leave-schedule" ? t("reason") : t("reasonRequired")}
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
					<Separator />
				</FormItem>
			)}
		/>
	);
}
