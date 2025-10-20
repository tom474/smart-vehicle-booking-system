import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LucideIcon } from "lucide-react";
import { ComponentProps } from "react";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import RequiredSign from "./required-sign";
import { cva, VariantProps } from "class-variance-authority";

const textAreaFieldVariants = cva(
  "flex w-full gap-2 p-1",
  {
    variants: {
      variant: {
        default: "flex-row items-center min-h-11",
        dropdown: "flex-col items-start gap-2 h-fit"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);


interface Props extends ComponentProps<typeof Textarea>, VariantProps<typeof textAreaFieldVariants> {
  placeholder: string;
  icon: LucideIcon;
  label?: string
}

export default function TextAreaField({
  variant,
  icon: Icon,
  label,
  ...props
}: Props) {
  return (
    <FormItem>
      <div className={cn(textAreaFieldVariants({ variant }))}>
        <FormLabel className="flex h-full">
          <Icon />
          {variant === 'dropdown' && label}
          {props.required && <RequiredSign />}
        </FormLabel>
        <FormControl>
          <Textarea
            {...props}
            className={cn(`w-full min-h-0 h-fit resize-none overflow-hidden p-0 border-none shadow-none focus-visible:ring-0 md:text-md`,
              props.disabled && "opacity-60 cursor-not-allowed"
            )}
            onInput={(e) => {
              e.currentTarget.style.height = "auto"; // reset
              e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"; // grow
            }}
            rows={1}
          />
        </FormControl>
      </div>
      <FormMessage />
    </ FormItem>
  )
}
