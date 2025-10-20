import { ColumnProps } from "@/types/column-props";
import { Button } from "../ui/button";
import { Edit, EllipsisVertical, Eye, LucideIcon, Trash2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTranslations } from "next-intl";

export type ExtraAction = {
	icon?: LucideIcon;
	label: string;
	renderCondition?: boolean;
	onClick: (id: string) => void;
};

interface Props extends ColumnProps {
	targetId: string;
	editDisable?: boolean;
	destructiveActionDisable?: boolean;
	extrasActions?: ExtraAction[];
}

function ColumnActions({
	targetId,
	onView,
	onEdit,
	onDestructiveAction,
	editDisable,
	destructiveActionDisable,
	extrasActions: extrasActionsProp,
}: Props) {
	const tca = useTranslations("DataTable.columnActions");
	const extrasActions = extrasActionsProp?.filter((item) => item.renderCondition ?? true);

	return (
		<div className="flex items-center justify-end gap-2">
			{onView && (
				<Button
					onClick={() => {
						onView(targetId);
					}}
					className="size-7"
					size="icon"
					variant="info"
					title={tca("view")}
				>
					<Eye className="size-4" />
				</Button>
			)}
			{onEdit && (
				<Button
					disabled={editDisable}
					onClick={() => {
						onEdit(targetId);
					}}
					className="size-7"
					size="icon"
					variant="warning"
					title={tca("edit")}
				>
					<Edit className="size-4" />
				</Button>
			)}

			{(extrasActions || onDestructiveAction || onView || onEdit) && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							size="icon"
							className="size-7"
							variant="transparent"
							title="Extra actions"
							id="row-action-button" // for hiding this button on requester page
							disabled={
								(extrasActions === undefined ? true : extrasActions.length === 0) &&
								onDestructiveAction === undefined &&
								onView === undefined &&
								onEdit === undefined
							}
						>
							<EllipsisVertical />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56 -translate-x-16" align="start">
						{/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
						<DropdownMenuGroup>
							{onView && (
								<DropdownMenuItem onClick={() => onView(targetId)}>
									<Eye className="size-4 text-foreground" />
									<span className="text-gray-700">{tca("view")}</span>
								</DropdownMenuItem>
							)}
							{onEdit && (
								<DropdownMenuItem disabled={editDisable} onClick={() => onEdit(targetId)}>
									<Edit className="size-4 text-foreground" />
									<span className="text-gray-700">{tca("edit")}</span>
								</DropdownMenuItem>
							)}
							{extrasActions &&
								extrasActions.map((item) => (
									<DropdownMenuItem key={item.label} onClick={() => item.onClick(targetId)}>
										{item.icon && <item.icon className="size-4 text-foreground" />}
										<span className="text-gray-700">{item.label}</span>
									</DropdownMenuItem>
								))}
						</DropdownMenuGroup>
						{extrasActions && extrasActions.length > 0 && onDestructiveAction && <DropdownMenuSeparator />}
						{onDestructiveAction && (
							<DropdownMenuItem
								disabled={destructiveActionDisable}
								className="text-destructive"
								onClick={() => onDestructiveAction(targetId)}
							>
								<Trash2 className="size-4 text-destructive" />
								<span className="text-destructive">{tca("delete")}</span>
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}

export default ColumnActions;
