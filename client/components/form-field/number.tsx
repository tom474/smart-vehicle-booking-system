import { Input } from "@/components/ui/input";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LucideIcon } from "lucide-react";
import { ComponentProps } from "react";
import RequiredSign from "./required-sign";

interface Props extends ComponentProps<typeof Input> {
  label: string,
  description?: string,
  icon?: LucideIcon;
  disabled?: boolean;
}

export default function NumberInputField({
  icon: Icon,
  label,
  description,
  className,
  disabled = false,
  ...props
}: Props) {
  return (
    <FormItem>
      <div className="flex flex-row items-center w-full gap-2 p-1 min-h-11">
        <div className="w-full space-y-2">
          <FormLabel className="flex h-full text-nowrap">
            {Icon && <Icon />}
            {label}
            {props.required && <RequiredSign />}
          </FormLabel>
          <FormDescription>{description}</FormDescription>
        </div>
        <div className="flex-1" />
        <FormControl>
          <Input
            type="number"
            disabled={disabled}
            className={`w-[128px] appearance-none md:text-md ${disabled ? "opacity-60 cursor-not-allowed" : ""
              } ${className}`}
            style={{
              MozAppearance: "textfield",
            }}
            {...props}
          />
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  );
}
