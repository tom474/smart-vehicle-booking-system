"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PropsWithChildren } from "react";
import AppSidebar from "@/components/app-sidebar";
import NavigationBar from "@/components/navigation-bar";
import { getUserFromCookie } from "@/lib/utils";
import { mapRole } from "@/lib/utils";

export default function Layout({ children }: PropsWithChildren) {
	const currentUser = getUserFromCookie();
	return (
		<SidebarProvider className="h-screen">
			<AppSidebar
				userRole={currentUser?.roleId || "Employee"}
				userInfo={{
					name: currentUser?.name || "User",
					username: `${mapRole(currentUser?.roleId || "ROL-1")}@${currentUser?.id}`,
					avatar: currentUser?.profileImageUrl || "",
				}}
			/>
			<SidebarInset className="flex flex-col overflow-hidden">
				<NavigationBar userRole={currentUser?.roleId || "Employee"} />
				<div className="flex-1 overflow-auto">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
