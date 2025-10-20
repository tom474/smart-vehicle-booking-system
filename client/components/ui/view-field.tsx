import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { ComponentProps, PropsWithChildren, ReactNode } from "react";

const textViewFieldVariants = cva(
  "flex w-full gap-2 p-1",
  {
    variants: {
      variant: {
        default: "flex-row items-center",
        dropdown: "flex-col items-start gap-2"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

const titleSectionVariants = cva(
  "flex items-center gap-2",
  {
    variants: {
      variant: {
        default: "",
        dropdown: ""
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

const valueVariants = cva(
  "w-full md:text-md",
  {
    variants: {
      variant: {
        default: "text-right flex justify-end",
        dropdown: "text-left"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

interface Props extends VariantProps<typeof textViewFieldVariants> {
  icon?: LucideIcon,
  title: string,
  value?: ReactNode,
  errorMsg?: string,
}

export default function TextViewField({
  icon: Icon,
  title,
  value,
  errorMsg,
  variant
}: Props) {
  return (
    <div className={cn(textViewFieldVariants({ variant }))}>
      <div className={cn(titleSectionVariants({ variant }))}>
        {Icon && <Icon />}
        <p className="text-nowrap font-bold">{title}</p>
      </div>
      {value ? <p className={cn(valueVariants({ variant }))}>{value}</p> :
        <p className={cn(valueVariants({ variant }), "italic font-bold text-destructive")}>{errorMsg ?? "N/A"}</p>}
    </div>
  );
}

// interface ImageViewFieldProps {
//   icon?: LucideIcon,
//   title: string,
//   value?: ReactNode,
//   errorMsg?: string,
// }
//
// export function ImageViewField({
//   icon: Icon,
//   title,
//   value,
//   errorMsg,
// }: ImageViewFieldProps) {
//   return (
//     <div className={cn(textViewFieldVariants({ variant }))}>
//       <div className={cn(titleSectionVariants({ variant }))}>
//         {Icon && <Icon />}
//         <p className="text-nowrap font-bold">{title}</p>
//       </div>
//       {value ? <p className={cn(valueVariants({ variant }))}>{value}</p> :
//         <p className={cn(valueVariants({ variant }), "italic font-bold text-destructive")}>{errorMsg ?? "N/A"}</p>}
//     </div>
//   );
// }

interface GridProps extends PropsWithChildren, ComponentProps<'div'> {
  icon?: LucideIcon,
  title?: string,
  value?: ReactNode,
}

export function Grid({ icon: Icon, title, children, ...props }: GridProps) {
  return <div className="grid grid-cols-2 gap-2" {...props}>
    {Icon && title && <div className="col-span-2 flex items-center gap-2">
      <Icon />
      <p className="text-nowrap font-bold">{title}</p>
    </div>}
    {children}
  </div>
}
