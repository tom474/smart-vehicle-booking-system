"use client";

import { getActivityLogs } from "@/apis/activity-log";
import TableView from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { activityLogColumns } from "./_columns/activity-log";

function Driver() {
	return (
		<TableView
			targetDataStr="Activity log"
			columns={activityLogColumns}
			fetcher={mapParam(getActivityLogs)}
		/>
	);
}

export default Driver;
