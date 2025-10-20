"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
	return (
		<SidebarProvider className="h-screen">
			<SidebarInset className="flex flex-col overflow-hidden">
				<div className="flex-1 overflow-auto">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
