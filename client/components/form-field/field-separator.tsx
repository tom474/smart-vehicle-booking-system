import { ComponentProps, ReactNode } from "react"
import { Separator } from "../ui/separator"
import { cn } from "@/lib/utils"

function FieldSeparator({ children, className, gapSize = 2, ...props }: { children: ReactNode | ReactNode[], gapSize?: number } & ComponentProps<'div'>) {
  let childArray = Array.isArray(children) ? children : [children];
  childArray = childArray.filter(Boolean)

  const gap = `${0.25 * gapSize}rem`

  return (
    <div style={{ gap }} className={cn("flex flex-col", className)} {...props}>
      {childArray.map((node, idx) => (
        <div style={{ gap }} className="flex flex-col" key={idx}>
          {node}
          {idx !== childArray.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}

export default FieldSeparator
