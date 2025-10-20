"use client";

import { getExpense, getExpenses } from "@/apis/expense";
import TableView from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { expenseColumns } from "./_columns/expense";
import { CreateExpense } from "./_components/create-form";
import { ViewExpense } from "./_components/view";

function VehicleServiceRequest() {
	return (
		<TableView
			targetDataStr="Expense"
			columns={expenseColumns}
			fetcher={mapParam(getExpenses)}
			renderCreate={<CreateExpense />}
			renderView={{
				fetcher: (id) => getExpense(id),
				render: (data) => <ViewExpense data={data} />,
			}}
			renderEdit={{
				fetcher: (id) => getExpense(id),
				render: (data) => <CreateExpense defaultValue={data} />,
			}}
		/>
	);
}

export default VehicleServiceRequest;
