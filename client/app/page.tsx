"use client";

import { useEffect } from "react";
import { getUserFromToken, getRedirectPath, setUserInCookie } from "@/lib/utils";
import { getDriver } from "@/apis/driver";
import { getUser } from "@/apis/user";

export default function Home() {
	useEffect(() => {
		const handleAuth = async () => {
			const userToken = getUserFromToken();
			if (!userToken) {
				window.location.href = "/login";
				return;
			}
			const role = userToken?.role;
			try {
				let user;
				if (role === "driver") {
					user = await getDriver(userToken?.id);
				} else {
					user = await getUser(userToken?.id);
				}
				if (user) {
					setUserInCookie(user);
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
				window.location.href = "/login";
				return;
			}
			const redirectPath = getRedirectPath(userToken?.role);
			if (redirectPath) {
				window.location.href = redirectPath;
			}
		};

		handleAuth();
	}, []);
}
