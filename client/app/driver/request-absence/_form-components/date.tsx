"use client";

import { UseFormReturn, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarCheck, CalendarX, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

type DateFormData = {
	startTime: Date;
	endTime: Date;
};

export function DateFields<T extends DateFormData>({
	form,
	disabled = false,
}: {
	form: UseFormReturn<T>;
	disabled?: boolean;
}) {
	const t = useTranslations("DriverRequest.requestForm");

	return (
		<>
			<FormField
				control={form.control}
				name={"startTime" as Path<T>}
				render={({ field }) => (
					<FormItem>
						<div className="flex justify-between p-1">
							<div className="flex flex-row items-center gap-2 text-subtitle-1">
								<CalendarCheck />
								{t("startDate")}
							</div>
							<Popover>
								<PopoverTrigger asChild disabled={disabled}>
									<FormControl>
										<Button
											variant="ghost"
											disabled={disabled}
											className={cn(!field.value && "text-muted-foreground md:text-md")}
										>
											{field.value ? (
												format(field.value, "dd/MM/yyyy")
											) : (
												<span>{t("pickADate")}</span>
											)}
											<CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value}
										onSelect={field.onChange}
										disabled={(date) => date < new Date()}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
						<FormMessage className="text-end" />
						<Separator />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name={"endTime" as Path<T>}
				render={({ field }) => (
					<FormItem className="flex flex-col">
						<div className="flex justify-between p-1">
							<div className="flex flex-row items-center gap-2 text-subtitle-1">
								<CalendarX />
								{t("endDate")}
							</div>
							<Popover>
								<PopoverTrigger asChild disabled={disabled}>
									<FormControl>
										<Button
											variant="ghost"
											disabled={disabled}
											className={cn(!field.value && "text-muted-foreground md:text-md")}
										>
											{field.value ? (
												format(field.value, "dd/MM/yyyy")
											) : (
												<span>{t("pickADate")}</span>
											)}
											<CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value}
										onSelect={field.onChange}
										disabled={(date) => {
											const startTime = form.getValues("startTime" as Path<T>);
											return date < new Date() || (startTime && date < startTime);
										}}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
						<FormMessage className="text-end" />
						<Separator />
					</FormItem>
				)}
			/>
		</>
	);
}
