import { Separator } from "@/components/ui/separator";
import { FormField, FormItem } from "@/components/ui/form";
import { DateTimePicker } from "@/app/driver/executive/_components/datetime-picker-form";
import { UseFormReturn } from "react-hook-form";
import { ExecutiveDailyActivityData } from "@/apis/executive";

export default function DateTimeField({
	form,
	name,
	label,
	icon: Icon,
	disabled = false,
}: {
	form: UseFormReturn<ExecutiveDailyActivityData>;
	name: keyof ExecutiveDailyActivityData;
	label: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	disabled?: boolean;
}) {
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
								<DateTimePicker className="text-md" form={form} form_value={name} disabled={disabled} />
							</div>
						</div>
					</FormItem>
				)}
			/>
			<Separator />
		</>
	);
}
