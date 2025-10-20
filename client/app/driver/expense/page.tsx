"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTranslations } from "next-intl";
import { ExpenseData, getExpenses } from "@/apis/expense";
import { ExpenseType } from "@/app/driver/expense/request-expense";
import ExpenseOverview from "@/app/driver/expense/expense-overview";
import RequestExpense from "@/app/driver/expense/request-expense";
import ViewItemsTab from "@/components/view-items-tab";
import { getUserFromToken } from "@/lib/utils";

export default function ExpensePage() {
	const t = useTranslations("DriverExpenses");
	const isMobile = useIsMobile();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [tripExpenses, setTripExpenses] = useState<ExpenseData[]>([]);
	const [maintenanceExpenses, setMaintenanceExpenses] = useState<ExpenseData[]>([]);
	const [operationalExpenses, setOperationalExpenses] = useState<ExpenseData[]>([]);
	const [tabValue, setTabValue] = useState<string>("trip");

	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	const fetchExpenses = async (pageNumber: number, all?: boolean) => {
		setIsLoading(true);
		let limit = 10;
		if (all) {
			limit = pageNumber * 10;
			pageNumber = 1;
		}

		try {
			const driver = getUserFromToken();
			if (!driver) {
				console.error("No driver found in token");
				return;
			}

			// Fetch trip expenses
			const tripExpenses = await getExpenses({
				driverId: driver.id,
				type: "trip",
				page: pageNumber,
				limit: limit,
			});
			if (all) {
				// Replace entire state when refetching all data
				setTripExpenses(tripExpenses);
			} else {
				// Only merge when loading more pages
				setTripExpenses((prev) => [
					...prev.filter((request) => !tripExpenses.some((newReq) => newReq.id === request.id)),
					...tripExpenses,
				]);
			}

			// Fetch maintenance expenses
			const maintenanceExpenses = await getExpenses({
				driverId: driver.id,
				type: "maintenance",
				page: pageNumber,
				limit: limit,
			});
			if (all) {
				setMaintenanceExpenses(maintenanceExpenses);
			} else {
				setMaintenanceExpenses((prev) => [
					...prev.filter((request) => !maintenanceExpenses.some((newReq) => newReq.id === request.id)),
					...maintenanceExpenses,
				]);
			}

			// Fetch operational expenses
			const operationalExpenses = await getExpenses({
				driverId: driver.id,
				type: "operational",
				page: pageNumber,
				limit: limit,
			});
			if (all) {
				setOperationalExpenses(operationalExpenses);
			} else {
				setOperationalExpenses((prev) => [
					...prev.filter((request) => !operationalExpenses.some((newReq) => newReq.id === request.id)),
					...operationalExpenses,
				]);
			}

			// Check if there are no more results for all categories
			if (tripExpenses.length === 0 && maintenanceExpenses.length === 0 && operationalExpenses.length === 0) {
				setHasMore(false);
			}
		} catch (error) {
			console.error("Failed to fetch expenses:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchExpenses(page, false);
	}, [page]);

	// Infinite scroll handler
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleScroll = (e: any) => {
		const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
		if (bottom) {
			if (hasMore && !isLoading) {
				setPage((prevPage) => prevPage + 1);
			}
		}
	};

	const tabs = [
		{
			value: "trip",
			label: t("tripExpenses"),
			items: tripExpenses,
			renderItem: (expense: ExpenseData) => (
				<ExpenseOverview
					expense={expense}
					mobile={isMobile}
					onExpenseChange={() => fetchExpenses(page, true)}
				/>
			),
		},
		{
			value: "maintenance",
			label: t("vehicleServiceExpenses"),
			items: maintenanceExpenses,
			renderItem: (expense: ExpenseData) => (
				<ExpenseOverview
					expense={expense}
					mobile={isMobile}
					onExpenseChange={() => fetchExpenses(page, true)}
				/>
			),
		},
		{
			value: "operational",
			label: t("operationalExpenses"),
			items: operationalExpenses,
			renderItem: (expense: ExpenseData) => (
				<ExpenseOverview
					expense={expense}
					mobile={isMobile}
					onExpenseChange={() => fetchExpenses(page, true)}
				/>
			),
		},
	];

	return (
		<ViewItemsTab
			title={t("title")}
			tabs={tabs}
			defaultTab="trip"
			userRole="Driver"
			currentTab={tabValue}
			onTabChange={setTabValue}
			actionButton={
				<RequestExpense
					expenseType={tabValue as ExpenseType}
					mobile={isMobile}
					onExpenseChange={() => fetchExpenses(page, true)}
				/>
			}
			isLoading={isLoading}
			noItemsMessage={t("noExpenses")}
			scrollEvent={handleScroll}
		/>
	);
}
