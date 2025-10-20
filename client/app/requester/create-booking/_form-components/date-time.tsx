import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { BookingRequestData } from "@/apis/booking-request";
import { DateTimePicker } from "@/app/requester/create-booking/_form-components/datetime-picker-form";
import { FormField, FormItem } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

export default function DateTimeField({
	form,
	name,
	label,
	icon: Icon,
	disabled = false,
	setTimeValidMessage,
}: {
	form: UseFormReturn<BookingRequestData>;
	name: keyof BookingRequestData;
	label: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	disabled?: boolean;
	setTimeValidMessage?: (message: string) => void;
}) {
	const t = useTranslations("RequesterBookings.bookingForm.form");
	return (
		<>
			<FormField
				control={form.control}
				name={name}
				render={() => (
					<FormItem className="flex flex-col">
						<div className="flex justify-between p-1">
							<div className="flex flex-row items-center gap-2 text-subtitle-1">
								<Icon />
								{label}
							</div>
							<div className={disabled ? "opacity-60 pointer-events-none" : ""}>
								<DateTimePicker
									className="text-md"
									form={form}
									form_value={name}
									disabled={disabled}
									setTimeValidMessage={setTimeValidMessage}
								/>
							</div>
						</div>
					</FormItem>
				)}
			/>
			{label !== t("arrivalDeadline") && <Separator />}
		</>
	);
}
