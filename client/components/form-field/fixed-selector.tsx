import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { LucideIcon } from "lucide-react";
import { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Props<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>
  extends ComponentProps<typeof Select> {
  label: string,
  description?: string,
  placeholder?: string,
  items: [string, ReactNode][],
  icon?: LucideIcon;
  field: ControllerRenderProps<TFieldValues, TName>
}

export default function FixedSelectorField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  description,
  placeholder,
  icon: Icon,
  items,
  field,
  ...props
}: Props<TFieldValues, TName>) {

  return (
    <FormItem>
      <div className="flex flex-row items-center w-full gap-2 p-1 min-h-11">
        <div className="w-full space-y-2">
          <FormLabel className="flex h-full text-nowrap">
            {Icon && <Icon />}
            {label}
          </FormLabel>
          <FormDescription>{description}</FormDescription>
        </div>
        <div className="w-full" />
        <Select
          onValueChange={(value) => {
            if (!props.disabled) {
              field.onChange(value);
            }
          }}
          defaultValue={field.value}
          value={field.value}
          {...props}
        >
          <FormControl>
            <SelectTrigger
              className={cn(`border-none shadow-none text-md bg-background hover:bg-accent hover:!text-background text-black`,
                props.disabled && "opacity-60 cursor-not-allowed")}
              disabled={props.disabled}
            >
              <SelectValue placeholder={placeholder ?? "Please select"} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {items.map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <FormMessage />
    </ FormItem>
  );
}
