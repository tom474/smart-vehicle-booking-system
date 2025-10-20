import { DateTimePicker } from "@/app/requester/create-booking/_form-components/datetime-picker-form";
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { LucideIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { cn } from "@/lib/utils";

export default function DateTimeField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	form,
	name,
	label,
	icon: Icon,
	disabled = false,
}: {
	form: UseFormReturn<TFieldValues>;
	name: TName;
	label: string;
	icon: LucideIcon;
	disabled?: boolean;
}) {
	return (
		<>
			<FormField
				control={form.control}
				name={name}
				render={() => (
					<FormItem>
						<div className="flex flex-row items-center w-full gap-2 p-1">
							<FormLabel className="flex flex-row items-center gap-2 text-nowrap text-subtitle-1">
								<Icon />
								{label}
								{/* {props.required && <RequiredSign />} */}
							</FormLabel>
							<div
								className={cn("flex justify-end w-full", disabled && "opacity-60 pointer-events-none")}
							>
								<DateTimePicker className="text-md" form={form} form_value={name} disabled={disabled} />
							</div>
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}
