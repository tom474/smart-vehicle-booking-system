import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { UseFormReturn } from "react-hook-form";
import { BookingRequestData } from "@/apis/booking-request";
import { useTranslations } from "next-intl";
import { vietnamesePhoneRegex } from "@/lib/utils";

interface ContactPointField {
	form: UseFormReturn<BookingRequestData>;
	disabled?: boolean;
	setIsValid?: (isValid: boolean) => void;
}

export default function ContactPointField({ form, disabled, setIsValid }: ContactPointField) {
	const t = useTranslations("RequesterBookings.bookingForm.form.contactPoint");
	const [validationError, setValidationError] = useState<string | null>(null);

	const validatePhoneNumber = (phone: string): boolean => {
		const name = form.getValues("contactName").trim();
		if (!phone.trim()) {
			setValidationError(t("validationRequired"));
			if (setIsValid) setIsValid(false);
			return false;
		}
		if (!name) {
			setValidationError(t("validationRequired"));
			if (setIsValid) setIsValid(false);
			return false;
		}
		if (!vietnamesePhoneRegex.test(phone)) {
			setValidationError(t("invalidFormat"));
			if (setIsValid) setIsValid(false);
			return false;
		}
		setValidationError(null);
		if (setIsValid) setIsValid(true);
		return true;
	};

	const validateName = (name: string): boolean => {
		const phone = form.getValues("contactPhoneNumber").trim();
		if (!name.trim()) {
			setValidationError(t("validationRequired"));
			if (setIsValid) setIsValid(false);
			return false;
		}
		if (!phone) {
			setValidationError(t("validationRequired"));
			if (setIsValid) setIsValid(false);
			return false;
		}
		setValidationError(null);
		if (setIsValid) setIsValid(true);
		return true;
	};

	return (
		<>
			<div className="flex justify-between p-1">
				<div className="flex flex-row items-center gap-2 text-subtitle-1">
					<Phone />
					{t("title")}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4 pb-2">
				<FormField
					control={form.control}
					name="contactName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("name")}</FormLabel>
							<FormControl>
								<Input
									placeholder={t("name")}
									disabled={disabled}
									{...field}
									value={field.value || ""}
									onChange={(e) => {
										const value = e.target.value;
										field.onChange(value);
										validateName(value);
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="contactPhoneNumber"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("phoneNumber")}</FormLabel>
							<FormControl>
								<div className="flex flex-row items-center gap-2">
									<Input
										type="number"
										disabled={disabled}
										{...field}
										value={field.value || ""}
										onChange={(e) => {
											const value = e.target.value;
											field.onChange(value);
											validatePhoneNumber(value);
										}}
										// onBlur={() => validatePhoneNumber(field.value)}
									/>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			{validationError && <p className="text-sm text-red-600 text-end">{validationError}</p>}
			<Separator />
		</>
	);
}
