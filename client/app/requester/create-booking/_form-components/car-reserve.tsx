import { Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { BookingRequestData } from "@/apis/booking-request";
import { useTranslations } from "next-intl";

export default function CarReserveSection({
	form,
	disabled = false,
}: {
	form: UseFormReturn<BookingRequestData>;
	disabled?: boolean;
}) {
	const t = useTranslations("RequesterBookings.bookingForm.form");

	return (
		<>
			<FormField
				control={form.control}
				name="isReserved"
				render={({ field }) => (
					<FormItem>
						<FormControl>
							<div className="flex justify-between p-1">
								<div className="flex flex-row items-center gap-2 text-subtitle-1">
									<Car />
									{t("carReserve")}
								</div>
								<div className="flex flex-row items-center gap-2 p-2">
									<Input
										id="carReserve"
										type="checkbox"
										className={`size-5 ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
										checked={field.value}
										onChange={(event) => {
											if (!disabled) {
												field.onChange(event.target.checked);
											}
										}}
										disabled={disabled}
									/>
									<Label
										htmlFor="carReserve"
										className={disabled ? "opacity-60 cursor-not-allowed" : ""}
									>
										{t("reserve")}
									</Label>
								</div>
							</div>
						</FormControl>
						<Separator />
					</FormItem>
				)}
			/>
		</>
	);
}
