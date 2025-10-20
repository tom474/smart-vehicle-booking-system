"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function DateTimePicker({
	form,
	form_value,
	className,
	disabled = false,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	form: any;
	form_value: string;
	className?: string;
	disabled?: boolean;
}) {
	const t = useTranslations("RequesterBookings.bookingForm.form");
	const [open, setOpen] = useState(false);
	const currentValue = form.getValues(form_value);
	const currentDate = currentValue ? new Date(currentValue) : undefined;

	// Helper function to get tomorrow's date at 00:00:00
	const getTomorrowDate = () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		return tomorrow;
	};

	function handleDateSelect(date: Date | undefined) {
		if (date && !disabled) {
			// Prevent selecting past dates only
			const now = new Date();
			now.setHours(0, 0, 0, 0); // Reset time to start of today

			if (date < now) {
				console.warn("Cannot select past dates");
				return;
			}

			const existingDateTime = currentDate || now;
			const newDateTime = new Date(date);

			// Preserve existing time or set to default time (e.g., 12:00 PM)
			newDateTime.setHours(existingDateTime.getHours() || 12); // Default to 12:00 PM
			newDateTime.setMinutes(existingDateTime.getMinutes() || 0);

			newDateTime.setSeconds(0);
			newDateTime.setMilliseconds(0);

			// Check if the resulting date is valid
			if (isNaN(newDateTime.getTime())) {
				console.error("Invalid date created:", newDateTime);
				return;
			}

			form.setValue(form_value, newDateTime);
		}
	}

	function handleTimeChange(type: "hour" | "minute" | "ampm", value: string) {
		if (disabled) return;

		const baseDate = currentDate || getTomorrowDate();
		const newDateTime = new Date(baseDate);

		if (type === "hour") {
			const hour = parseInt(value, 10);
			const currentHours = newDateTime.getHours();
			const isPM = currentHours >= 12;
			newDateTime.setHours(isPM ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour);
		} else if (type === "minute") {
			newDateTime.setMinutes(parseInt(value, 10));
		} else if (type === "ampm") {
			const hours = newDateTime.getHours();
			if (value === "AM" && hours >= 12) {
				newDateTime.setHours(hours - 12);
			} else if (value === "PM" && hours < 12) {
				newDateTime.setHours(hours + 12);
			}
		}

		newDateTime.setSeconds(0);
		newDateTime.setMilliseconds(0);

		if (isNaN(newDateTime.getTime())) {
			console.error("Invalid date created:", newDateTime);
			return;
		}

		form.setValue(form_value, newDateTime);
	}

	return (
		<div className={cn("flex flex-row items-center gap-2", className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						id={`${form_value}-datetime-picker`}
						className={cn(
							"w-fit border-none shadow-none justify-between font-normal text-sm rounded-md flex flex-row justify-end",
							!currentDate && "text-muted-foreground",
							disabled && "opacity-60 cursor-not-allowed",
						)}
						disabled={disabled}
						type="button"
					>
						{currentDate ? format(currentDate, "dd/MM/yyyy hh:mm aa") : t("selectDate")}
						<ChevronDownIcon className="w-4 h-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<div className="sm:flex">
						<Calendar
							mode="single"
							selected={currentDate}
							captionLayout="dropdown"
							onSelect={handleDateSelect}
							disabled={(date: Date) => {
								// Disable only past dates
								const today = new Date();
								today.setHours(0, 0, 0, 0); // Reset to the start of today
								return date < today; // Disable only dates before today
							}}
							defaultMonth={currentDate || getTomorrowDate()}
						/>
						<div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
							<ScrollArea className="w-64 sm:w-auto">
								<div className="flex p-2 sm:flex-col">
									{Array.from({ length: 12 }, (_, i) => i + 1)
										.reverse()
										.map((hour) => (
											<Button
												key={hour}
												size="icon"
												variant={
													currentDate && currentDate.getHours() % 12 === hour % 12
														? "default"
														: "ghost"
												}
												className="sm:w-full shrink-0 aspect-square"
												onClick={() => handleTimeChange("hour", hour.toString())}
												disabled={disabled}
											>
												{hour}
											</Button>
										))}
								</div>
								<ScrollBar orientation="horizontal" className="sm:hidden" />
							</ScrollArea>
							<ScrollArea className="w-64 sm:w-auto">
								<div className="flex p-2 sm:flex-col">
									{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
										<Button
											key={minute}
											size="icon"
											variant={
												currentDate && currentDate.getMinutes() === minute ? "default" : "ghost"
											}
											className="sm:w-full shrink-0 aspect-square"
											onClick={() => handleTimeChange("minute", minute.toString())}
											disabled={disabled}
										>
											{minute.toString().padStart(2, "0")}
										</Button>
									))}
								</div>
								<ScrollBar orientation="horizontal" className="sm:hidden" />
							</ScrollArea>
							<ScrollArea className="">
								<div className="flex p-2 sm:flex-col">
									{["AM", "PM"].map((ampm) => (
										<Button
											key={ampm}
											size="icon"
											variant={
												currentDate &&
												((ampm === "AM" && currentDate.getHours() < 12) ||
													(ampm === "PM" && currentDate.getHours() >= 12))
													? "default"
													: "ghost"
											}
											className="sm:w-full shrink-0 aspect-square"
											onClick={() => handleTimeChange("ampm", ampm)}
											disabled={disabled}
										>
											{ampm}
										</Button>
									))}
								</div>
							</ScrollArea>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
