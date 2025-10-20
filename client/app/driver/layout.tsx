"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PropsWithChildren } from "react";
import AppSidebar from "@/components/app-sidebar";
import NavigationBar from "@/components/navigation-bar";
import { useState, useEffect } from "react";
import { getUserFromCookie } from "@/lib/utils";
import { DriverData } from "@/apis/driver";
import { getExecutiveIdByDriverId } from "@/apis/executive";

export default function Layout({ children }: PropsWithChildren) {
	const isMobile = useIsMobile();
	const currentUser = getUserFromCookie() as DriverData | null;
	const [isDedicatedDriver, setIsDedicatedDriver] = useState<boolean>(false);

	useEffect(() => {
		const fetchUser = async () => {
			if (currentUser) {
				const executiveId = await getExecutiveIdByDriverId(currentUser.id);
				if (executiveId) {
					setIsDedicatedDriver(true);
				}
			} else {
				console.error("No user found in token");
			}
		};
		fetchUser();
	}, [currentUser]);

	return (
		<SidebarProvider className="h-screen">
			<AppSidebar
				userRole="Driver"
				userInfo={{
					name: currentUser?.name || "Driver",
					username: `Driver@${currentUser?.id}`,
					avatar: currentUser?.profileImageUrl || "",
				}}
				isDedicatedDriver={isDedicatedDriver}
				withDataFetching={false}
			/>
			<SidebarInset className="flex flex-col overflow-hidden">
				<NavigationBar userRole="Driver" isDedicatedDriver={isDedicatedDriver} />
				<div className={`flex-1 overflow-auto ${!isMobile && "p-4 pt-0"}`}>{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
