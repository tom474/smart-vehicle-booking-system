"use client";

import { getUser, getUsers } from "@/apis/user";
import TableView from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { userColumns } from "./_columns/user";
import { UserForm, ViewUser } from "./_components/user-form";

function Users() {
	return (
		<TableView
			targetDataStr="User"
			columns={userColumns}
			fetcher={mapParam(getUsers)}
			// renderCreate={}
			renderView={{
				fetcher(id) {
					return getUser(id);
				},
				render(data) {
					return <ViewUser user={data} />;
				},
			}}
			renderEdit={{
				fetcher: (id) => getUser(id),
				render: (data) => <UserForm defaultValues={data} />,
			}}
		/>
	);
}

export default Users;
