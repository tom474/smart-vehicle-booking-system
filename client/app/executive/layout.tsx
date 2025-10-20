"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PropsWithChildren } from "react";
import AppSidebar from "@/components/app-sidebar";
import NavigationBar from "@/components/navigation-bar";
import { DataProvider } from "@/components/data-context";
import { useIsMobile } from "@/hooks/useIsMobile";
import { UserData } from "@/apis/user";
import { getUserFromCookie } from "@/lib/utils";

export default function Layout({ children }: PropsWithChildren) {
	const isMobile = useIsMobile();
	const currentUser = getUserFromCookie() as UserData | null;

	return (
		<DataProvider>
			<SidebarProvider className="h-screen">
				<AppSidebar
					userRole="Executive"
					userInfo={{
						name: currentUser?.name || "Executive",
						username: `Executive@${currentUser?.id}`,
						avatar: currentUser?.profileImageUrl || "",
					}}
					withDataFetching={true}
				/>
				<SidebarInset className="flex flex-col overflow-hidden">
					<NavigationBar userRole="Executive" />
					<div className={`flex-1 overflow-auto ${!isMobile && "p-4 pt-0"}`}>{children}</div>
				</SidebarInset>
			</SidebarProvider>
		</DataProvider>
	);
}
