import { type LucideIcon, Share } from "lucide-react";
import type { ComponentProps, FC, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

interface ListItemProps extends PropsWithChildren, ComponentProps<"div"> {
  type: "Info" | "Warning" | "Success" | "Destructive";
  icon?: LucideIcon;
}

const listColorVariants = cva("", {
  variants: {
    barStatus: {
      Info: "bg-info",
      Warning: "bg-warning",
      Success: "bg-success",
      Destructive: "bg-destructive",
    },
  }
})

const ListItem: FC<ListItemProps> = ({
  type,
  icon: Icon,
  className,
  children,
  ...props
}) => {
  return (
    <div
      {...props}
      className={cn("flex h-fit items-center gap-3 py-2 pr-3 w-full", className)}
    >
      <div
        style={{
          background: `var(--${type.toLowerCase()})`,
        }}
        className={cn("min-h-16 h-full w-1.5 rounded-tr-md rounded-br-md", listColorVariants({ barStatus: type }))}
      />
      {Icon && <Icon strokeWidth={1} size={48} />}
      <div className="flex flex-col gap-2 w-full">{children}</div>
    </div>
  );
};

const ListItemHeader: FC<PropsWithChildren> = ({ children }) => {
  return <div className="flex justify-between">{children}</div>;
};

interface ListItemTitleProps extends PropsWithChildren {
  href?: string;
}
const ListItemTitle: FC<ListItemTitleProps> = ({ href, children }) => {
  return (
    <p className="flex items-center text-headline-3 gap-2">
      {children} {href && <Share size={16} />}
    </p>
  );
};

const ListItemActions: FC<PropsWithChildren & ComponentProps<'div'>> = ({ children, className }) => {
  return <div className={cn("flex items-center text-body-2 gap-2", className)}>{children}</div>;
};

const ListItemDescription: FC<PropsWithChildren> = ({ children }) => {
  return <div className="text-body-2 text-muted-foreground">{children}</div>;
};

/* Sample usage

  <ListItem type="Info" icon={Car}>
    <ListItemHeader>
      <LisItemTitle>
        Header <Share size={16} />
      </LisItemTitle>
      <LisItemActions>
        12h ago <Pin size={16} />
      </LisItemActions>
    </ListItemHeader>
    <LisItemDescription>
      Trip is requested to be departed by 10AM tomorrow.
    </LisItemDescription>
  </ListItem>

 * */

export {
  ListItem,
  ListItemHeader,
  ListItemTitle,
  ListItemActions,
  ListItemDescription,
};

export type { ListItemProps };
