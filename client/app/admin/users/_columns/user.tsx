/* eslint-disable react-hooks/rules-of-hooks */
import type { ColumnDef } from "@tanstack/react-table";
import { CircleOff, CircleX, Shield, StepForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	assignRoleForUser,
	deactivateUser,
	reactivateUser,
	suspendUser,
	type UserData,
	UserSchema,
} from "@/apis/user";
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { f } from "@/components/dashboard-table/filter/table-filter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { capitalize } from "@/lib/string-utils";
import type { ColumnProps } from "@/types/column-props";
import { DataFetcher } from "@/components/data-fetcher";
import { getRole, getRoles } from "@/apis/role";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import TableView from "@/components/dashboard-table/table-view";
import { roleColumns } from "../../roles-and-permissions/_columns/role";
import { useState } from "react";
import { Errorable } from "@/components/undefinable";
import { apiErrHandler } from "@/lib/error-handling";

export const userColumns = ({
	onView,
	onEdit,
}: ColumnProps): ColumnDef<UserData>[] => {
	return [
		{
			accessorKey: "id",
			header: () => <p className="text-right">ID</p>,
			cell: ({ row }) => {
				const id = row.original.id;
				return <p className="text-left">{id}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "profileImageUrl",
			header: "Profile Image",
			cell: ({ row }) => {
				const profileImageUrl = row.original.profileImageUrl;
				const name = row.original.name;

				return (
					<Avatar className="size-10">
						<AvatarImage
							src={profileImageUrl ?? undefined}
							alt={`${name}-profile-image`}
						/>
						<AvatarFallback>{name}</AvatarFallback>
					</Avatar>
				);
			},
		},
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => {
				const name = row.original.name;
				return <p className="font-medium">{name}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "email",
			header: "Email",
			cell: ({ row }) => {
				const email = row.original.email;
				return <p className="">{email}</p>;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "phoneNumber",
			header: "Phone",
			cell: ({ row }) => {
				const phoneNumber = row.original.phoneNumber;
				return <Errorable variant="missing" value={phoneNumber} />;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "roleId",
			header: "Role",
			cell: ({ row }) => {
				const roleId = row.original.roleId;

				return (
					<DataFetcher
						urlId={`/api/vendors/${roleId}`}
						loading={roleId}
						fetcher={getRole(roleId)}
						onFetchFinished={(user) => user.title}
					/>
				);
			},
			meta: {
				isSearchable: {
					id: "roleTitle",
					label: "Role",
				},
				filter: f.enum(["ROL-1", "ROL-2", "ROL-4", "ROL-5"], (opt) => {
					const roleName = {
						"ROL-1": "Employee",
						"ROL-2": "Executive",
						// "ROL-3": "Driver",
						"ROL-4": "Coordinator",
						"ROL-5": "Admin",
					} as const;

					return (
						<div className="flex items-center">{roleName[opt]}</div>
					);
				}),
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.original.status;

				const statusVariants = {
					active: "success",
					inactive: "info",
					suspended: "destructive",
				} as const;

				return (
					<div className="flex items-center">
						<Badge variant={statusVariants[status]}>
							{capitalize(status)}
						</Badge>
					</div>
				);
			},
			meta: {
				filter: f.enum(UserSchema.shape.status.options, (opt) => {
					const statusVariants = {
						active: "success",
						inactive: "info",
						suspended: "destructive",
					} as const;

					return (
						<div className="flex items-center">
							<Badge variant={statusVariants[opt]}>
								{capitalize(opt)}
							</Badge>
						</div>
					);
				}),
			},
		},
		{
			accessorKey: "actions",
			enableSorting: false,
			enableHiding: false,
			header: () => <div className="text-right"></div>,
			cell: ({ row }) => {
				const status = row.original.status;
				const userId = row.original.id;

				const router = useRouter();

				const t = useTranslations("Admin.user.toast");

				const [isRoleSelectOpen, setIsRoleSelectOpen] =
					useState<boolean>(false);

				const handleAssignRoleSubmit = (roleId: string) => {
					toast.promise(assignRoleForUser(userId, roleId), {
						loading: t("changeRole.loading"),
						success: () => {
							router.refresh();
							return t("changeRole.success", {
								userId,
							});
						},
						error: (e) => {
							const apiErr = apiErrHandler(e);
							if (apiErr) return apiErr;

							return t("changeRole.error", {
								userId,
							});
						},
					});
				};

				return (
					<div className="flex items-center justify-end gap-2">
						<ColumnActions
							targetId={userId}
							onView={onView}
							onEdit={onEdit}
							extrasActions={[
								{
									icon: CircleX,
									label: t("deactivate.self"),
									renderCondition: status !== "inactive",
									onClick(id) {
										toast.promise(deactivateUser(id), {
											loading: t("deactivate.loading"),
											success: () => {
												router.refresh();
												return t("deactivate.success", {
													userId,
												});
											},
											error: (e) => {
												const apiErr = apiErrHandler(e);
												if (apiErr) return apiErr;

												return t("deactivate.error", {
													userId,
												});
											},
										});
									},
								},
								{
									icon: CircleOff,
									label: t("suspend.self"),
									renderCondition: status !== "suspended",
									onClick(id) {
										toast.promise(suspendUser(id), {
											loading: t("suspend.loading"),
											success: () => {
												router.refresh();
												return t("suspend.success", {
													userId,
												});
											},
											error: (e) => {
												const apiErr = apiErrHandler(e);
												if (apiErr) return apiErr;

												return t("suspend.error", {
													userId,
												});
											},
										});
									},
								},
								{
									icon: StepForward,
									label: t("unsuspend.self"),
									renderCondition: status !== "active",
									onClick(id) {
										toast.promise(reactivateUser(id), {
											loading: t("unsuspend.loading"),
											success: () => {
												router.refresh();
												return t("unsuspend.success", {
													userId,
												});
											},
											error: (e) => {
												const apiErr = apiErrHandler(e);
												if (apiErr) return apiErr;

												return t("unsuspend.error", {
													userId,
												});
											},
										});
									},
								},
								{
									icon: Shield,
									label: t("changeRole.self"),
									onClick() {
										setIsRoleSelectOpen(true);
									},
								},
							]}
						/>
						<Dialog
							open={isRoleSelectOpen}
							onOpenChange={setIsRoleSelectOpen}
						>
							<DialogContent className="min-w-[80dvw] max-w-[80dvw] max-h-[80dvh] overflow-auto">
								<DialogHeader>
									<DialogTitle>Select a role</DialogTitle>
									<DialogDescription>
										Click on a row to assign a role for this
										user
									</DialogDescription>
								</DialogHeader>
								<TableView
									onRowClick={(row) => {
										setIsRoleSelectOpen(false);
										handleAssignRoleSubmit(row.original.id);
									}}
									columns={roleColumns}
									fetcher={async () => {
										const roles = await getRoles({});

										// Exclude role driver
										return roles.filter(
											(r) => r.id !== "ROL-3",
										);
									}}
								/>
							</DialogContent>
						</Dialog>
					</div>
				);
			},
		},
	] as ColumnDef<UserData>[];
};
