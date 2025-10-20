"use client";

import { ChevronRight, Car, Construction, Captions } from "lucide-react";
import { useTranslations } from "next-intl";
import { ExpenseData } from "@/apis/expense";
import StatusBadge from "@/components/status-badge";
import ExpenseDetails from "@/app/driver/expense/expense-details";
import { formatCurrency } from "@/app/driver/expense/_components/amount";

interface ExpenseOverviewProps {
	expense: ExpenseData;
	mobile?: boolean;
	onlyOverview?: boolean;
	onExpenseChange?: () => void | Promise<void>;
}

export default function ExpenseOverview({
	expense,
	mobile = true,
	onlyOverview = false,
	onExpenseChange,
}: ExpenseOverviewProps) {
	const getExpenseType = (expense: ExpenseData) => {
		if (expense.type === "trip") return "trip";
		if (expense.type === "operational") return "operational";
		else return "maintenance";
	};

	if (onlyOverview) {
		return <OverviewDetails expense={expense} />;
	}

	return (
		<ExpenseDetails
			expenseId={expense.id}
			expenseType={getExpenseType(expense)}
			data={expense}
			trigger={<OverviewDetails expense={expense} />}
			mobile={mobile}
			onExpenseChange={onExpenseChange}
		/>
	);
}

function OverviewDetails({ expense }: { expense: ExpenseData }) {
	const t = useTranslations("DriverExpenses");

	const getStatusBackgroundClass = () => {
		const statusMap = {
			approved: "bg-success",
			pending: "bg-warning",
			rejected: "bg-destructive",
		} as const;

		return statusMap[expense.status as keyof typeof statusMap] || "bg-muted";
	};

	return (
		<div className="flex flex-row gap-4 p-2 -m-2 transition-colors rounded-lg cursor-pointer hover:bg-muted/50">
			<div className={`w-1.5 flex-shrink-0 rounded-tr-md rounded-br-md ${getStatusBackgroundClass()}`} />
			<div className="flex-1 min-w-0 space-y-2">
				{expense.type === "trip" && expense.tripId && (
					<div className="flex items-center gap-2 font-medium text-subtitle-1 ">
						<Car className="size-4" />
						<span>
							{t("trip")}: {expense.tripId}
						</span>
					</div>
				)}

				{expense.type !== "trip" && expense.type !== "operational" && expense.vehicleServiceId && (
					<div className="flex items-center gap-2 font-medium text-subtitle-1 ">
						<Construction className="size-4" />
						<span>
							{t("vehicleService")}: {expense.vehicleServiceId}
						</span>
					</div>
				)}

				{expense.type === "operational" && (
					<div className="flex flex-row items-center justify-between">
						<div className="flex items-center gap-2 font-medium text-subtitle-1">
							<Captions className="size-4" />
							<span>{t("otherExpense")}</span>
						</div>
					</div>
				)}

				<div className="flex flex-row items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						<span className="text-lg font-semibold">
							{formatCurrency(expense.amount.toString())} {t("currency")}
						</span>
					</div>
				</div>

				{expense.description ? (
					<div className="text-sm text-start text-muted-foreground line-clamp-2">{expense.description}</div>
				) : (
					<div className="text-sm text-start text-muted-foreground line-clamp-2">{t("noDescription")}</div>
				)}

				<StatusBadge status={expense.status} />
			</div>
			<div className="flex flex-row items-center justify-center flex-shrink-0 h-full">
				<ChevronRight />
			</div>
		</div>
	);
}
