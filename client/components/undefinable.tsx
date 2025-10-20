import { cn } from "@/lib/utils"
import { cva, VariantProps } from "class-variance-authority"
import { ComponentProps } from "react"

interface UndefinableProps extends ComponentProps<'p'>, VariantProps<typeof undefinableVariants> {
  value?: string | null
  errorMsg?: string
  shouldError?: boolean
}

const undefinableVariants = cva("", {
  variants: {
    variant: {
      default: "",
      error: "text-destructive italic font-bold",
      missing: "text-muted-foreground italic font-bold"
    }
  }
})

export function Errorable({ value, variant, errorMsg, shouldError, ...props }: UndefinableProps) {

  const isErr = shouldError || !value

  return (
    <p className={cn(undefinableVariants({ variant: isErr ? variant ?? 'error' : 'default' }), props.className)} {...props}>
      {isErr ? errorMsg ?? "N/A" : value}
    </p>
  )
}

