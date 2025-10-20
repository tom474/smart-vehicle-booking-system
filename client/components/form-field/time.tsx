import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { LucideIcon } from "lucide-react";
import { ComponentProps } from "react";
import { Input } from "../ui/input";

interface Props<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>
  extends ComponentProps<typeof Input> {
  label: string,
  description?: string,
  icon?: LucideIcon;
  field: ControllerRenderProps<TFieldValues, TName>
}

export default function TimeField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  description,
  icon: Icon,
  className,
  field,
  ...props
}: Props<TFieldValues, TName>) {
  return (
    <FormItem>
      <div className="flex flex-row items-center w-full gap-2 p-1 min-h-11">
        <div className="flex-1 space-y-2">
          <FormLabel className="flex h-full text-nowrap">
            {Icon && <Icon />}
            {label}
          </FormLabel>
          <FormDescription>{description}</FormDescription>
        </div>
        {/* <div className="w-full" /> */}
        <FormControl className="">
          <Input
            type="time"
            min="00:00"
            max="23:59"
            pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
            step="60" // only minutes (no seconds)
            value={field.value ?? ""}
            onChange={(e) => {
              // Ensure HH:MM format (zero-pad if needed)
              const val = e.target.value;
              const [h, m] = val.split(":");
              const normalized = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
              field.onChange(normalized);
            }}
            className={`border-none shadow-none focus-visible:ring-0 md:text-md ${props.disabled ? "opacity-60 cursor-not-allowed" : ""
              } ${className}`}
          />
        </FormControl>
      </div>
      <FormMessage />
    </ FormItem>
  );
}
