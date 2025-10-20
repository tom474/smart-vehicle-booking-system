import { Input } from "@/components/ui/input";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LucideIcon } from "lucide-react";
import { ComponentProps } from "react";
import RequiredSign from "./required-sign";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textInputFieldVariants = cva(
  "flex w-full gap-2 p-1",
  {
    variants: {
      variant: {
        default: "flex-row items-center min-h-11",
        dropdown: "flex-col items-start gap-2"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

interface Props extends ComponentProps<typeof Input>, VariantProps<typeof textInputFieldVariants> {
  icon?: LucideIcon;
  label?: string,
  disabled?: boolean;
  description?: string,
}

export default function TextInputField({
  variant,
  icon: Icon,
  label,
  className,
  description,
  disabled = false,
  ...props
}: Props) {
  return (
    <FormItem>
      <div className={cn(textInputFieldVariants({ variant: variant }))}>
        <FormLabel className="flex h-full">
          {Icon && <Icon />}
          {variant === 'dropdown' && label}
          {props.required && <RequiredSign />}
        </FormLabel>
        <FormControl>
          <Input
            type="text"
            {...props}
            disabled={disabled}
            className={cn(`w-full p-0 border-none shadow-none focus-visible:ring-0 md:text-md`,
              disabled ? "opacity-60 cursor-not-allowed" : "",
              className)}
          />
        </FormControl>
      </div>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
}

export function LegacyTextInputField({
  icon: Icon,
  label,
  className,
  description,
  disabled = false,
  ...props
}: Props & { label: string }) {
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
            type="text"
            {...props}
            disabled={disabled}
            className={`w-[256px] md:text-md ${disabled ? "opacity-60 cursor-not-allowed" : ""
              } ${className}`}
          />
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  );
}
