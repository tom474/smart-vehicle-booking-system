"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PropsWithChildren } from "react";
import AppSidebar from "@/components/app-sidebar";
import NavigationBar from "@/components/navigation-bar";
import { DataProvider } from "@/components/data-context";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getUserFromCookie } from "@/lib/utils";
import { ViewProvider } from "@/components/view-context";

export default function Layout({ children }: PropsWithChildren) {
	const isMobile = useIsMobile();
	const currentUser = getUserFromCookie();

	return (
		<DataProvider>
			<ViewProvider>
				<SidebarProvider className="h-screen">
					<AppSidebar
						userRole="Employee"
						userInfo={{
							name: currentUser?.name || "Employee",
							username: `Employee@${currentUser?.id}`,
							avatar: currentUser?.profileImageUrl || "",
						}}
						withDataFetching={true}
					/>
					<SidebarInset className="flex flex-col overflow-hidden">
						<NavigationBar userRole="Employee" />
						<div className={`flex-1 overflow-auto ${!isMobile && "p-4 pt-0"}`}>{children}</div>
					</SidebarInset>
				</SidebarProvider>
			</ViewProvider>
		</DataProvider>
	);
}
