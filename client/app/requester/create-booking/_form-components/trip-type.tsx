import { Separator } from "@/components/ui/separator";
import { IterationCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { TripType } from "@/apis/location";
import { UseFormReturn } from "react-hook-form";
import { BookingRequestData } from "@/apis/booking-request";
import { useTranslations } from "next-intl";

export default function TripTypeSection({
	form,
	setSelectedTripType,
	disabled = false,
}: {
	form: UseFormReturn<BookingRequestData>;
	setSelectedTripType: (type: TripType) => void;
	disabled?: boolean;
}) {
	const t = useTranslations("RequesterBookings.bookingForm.form");
	return (
		<>
			<FormField
				control={form.control}
				name="type"
				render={({ field }) => (
					<FormItem>
						<div className="flex justify-between p-1">
							<div className="flex flex-row items-center gap-2 text-subtitle-1">
								<IterationCw />
								{t("tripType.tripType")}
							</div>
							<Select
								onValueChange={(value) => {
									if (!disabled) {
										field.onChange(value);
										setSelectedTripType(value as TripType);
									}
								}}
								defaultValue={field.value}
								disabled={disabled}
							>
								<FormControl>
									<SelectTrigger
										className={`border-none shadow-none text-md bg-background hover:bg-accent hover:!text-background text-black ${
											disabled && "opacity-60 cursor-not-allowed"
										}`}
										disabled={disabled}
									>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={TripType.OneWay}>{t("tripType.oneWay")}</SelectItem>
									<SelectItem value={TripType.RoundTrip}>{t("tripType.roundTrip")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</FormItem>
				)}
			/>
			<Separator />
		</>
	);
}
