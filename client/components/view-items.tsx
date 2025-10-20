"use client";

import { ReactNode } from "react";
import NavigationBar from "@/components/navigation-bar";
import NeedHelpButton from "@/components/need-help-button";
import Spinner from "@/components/spinner";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ViewItemsProps {
	title?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	items: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	renderItem: (item: any, index: number) => ReactNode;
	isLoading: boolean;
	noItemsMessage: string;
	userRole?: "Driver" | "Employee" | "Executive";
	headerAction?: ReactNode;
	customActionComponent?: ReactNode;
	className?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	scrollEvent?: (e: any) => void;
	whiteBg?: boolean;
}

export default function ViewItems({
	title,
	items,
	renderItem,
	isLoading,
	noItemsMessage,
	userRole = "Driver",
	headerAction,
	customActionComponent,
	className = "",
	scrollEvent,
	whiteBg = false,
}: ViewItemsProps) {
	const isMobile = useIsMobile();

	const getBackgroundClass = () => {
		if (isMobile) return "w-screen h-screen pt-0";
		if (userRole === "Driver" || userRole === "Executive") return "h-full bg-popover rounded-lg";
		return "h-full";
	};

	return (
		<div
			className={`flex flex-col p-4 ${whiteBg && "bg-card rounded-md"} overflow-hidden ${getBackgroundClass()} ${className}`}
		>
			{/* Title */}
			{title && (
				<div className="flex items-center justify-between mt-4 mb-1">
					<h2 className="text-headline-2 whitespace-nowrap">{title}</h2>

					{/* Header Action */}
					{headerAction && <div className="w-full pb-2 text-end">{headerAction}</div>}
				</div>
			)}

			{/* Items List */}
			<div
				onScroll={scrollEvent}
				className={`overflow-y-auto ${!isMobile ? "space-y-2" : "space-y-4 mt-4 pb-35"}`}
			>
				{items.length > 0 ? (
					items.map((item, index) => (
						<div
							key={item.id || index}
							className={`${whiteBg && "bg-background p-4 rounded-md"} ${!isMobile && (userRole === "Driver" || userRole === "Executive") && "bg-background p-4 rounded-lg"}`}
						>
							{renderItem(item, index)}
						</div>
					))
				) : isLoading ? (
					<div className="text-center text-muted-foreground">
						<Spinner />
					</div>
				) : (
					<div className="text-center text-muted-foreground">{noItemsMessage}</div>
				)}
			</div>

			{isMobile && (
				<>
					<NeedHelpButton />
					{customActionComponent}
					<NavigationBar userRole={userRole} />
				</>
			)}
		</div>
	);
}
