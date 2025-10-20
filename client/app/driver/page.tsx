"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { getExecutiveIdByDriverId } from "@/apis/executive";
import { getUserFromToken } from "@/lib/utils";

export default function DriverPage() {
	useEffect(() => {
		const fetchUser = async () => {
			const user = getUserFromToken();
			if (user) {
				const executiveId = await getExecutiveIdByDriverId(user.id);
				if (executiveId) {
					redirect("/driver/executive");
				} else {
					redirect("/driver/trips");
				}
			} else {
				console.error("No user found in token");
			}
		};
		fetchUser();
	}, []);
}
