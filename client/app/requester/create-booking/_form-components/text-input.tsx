import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { BookingRequestData } from "@/apis/booking-request";
import { useTranslations } from "next-intl";

export default function TextInputField({
	form,
	name,
	placeholder,
	icon: Icon,
	disabled = false,
	setIsValid,
	overridePlaceholder,
}: {
	form: UseFormReturn<BookingRequestData>;
	name: keyof BookingRequestData;
	placeholder: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	disabled?: boolean;
	setIsValid?: (isValid: boolean) => void;
	overridePlaceholder?: string;
}) {
	const t = useTranslations("RequesterBookings.bookingForm.form");
	const [validationError, setValidationError] = useState<string | null>(null);

	useEffect(() => {
		if (setIsValid && name === "tripPurpose") {
			const priority = form.watch("priority");
			const value = form.watch("tripPurpose"); // Use watch instead of getValues

			if (priority === "high") {
				setValidationError(t("tripPurposePriority"));
				const hasInput = typeof value === "string" && value.trim().length > 0;
				setIsValid(hasInput);
			} else {
				setValidationError(null);
				setIsValid(true);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [setIsValid, name, form, form.watch("priority"), form.watch("tripPurpose")]);

	return (
		<>
			<FormField
				control={form.control}
				name={name}
				render={({ field }) => (
					<FormItem>
						<FormControl>
							<div className="flex flex-row items-center w-full gap-2 p-1">
								<Icon />
								<Input
									type="text"
									placeholder={
										overridePlaceholder && setIsValid && validationError
											? overridePlaceholder
											: placeholder
									}
									disabled={disabled}
									className={`w-full p-0 border-none shadow-none focus-visible:ring-0 md:text-md ${
										disabled ? "opacity-60 cursor-not-allowed" : ""
									}`}
									{...field}
									value={
										typeof field.value === "string" || typeof field.value === "number"
											? field.value
											: Array.isArray(field.value)
												? field.value.join(", ")
												: ""
									}
								/>
							</div>
						</FormControl>
					</FormItem>
				)}
			/>
			{validationError && <p className="text-red-600 text-caption text-end">{validationError}</p>}
			{name !== "note" && <Separator />}
		</>
	);
}
