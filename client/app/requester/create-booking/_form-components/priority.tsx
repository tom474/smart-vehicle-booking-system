import { Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { BookingRequestData } from "@/apis/booking-request";
import { useTranslations } from "next-intl";

export default function PrioritySection({
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
				name="priority"
				render={({ field }) => (
					<FormItem>
						<FormControl>
							<div className="flex flex-col items-end">
								<div className="flex justify-between w-full p-1">
									<div className="flex flex-row items-center gap-2 text-subtitle-1">
										<Crown />
										{t("priority")}
									</div>
									<div className="flex flex-row items-center gap-2 p-2">
										<div className="text-caption">{t("priorityMessage")}</div>
										<Input
											id="priority"
											type="checkbox"
											className={`size-5 ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
											checked={field.value === "high"}
											onChange={(event) => {
												if (!disabled) {
													field.onChange(event.target.checked ? "high" : "normal");
												}
											}}
											disabled={disabled}
										/>
									</div>
								</div>
							</div>
						</FormControl>
					</FormItem>
				)}
			/>
			<Separator />
		</>
	);
}
