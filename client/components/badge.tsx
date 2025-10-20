import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { ComponentProps, PropsWithChildren } from "react";

const badgeVariants = cva(
	"py-1 px-3 w-fit text-caption text-shadow-md border rounded-lg",
	{
		variants: {
			variant: {
				success: "text-success bg-success/10 border-success/75",
				destructive: "text-destructive bg-destructive/10 border-destructive/75",
				warning: "text-warning bg-warning/10 border-warning/75",
				info: "text-info bg-info/10 border-info/75",
			},
		},
		defaultVariants: {
			variant: "success",
		},
	},
);

function Badge({
	children,
	className,
	variant,
	...props
}: PropsWithChildren &
	ComponentProps<"div"> &
	VariantProps<typeof badgeVariants>) {
	return (
		<div {...props} className={cn(badgeVariants({ variant, className }))}>
			{children}
		</div>
	);
}

export default Badge;
