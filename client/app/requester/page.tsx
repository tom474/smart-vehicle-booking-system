"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import NavigationBar from "@/components/navigation-bar";
import { UpcomingTrips, RecentTrips, PendingRequests } from "@/app/requester/home/upcoming-trips";
import Notification from "@/app/notification/notification";
import Image from "next/image";
import NeedHelpButton from "@/components/need-help-button";
import { Button } from "@/components/ui/button";
import CreateBooking from "@/app/requester/create-booking/create-form";
import { useFetchData } from "@/components/data-context";
import LocaleSwitcher from "@/components/locale-switcher";
import { useTranslations } from "next-intl";
import { getUserFromCookie } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function Home() {
	const t = useTranslations("RequesterHome");
	const isMobile = useIsMobile();
	const router = useRouter();
	const dataContext = useFetchData();
	const user = getUserFromCookie();

	// Extract specific values to avoid infinite re-renders
	const fetchData = dataContext?.fetchData;

	useEffect(() => {
		if (fetchData) {
			fetchData();
		}
	}, [fetchData]);

	// Handle case where DataProvider is not available AFTER all hooks
	if (!dataContext) {
		return <div>Loading...</div>; // or some fallback UI
	}

	const { tripData } = dataContext;
	const { upcomingTrips, pendingRequests, recentTrips, isLoading } = tripData;

	if (isMobile) {
		return (
			<div className="flex flex-col w-screen">
				<div className="flex flex-row justify-between p-4 pb-0">
					<div className="flex flex-row items-center h-10 gap-2">
						<Image
							src="/images/deheus-logo-notext.svg"
							alt="De Heus Logo Simple"
							width="0"
							height="0"
							sizes="100vw"
							className="w-auto h-full"
							priority={false}
						/>
						<div className="text-subtitle-1">{t("title")}</div>
					</div>
					<div>
						<LocaleSwitcher />
					</div>
				</div>
				<div className="flex flex-col p-2 mt-2 pb-30">
					<div className="pl-4 text-subtitle-1">
						{t("welcome")}, {user?.name}!
					</div>
					<div className="flex flex-row w-full gap-2 p-4">
						<Button
							className="flex-1 bg-primary hover:bg-primary/90"
							onClick={() => router.push("/requester/bookings")}
						>
							{t("viewAllRequests")}
						</Button>
						<CreateBooking
							mobile={true}
							button={true}
							onBookingChange={async () => {
								if (fetchData) {
									await fetchData();
								}
							}}
						/>
					</div>
					<Separator className="py-0.5" />
					<div className="">
						<UpcomingTrips
							upcomingTrips={upcomingTrips}
							mobile={true}
							isLoading={isLoading}
							onBookingChange={async () => {
								if (fetchData) {
									await fetchData();
								}
							}}
						/>
						<PendingRequests
							pendingRequests={pendingRequests}
							mobile={true}
							isLoading={isLoading}
							onBookingChange={async () => {
								if (fetchData) {
									await fetchData();
								}
							}}
						/>
						<RecentTrips
							recentTrips={recentTrips}
							mobile={true}
							isLoading={isLoading}
							onBookingChange={async () => {
								if (fetchData) {
									await fetchData();
								}
							}}
						/>
					</div>
				</div>
				<NeedHelpButton />
				<NavigationBar userRole="Employee" />
			</div>
		);
	} else {
		return (
			<div className="w-full h-full">
				<div className="grid w-full h-full grid-cols-2 gap-4 p-4 rounded-lg bg-popover">
					<div className="flex flex-col min-h-0 gap-4">
						<div className="grid h-full min-h-0 grid-rows-2 gap-4">
							<div className="h-full min-h-0 rounded-lg bg-background">
								<Notification unread={true} />
							</div>
							<div className="min-h-0 overflow-hidden">
								<RecentTrips
									recentTrips={recentTrips}
									isLoading={isLoading}
									onBookingChange={async () => {
										if (fetchData) {
											await fetchData();
										}
									}}
								/>
							</div>
						</div>
					</div>
					<div className="grid h-full min-h-0 grid-rows-2 gap-4">
						<div className="min-h-0 overflow-hidden">
							<UpcomingTrips
								upcomingTrips={upcomingTrips}
								isLoading={isLoading}
								onBookingChange={async () => {
									if (fetchData) {
										await fetchData();
									}
								}}
							/>
						</div>
						<div className="min-h-0 overflow-hidden">
							<PendingRequests
								pendingRequests={pendingRequests}
								isLoading={isLoading}
								onBookingChange={async () => {
									if (fetchData) {
										await fetchData();
									}
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
