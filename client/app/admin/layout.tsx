"use client";

import type { PropsWithChildren } from "react";
import AppSidebar from "@/components/app-sidebar";
import NavigationBar from "@/components/navigation-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUserFromCookie, logoutUser } from "@/lib/utils";
import { Errorable } from "@/components/undefinable";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function Layout({ children }: PropsWithChildren) {
  const currentUser = getUserFromCookie();
  const t = useTranslations("Sidebar");
  const tError = useTranslations("Sidebar.error");

  const role = currentUser?.roleId === "ROL-5" ? "Admin" : "Coordinator";

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={currentUser?.roleId}
        userInfo={{
          name: currentUser?.name || role,
          username: `${role}@${currentUser?.id}`,
          avatar: currentUser?.profileImageUrl || "",
        }}
        withDataFetching={false}
      />

      <SidebarInset className="flex flex-col max-h-full overflow-y-auto">
        <div className="hidden sm:flex flex-col w-full max-h-full p-4 pt-0 overflow-auto">
          <NavigationBar userRole={currentUser?.roleId} />
          <div className="p-4 gap-4 bg-card rounded-lg min-h-[512px] overflow-auto max-h-full">
            {children}
          </div>
        </div>
        <div className="flex sm:hidden justify-center items-center w-full h-full p-8">
          <div className="flex flex-col text-center gap-2 items-center">
            <Errorable
              shouldError
              errorMsg={tError("unsupportedScreenSize")}
            />
            <Errorable
              shouldError
              errorMsg={tError("optimizedForLargeDisplays")}
            />
            <Button
              className="w-fit"
              onClick={() => {
                logoutUser();
              }}
            >
              {t("logout")}
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
