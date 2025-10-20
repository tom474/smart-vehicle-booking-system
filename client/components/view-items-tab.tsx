"use client";

import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavigationBar from "@/components/navigation-bar";
import NeedHelpButton from "@/components/need-help-button";
import Spinner from "@/components/spinner";
import { useIsMobile } from "@/hooks/useIsMobile";

interface TabItem {
	value: string;
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	items: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	renderItem: (item: any, index: number) => ReactNode;
}

interface ViewItemsTabProps {
	title: string;
	tabs: TabItem[];
	defaultTab: string;
	currentTab?: string;
	onTabChange?: (value: string) => void;
	ongoingSection?: {
		title: string;
		content: ReactNode;
	};
	actionButton?: ReactNode;
	isLoading: boolean;
	noItemsMessage: string;
	userRole?: "Driver" | "Employee";
	customActionComponent?: ReactNode;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	scrollEvent?: (e: any) => void;
}

export default function ViewItemsTab({
	title,
	tabs,
	defaultTab,
	currentTab,
	onTabChange,
	ongoingSection,
	actionButton,
	isLoading,
	noItemsMessage,
	userRole = "Driver",
	customActionComponent,
	scrollEvent,
}: ViewItemsTabProps) {
	const isMobile = useIsMobile();

	return (
		<div
			className={`flex flex-col p-4 overflow-hidden ${
				isMobile ? "h-screen pt-0" : userRole === "Driver" ? "h-full bg-popover rounded-lg" : "h-full"
			}`}
		>
			<div className="flex items-center justify-between mt-4 mb-1">
				<h2 className="text-headline-2">{title}</h2>
			</div>

			{/* Ongoing Section */}
			{ongoingSection && (
				<div className={`py-4 rounded-lg ${!isMobile && "bg-background p-4"}`}>
					<div className="pb-4 text-headline-3">{ongoingSection.title}</div>
					{ongoingSection.content}
				</div>
			)}

			<Tabs
				defaultValue={defaultTab}
				value={currentTab}
				onValueChange={onTabChange}
				className="w-full h-full mt-2 overflow-auto"
			>
				<div className="flex flex-row gap-4">
					<TabsList className="flex-1 flex-shrink-0 w-full bg-background">
						{tabs.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success data-[state=active]:font-semibold data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0"
							>
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>

					{actionButton}
				</div>

				{tabs.map((tab) => (
					<TabsContent
						onScroll={scrollEvent}
						key={tab.value}
						value={tab.value}
						className={`flex-1 w-full overflow-x-hidden overflow-y-auto ${isMobile ? "pb-35 mt-4" : "pb-15"}`}
					>
						<div className={`${!isMobile ? "space-y-2" : "space-y-4"}`}>
							{tab.items.length > 0 ? (
								tab.items.map((item, index) => (
									<div
										key={item.id || index}
										className={`${!isMobile && userRole === "Driver" && "bg-background p-4 rounded-lg"}`}
									>
										{tab.renderItem(item, index)}
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
					</TabsContent>
				))}
			</Tabs>

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
