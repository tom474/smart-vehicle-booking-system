"use client";

import { useEffect, useState } from "react";
import {
  Car,
  LayoutDashboard,
  type LucideIcon,
  NotebookPen,
  NotepadText,
  Clock,
  Ellipsis,
  CheckCheck,
  House,
  Construction,
  CalendarOff,
  Calendar,
  MapPin,
  Wrench,
  KeyRound,
  Users,
  CarFront,
  Truck,
  Route,
  ClipboardList,
  BanknoteArrowDown,
  MessageCircleQuestion,
  Settings,
  MessageSquareText,
  FileClock,
  CalendarCheck2,
  EllipsisVertical,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/useIsMobile";
import CreateBooking from "@/app/requester/create-booking/create-form";
import { useFetchData } from "@/components/data-context";
import { logoutUser } from "@/lib/utils";
import { AppSidebarHeaderLogo } from "@/components/app-sidebar-header";
import { getSupportContact, SupportContactSettingSchema } from "@/apis/settings";
import { z } from "zod/v4";

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

function useFetchDataSafe() {
  try {
    const context = useFetchData();
    return context;
  } catch {
    // DataProvider not available
    return null;
  }
}

interface AppSidebarProps {
  userRole?: string;
  userInfo?: {
    name: string;
    username: string;
    avatar?: string;
  };
  onBookingChange?: () => void;
  withDataFetching?: boolean;
  isDedicatedDriver?: boolean;
}

export default function AppSidebar({
  userRole = "Employee",
  userInfo = {
    name: "Nguyen Van A",
    username: "User@USR-1",
  },
  onBookingChange,
  withDataFetching = false,
  isDedicatedDriver = false,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("Sidebar");
  const [supportContact, setSupportContact] = useState<z.infer<typeof SupportContactSettingSchema> | null>(null);

  useEffect(() => {
    const fetchSupportContact = async () => {
      try {
        const settings = await getSupportContact();
        setSupportContact(settings);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSupportContact();
  }, []);


  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Always call the safe hook
  const dataContext = useFetchDataSafe();
  const fetchData = withDataFetching && dataContext ? dataContext.fetchData : null;

  const requesterRole = ["Employee", "employee", "ROL-1"];
  const executiveRole = ["Executive", "executive", "ROL-2"];
  const driverRole = ["Driver", "driver", "ROL-3"];
  const coordinatorAndAdminRole = ["Admin", "admin", "Coordinator", "coordinator", "ROL-4", "ROL-5"];
  const adminRole = ["Admin", "admin", "ROL-5"];
  const getNavItems = (): NavItem[] => {
    if (coordinatorAndAdminRole.includes(userRole)) {
      const coordNavItems = [
        {
          title: t("coordinator.dashboard"),
          url: "/dashboard",
          icon: LayoutDashboard,
          isActive: true,
        },
        {
          title: t("coordinator.bookingManagement"),
          icon: NotebookPen,
          items: [
            {
              title: t("coordinator.bookingRequests"),
              url: "/dashboard/bookings",
              isActive: true,
            },
            {
              title: t("coordinator.trips"),
              url: "/dashboard/trips",
              icon: Route,
              isActive: false,
            },
            {
              title: t("coordinator.feedbacks"),
              url: "/dashboard/feedbacks",
              icon: MessageSquareText,
              isActive: false,
            },
          ],
          isActive: true,
        },
        {
          title: t("coordinator.vehicleAndDriverManagement"),
          icon: Car,
          items: [
            {
              title: t("coordinator.drivers"),
              url: "/admin/drivers",
              icon: CarFront,
              isActive: false,
            },
            {
              title: t("coordinator.vehicles"),
              url: "/admin/vehicles/owned",
              icon: Car,
              isActive: false,
            },
            {
              title: t("coordinator.schedule"),
              url: "/dashboard/schedules",
              icon: CalendarCheck2,
              isActive: false,
            },
            {
              title: t("coordinator.leaveRequests"),
              url: "/dashboard/leave-requests",
              icon: ClipboardList,
              isActive: false,
            },
            {
              title: t("coordinator.vehicleServiceRequests"),
              url: "/dashboard/vehicle-service-requests",
              icon: Wrench,
              isActive: false,
            },
            {
              title: t("coordinator.expenses"),
              url: "/dashboard/expenses",
              icon: BanknoteArrowDown,
              isActive: true,
            },
          ],
          isActive: true,
        },
        {
          title: t("coordinator.locations"),
          url: "/admin/locations",
          icon: MapPin,
          isActive: false,
        },
        {
          title: t("coordinator.vendors"),
          url: "/admin/vendors",
          icon: Truck,
          isActive: false,
        },
        {
          title: t("coordinator.report"),
          url: "/dashboard/report",
          icon: NotepadText,
          isActive: true,
        },
      ] as NavItem[];

      if (adminRole.includes(userRole)) {
        const adminNavItems = [
          {
            title: t("admin.systemManagment"),
            icon: Settings,
            items: [
              {
                title: t("admin.rolesAndPermissions"),
                url: "/admin/roles-and-permissions",
                icon: KeyRound,
                isActive: false,
              },
              {
                title: t("admin.users"),
                url: "/admin/users",
                icon: Users,
                isActive: false,
              },
              {
                title: t("admin.activityLogs"),
                url: "/admin/activity-logs",
                icon: FileClock,
                isActive: false,
              },
              {
                title: t("admin.settings"),
                url: "/admin/settings",
                icon: Settings,
                isActive: false,
              },
            ],
          },
        ] as NavItem[];

        return [...coordNavItems, ...adminNavItems];
      }

      return coordNavItems;
    } else if (requesterRole.includes(userRole)) {
      return [
        {
          title: t("requester.home"),
          url: "/requester",
          icon: House,
          isActive: true,
        },
        {
          title: t("requester.upcomingBookings"),
          url: "/requester/bookings/upcoming",
          icon: Clock,
          isActive: true,
        },
        {
          title: t("requester.pendingBookings"),
          url: "/requester/bookings/pending",
          icon: Ellipsis,
          isActive: true,
        },
        {
          title: t("requester.pastBookings"),
          url: "/requester/bookings/past",
          icon: CheckCheck,
          isActive: true,
        },
      ];
    } else if (executiveRole.includes(userRole)) {
      return [
        {
          title: t("executive.activities"),
          url: "/executive/activities",
          icon: House,
          isActive: true,
        },
      ];
    } else if (driverRole.includes(userRole)) {
      return [
        !isDedicatedDriver
          ? {
            title: t("driver.myTrips"),
            url: "/driver/trips",
            icon: Car,
            isActive: true,
          }
          : {
            title: t("driver.executive"),
            url: "/driver/executive",
            icon: Car,
            isActive: true,
          },
        {
          title: t("driver.expenseLogging"),
          url: "/driver/expense",
          icon: NotebookPen,
          isActive: true,
        },
        {
          title: t("driver.leaveSchedule"),
          url: "/driver/leave",
          icon: CalendarOff,
          isActive: true,
        },
        {
          title: t("driver.vehicleServices"),
          url: "/driver/services",
          icon: Construction,
          isActive: true,
        },
        {
          title: t("driver.calendar"),
          url: "/driver/calendar",
          icon: Calendar,
          isActive: true,
        },
      ];
    } else {
      return [];
    }
  };

  const navItems = getNavItems();
  const baseUrl = "";

  const isItemActive = (item: NavItem): boolean => {
    return pathname === item.url;
  };

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-0">
        <AppSidebarHeaderLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {requesterRole.includes(userRole) && (
            <SidebarGroupContent>
              <SidebarMenu>
                <CreateBooking
                  button={true}
                  mobile={isMobile}
                  onBookingChange={onBookingChange || (fetchData ? fetchData : undefined)}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          )}
          <SidebarGroupContent className="pt-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <Collapsible key={item.title} asChild open defaultOpen className="group/collapsible">
                  <SidebarMenuItem
                    className={`py-1 ${isItemActive(item) && "rounded-md bg-primary/10 hover:bg-primary/20"}`}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        size="default"
                        className={twMerge(
                          item.url && "hover:cursor-pointer",
                          "flex items-center",
                        )}
                        tooltip={item.title}
                        onClick={() => {
                          if (item.url) {
                            if (requesterRole.includes(userRole)) {
                              router.push(item.url);
                            } else {
                              router.push(`${baseUrl}${item.url}`);
                            }
                          }
                        }}
                        asChild={
                          !!(requesterRole.includes(userRole) && item.url && !item.items)
                        }
                      >
                        {requesterRole.includes(userRole) && item.url && !item.items ? (
                          <a href={item.url}>
                            {item.icon && <item.icon />}
                            <span className="font-normal text-subtitle-1">
                              {item.title}
                            </span>
                          </a>
                        ) : (
                          <>
                            {item.icon && <item.icon />}
                            <span className="font-normal text-subtitle-1">
                              {item.title}
                            </span>
                            {/* {item.items && ( */}
                            {/*   <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" /> */}
                            {/* )} */}
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {item.items && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem
                              key={subItem.title}
                              className={`px-1 ${isItemActive(subItem) && "rounded-md bg-primary/10 hover:bg-primary/20"}`}
                            >
                              <SidebarMenuSubButton asChild>
                                <Link href={`${baseUrl}${subItem.url}`}>
                                  <span className="font-normal text-subtitle-1">
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-row items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="p-0 m-0 hover:text-gray-400 text-start hover:bg-transparent focus-visible:ring-0"
              onClick={() => {
                router.push("/profile");
              }}
            >
              <HoverCardUser
                trigger={
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={userInfo.avatar || ""} alt={userInfo.name} />
                      <AvatarFallback>
                        {userInfo.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col max-w-[120px]">
                        <p className="truncate text-subtitle-1 whitespace-nowrap">
                          {userInfo.name}
                        </p>
                        <p className="text-caption">{userInfo.username}</p>
                      </div>
                    </div>
                  </div>
                }
                userInfo={userInfo}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="focus:text-foreground"
              onClick={() => {
                router.push("/profile");
              }}
            >
              {t("profile")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="focus:text-foreground"
              onClick={() => {
                logoutUser();
              }}
            >
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {coordinatorAndAdminRole.includes(userRole) || adminRole.includes(userRole) ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="transparent">
                <EllipsisVertical className="size-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="focus:text-foreground"
                onClick={() => {
                  router.push("/profile");
                }}
              >
                {t("profile")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="focus:text-foreground"
                onClick={() => {
                  logoutUser();
                }}
              >
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="transparent">
                <MessageCircleQuestion className="size-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full">
              {t("needHelp")}{" "}
              <b>
                {supportContact?.name} / {supportContact?.phone}
              </b>
            </PopoverContent>
          </Popover>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function HoverCardUser({
  trigger,
  userInfo,
}: {
  trigger: React.ReactNode;
  userInfo: { name: string; username: string; avatar?: string };
}) {
  return (
    <HoverCard>
      <HoverCardTrigger>{trigger}</HoverCardTrigger>
      <HoverCardContent className="w-fit">
        <div className="flex items-center justify-between gap-4">
          <Avatar>
            <AvatarImage src={userInfo.avatar || ""} alt={userInfo.name} />
            <AvatarFallback>
              {userInfo.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{userInfo.name}</h4>
            <p className="text-sm">{userInfo.username}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
