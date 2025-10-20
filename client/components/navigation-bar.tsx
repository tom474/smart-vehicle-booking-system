"use client";

import { useEffect, useState } from "react";
import {
	ChevronLeft,
	Bell,
	BookText,
	User,
	House,
	Car,
	Construction,
	CalendarOff,
	Menu,
	NotebookPen,
	Calendar,
	List,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Notification from "@/app/notification/notification";
import LocaleSwitcher from "@/components/locale-switcher";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { useViewContext } from "@/components/view-context";
import { GlobalSearch } from "./global-search";
import { getUnreadNotificationCount } from "@/apis/notification";
import { getUserFromToken } from "@/lib/utils";

interface NavigationBarProps {
	userRole?: string;
	showSearch?: boolean;
	showNotifications?: boolean;
	showLocaleSwitcher?: boolean;
	userInfo?: {
		name: string;
		username: string;
		role: string;
		avatar?: string;
	};
	isDedicatedDriver?: boolean;
}

export default function NavigationBar({
	userRole = "Employee",
	showSearch = true,
	showNotifications = true,
	showLocaleSwitcher = true,
	isDedicatedDriver = false,
}: NavigationBarProps) {
	const t = useTranslations("NavigationBar");

	const isMobile = useIsMobile();
	const router = useRouter();
	const pathname = usePathname();
	const { isListView, setIsListView } = useViewContext();
	const [unreadCount, setUnreadCount] = useState(0);

	const fetchUnreadCount = async () => {
		try {
			const user = getUserFromToken();
			if (!user) return;
			const count = await getUnreadNotificationCount(user.id);
			setUnreadCount(count);
		} catch (error) {
			console.error("Failed to fetch unread notification count:", error);
		}
	};

	// get unread notification count
	useEffect(() => {
		fetchUnreadCount();
	}, []);

	const handleChangeView = (view: boolean) => {
		setIsListView(view);
		localStorage.setItem("isListView", view ? "true" : "false");
	};

	const driverMoreMenu = [
		{ path: "/driver/calendar", label: t("driver.calendar"), icon: Calendar },
		{ path: "/driver/trips", label: t("driver.myTrips"), icon: Car },
		{ path: "/driver/expense", label: t("driver.expenseLogging"), icon: NotebookPen },
		{ path: "/driver/leave", label: t("driver.leaveSchedule"), icon: CalendarOff },
		{ path: "/driver/services", label: t("driver.vehicleServices"), icon: Construction },
		{ path: "/profile", label: t("driver.profile"), icon: User },
	];

	const requesterRole = ["Employee", "employee", "ROL-1"];
	const executiveRole = ["Executive", "executive", "ROL-2"];
	const driverRole = ["Driver", "driver", "ROL-3"];
	const getMobileNavItems = () => {
		if (requesterRole.includes(userRole)) {
			return [
				{ path: "/requester", label: t("requester.home"), icon: House },
				{ path: "/requester/bookings", label: t("requester.bookings"), icon: BookText },
				{ path: "/notification", label: t("requester.notification"), icon: Bell },
				{ path: "/profile", label: t("requester.profile"), icon: User },
			];
		} else if (executiveRole.includes(userRole)) {
			return [{ path: "/executive/activities", label: t("executive.activities"), icon: BookText }];
		} else if (driverRole.includes(userRole)) {
			return [
				{
					path: !isDedicatedDriver ? "/driver/trips" : "/driver/executive",
					label: !isDedicatedDriver ? t("driver.myTrips") : t("driver.executive"),
					icon: Car,
				},
				{ path: "/driver/calendar", label: t("driver.calendar"), icon: Calendar },
				{ path: "/notification", label: t("driver.notification"), icon: Bell },
			];
		} else {
			return []; // No mobile nav items for Coordinator or Admin
		}
	};

	if (isMobile) {
		const navItems = getMobileNavItems();

		return (
			<div className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around h-16 bg-white border-t border-gray-200 shadow-md">
				{navItems.map((item) => (
					<Button
						key={item.path}
						variant="ghost"
						onClick={() => router.push(item.path)}
						className={`flex flex-col gap-1 flex-1 focus:bg-transparent focus:text-foreground hover:bg-transparent hover:text-foreground ${
							pathname === item.path ||
							(item.path !== "/requester" && pathname.startsWith(item.path + "/"))
								? "text-success"
								: ""
						}`}
					>
						<item.icon className="size-5" />
						<p className="text-subtitle-2">{item.label}</p>
					</Button>
				))}
				{driverRole.includes(userRole) && (
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="ghost" className="flex flex-col flex-1 gap-1">
								<Menu className="size-5" />
								<p className="text-subtitle-2">{t("driver.menu")}</p>
							</Button>
						</SheetTrigger>
						<SheetContent className="[&>button]:hidden w-screen max-w-screen sm:max-w-screen z-1000">
							<SheetHeader className="hidden">
								<SheetTitle>More Menu</SheetTitle>
								<SheetDescription>View more menu</SheetDescription>
							</SheetHeader>
							<div className="flex items-center justify-between p-4 pb-0">
								<SheetClose asChild>
									<Button
										variant="ghost"
										className="hover:bg-background hover:text-success hover:cursor-pointer"
									>
										<ChevronLeft className="size-6" />
									</Button>
								</SheetClose>
								<p className="text-subtitle-1">{t("driver.menu")}</p>
								<LocaleSwitcher />
							</div>
							<div className="flex flex-col gap-1 px-4">
								{driverMoreMenu.map((item) => (
									<SheetClose asChild key={item.path}>
										<Button
											variant="ghost"
											onClick={() => router.push(item.path)}
											className={`w-full flex items-center justify-start gap-4 p-6 rounded-md hover:bg-gray-50 ${
												pathname === item.path
													? "text-success bg-success/10"
													: "text-foreground"
											}`}
										>
											<item.icon className="flex-shrink-0 size-6" />
											<span className="font-medium text-btn">{item.label}</span>
										</Button>
									</SheetClose>
								))}
							</div>
						</SheetContent>
					</Sheet>
				)}
			</div>
		);
	} else {
		return (
			<div className="flex items-center justify-between w-full p-4">
				<div className="flex flex-row items-center flex-1 gap-6">
					{/* <Image
            src="/images/deheus-logo-notext.svg"
            alt="De Heus Logo"
            width="0"
            height="0"
            sizes="100vw"
            className="size-9"
            priority={false}
          /> */}
					{showSearch && (
						<div className="relative flex w-full">
							<div className="relative flex w-1/2">
								<GlobalSearch />
							</div>
						</div>
					)}
				</div>
				<div className="flex flex-row items-center justify-center gap-2">
					{pathname !== "/notification" ? (
						<>
							{showNotifications && (
								<Popover>
									<PopoverTrigger>
										<div className="relative">
											<Bell className="hover:cursor-pointer" />
											{unreadCount > 0 && (
												<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
													{unreadCount}
												</span>
											)}
										</div>
									</PopoverTrigger>
									<PopoverContent className="p-2 pt-0 bg-background w-xl">
										<Notification unread={false} fetchUnreadCount={fetchUnreadCount} />
									</PopoverContent>
								</Popover>
							)}
						</>
					) : (
						<Bell className="text-secondary" />
					)}
					{requesterRole.includes(userRole) && pathname.startsWith("/requester/bookings") && (
						<Button
							variant="ghost"
							className={`ml-3 ${isListView && "bg-primary text-background"}`}
							onClick={() => handleChangeView(!isListView)}
						>
							<List className="size-5" />
						</Button>
					)}
					{showLocaleSwitcher && <LocaleSwitcher />}
				</div>
			</div>
		);
	}
}
