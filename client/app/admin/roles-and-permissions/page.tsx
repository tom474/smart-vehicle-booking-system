"use client";

import { getPermission, getPermissions } from "@/apis/permission";
import { getRole, getRoles } from "@/apis/role";
import TableView from "@/components/dashboard-table/table-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mapParam } from "@/lib/build-query-param";
import { columns as permissionColumns } from "./_columns/permission";
import { roleColumns } from "./_columns/role";
import { PermissionView } from "./_components/view-permission";
import { RoleView } from "./_components/view-role";

function RolesAndPermissions() {
	return (
		<Tabs defaultValue="roles">
			<TabsList>
				<TabsTrigger value="roles">Roles</TabsTrigger>
				<TabsTrigger value="permissions">Permission</TabsTrigger>
			</TabsList>
			<TabsContent value="roles">
				<TableView
					targetDataStr="Role"
					columns={roleColumns}
					fetcher={mapParam(getRoles)}
					renderView={{
						fetcher: (id) => getRole(id),
						render: (data) => <RoleView data={data} />,
					}}
					//renderEdit={{
					// fetcher: (id) => getRole(id),
					//  render: (data) => (
					//    <CreateUpdateRole defaultValue={data} />
					//  ),
					//}}
				/>
			</TabsContent>
			<TabsContent value="permissions">
				<TableView
					targetDataStr="Permission"
					tableConfig={{
						columnVisibility: {
							roleId: false,
						},
					}}
					columns={permissionColumns}
					fetcher={mapParam(getPermissions)}
					renderView={{
						fetcher: (id) => getPermission(id),
						render: (data) => <PermissionView data={data} />,
					}}
				/>
			</TabsContent>
		</Tabs>
	);
}

export default RolesAndPermissions;
