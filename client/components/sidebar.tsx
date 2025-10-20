"use client";

import { type LucideIcon, MessageCircleQuestion, Settings } from "lucide-react";
import type * as React from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { Button } from "@/components/ui/button";
import { ComponentProps } from "react";
import { AppSidebarHeaderLogo } from "@/components/app-sidebar-header";

interface NavItem {
	title: string;
	url?: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: SubNavItem[];
}

interface SubNavItem {
	title: string;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
}

interface Props extends ComponentProps<typeof Sidebar> {
	navItems: NavItem[];
	baseUrl?: string;
}

function DashboardSidebar({ navItems, baseUrl, ...props }: Props) {
	return (
		<Sidebar variant="inset" collapsible="offcanvas" {...props}>
			<SidebarHeader className="p-0">
  				<AppSidebarHeaderLogo />
			</SidebarHeader>
			<SidebarContent>
				<NavMain baseUrl={baseUrl} items={navItems} />
			</SidebarContent>
			<SidebarFooter className="flex flex-row items-center justify-between">
				<Button size="icon" variant="transparent" className="hover:rotate-180 duration-300">
					<Settings className="size-6  " />
				</Button>
				<Button size="icon" variant="transparent">
					<MessageCircleQuestion className="size-4" />
				</Button>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

export default DashboardSidebar;
export type { NavItem, SubNavItem };
