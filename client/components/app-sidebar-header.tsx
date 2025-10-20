"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Shows horizontal logo when expanded, mark when collapsed.
 * Horizontal logo scales to the sidebar width.
 */
export function AppSidebarHeaderLogo() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <div className="flex items-center px-2 py-2">
      <Link href="/" aria-label="Go to homepage" className="flex items-center min-w-0">
        {isCollapsed ? (
          <Image
            src="/images/app-logo-192.png"
            alt="Company"
            width={28}
            height={28}
            className="shrink-0"
            priority
          />
        ) : (
          <div className="w-full max-w-[var(--sidebar-width)]">
            <Image
              src="/images/svb-logo-v5.svg"
              alt="Smart Vehicle Booking System"
              className="w-full h-auto"
              priority
              width={0}   // no fixed width
              height={0}  // no fixed height
              sizes="100vw"
            />
          </div>
        )}
      </Link>
    </div>
  );
}
