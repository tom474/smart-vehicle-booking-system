"use client";

import { redirect, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { UserData, UserTokenData } from "@/apis/user";
import EnterPhoneNumberDialog from "@/components/enter-phone-number";
import {
	getUserFromCookie,
	getUserFromToken,
	redirectToLogin,
} from "@/lib/utils";

const DISABLEAUTH = false; // Set to true to disable auth checks for development or testing
const publicRoutes = [
	"/",
	"/login",
	"/signin-microsoft",
	"/notification",
	"/profile",
	"/public",
	"/pwa",
	"/suspended",
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [showPhoneDialog, setShowPhoneDialog] = useState(false);
	const [userCookie, setUserCookie] = useState<UserData | null>(null);

	useEffect(() => {
		if (DISABLEAUTH) {
			return;
		}

		// Skip auth check for public routes - this should be first
		if (publicRoutes.includes(pathname)) {
			return;
		}

		// If no user and not on public route, redirect to login
		const user = getUserFromToken() as UserTokenData | null;
		if (!user) {
			const fullPath =
				pathname +
				(searchParams.toString() ? `?${searchParams.toString()}` : "");
			redirectToLogin(fullPath);
			return;
		}

		// If user's status is suspended, redirect to login with message
		if (user.status === "suspended") {
			redirect("/suspended");
		}

		// Check role-based access
		const hasAccess =
			(user.role === "driver" && pathname.startsWith("/driver")) ||
			(user.role === "employee" && pathname.startsWith("/requester")) ||
			(user.role === "executive" && pathname.startsWith("/executive")) ||
			(user.role === "coordinator" &&
				(pathname.startsWith("/admin") ||
					pathname.startsWith("/dashboard"))) ||
			(user.role === "admin" &&
				(pathname.startsWith("/admin") ||
					pathname.startsWith("/dashboard")));

		if (!hasAccess) {
			// Redirect to their respective pages based on role
			switch (user.role) {
				case "driver":
					window.location.href = "/driver";
					break;
				case "employee":
					window.location.href = "/requester";
					break;
				case "executive":
					window.location.href = "/executive";
					break;
				case "coordinator":
					window.location.href = "/dashboard";
					break;
				case "admin":
					window.location.href = "/dashboard";
					break;
			}
			return;
		}

		// Check for phone number requirement
		if (user.role === "employee" && pathname === "/requester") {
			const cookieUser = getUserFromCookie() as UserData | null;
			if (cookieUser && !cookieUser.phoneNumber) {
				setUserCookie(cookieUser);
				setShowPhoneDialog(true);
			}
		}
	}, [pathname, searchParams]);

	return (
		<>
			{children}
			{showPhoneDialog && userCookie && (
				<EnterPhoneNumberDialog userCookie={userCookie} />
			)}
		</>
	);
}
