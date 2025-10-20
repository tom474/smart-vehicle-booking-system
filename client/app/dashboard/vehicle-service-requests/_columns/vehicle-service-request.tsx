/* eslint-disable react-hooks/rules-of-hooks */
import type { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { getDriver } from "@/apis/driver";
import {
	approveVehicleServiceRequest,
	rejectVehicleServiceRequest,
	type VehicleServiceData,
	VehicleServiceSchema,
} from "@/apis/vehicle-service-request";
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { f } from "@/components/dashboard-table/filter/table-filter";
import { DataFetcher } from "@/components/data-fetcher";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Errorable } from "@/components/undefinable";
import type { ColumnProps } from "@/types/column-props";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import z from "zod/v4";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { apiErrHandler } from "@/lib/error-handling";

export const vehicleServiceColumns = ({
	onView,
	onEdit,
	onDestructiveAction,
}: ColumnProps): ColumnDef<VehicleServiceData>[] => {
	return [
		{
			accessorKey: "id",
			header: () => <p className="text-right">ID</p>,
			cell: ({ row }) => {
				const id = row.original.id;
				return <p className="text-left">{id}</p>;
			},
			meta: {
				isSortable: true,
				isSearchable: true,
			},
		},
		{
			accessorKey: "vehicleId",
			enableHiding: false,
			meta: {
				isSearchable: {
					id: "vehicleLicensePlate",
					label: "Vehicle License Plate",
				},
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.original.status;
				switch (status) {
					case "pending":
						return <Badge variant="warning">Pending</Badge>;
					case "approved":
						return <Badge variant="success">Approved</Badge>;
					case "rejected":
						return <Badge variant="destructive">Rejected</Badge>;
					case "completed":
						return <Badge variant="info">Completed</Badge>;
					case "cancelled":
						return <Badge variant="destructive">Cancelled</Badge>;
					default:
						return <Badge variant="destructive">Unknown</Badge>;
				}
			},
			meta: {
				filter: f.enum(
					VehicleServiceSchema.shape.status.options,
					(opt) => {
						switch (opt) {
							case "pending":
								return <Badge variant="warning">Pending</Badge>;
							case "approved":
								return (
									<Badge variant="success">Approved</Badge>
								);
							case "rejected":
								return (
									<Badge variant="destructive">
										Rejected
									</Badge>
								);
							case "completed":
								return <Badge variant="info">Completed</Badge>;
							case "cancelled":
								return (
									<Badge variant="destructive">
										Cancelled
									</Badge>
								);
							default:
								return (
									<Badge variant="destructive">Unknown</Badge>
								);
						}
					},
				),
			},
		},
		{
			accessorKey: "driverId",
			header: "Driver Name",
			cell: ({ row }) => {
				const driverId = row.original.driverId;

				if (!driverId) return <Errorable shouldError />;

				return (
					<DataFetcher
						urlId={`/api/drivers/${driverId}`}
						loading={driverId}
						fetcher={getDriver(driverId)}
						onFetchFinished={(user) => user.name}
					/>
				);
			},
			meta: {
				isSearchable: true,
			},
		},

		{
			accessorKey: "serviceCategory",
			header: "Service Type",
			cell: ({ row }) => {
				const serviceCategory = row.original.serviceType;
				return (
					<Badge
						variant={
							serviceCategory === "repair"
								? "destructive"
								: "info"
						}
					>
						{serviceCategory === "repair"
							? "Repair"
							: "Maintenance"}
					</Badge>
				);
			},
		},
		{
			accessorKey: "startDate",
			header: "From",
			cell: ({ row }) => {
				const startDate = row.original.startTime;
				return <p>{startDate.toLocaleDateString()}</p>;
			},
			meta: {
				isSortable: true,
				filterConfig: {
					label: "Start time",
				},
				filter: f.dateRange(
					"startTimeFrom",
					undefined,
					"startTimeTo",
					undefined,
				),
			},
		},
		{
			accessorKey: "endDate",
			header: "To",
			cell: ({ row }) => {
				const endDate = row.original.endTime;
				return <p>{endDate.toLocaleDateString()}</p>;
			},
			meta: {
				isSortable: true,
				filterConfig: {
					label: "End time",
				},
				filter: f.dateRange(
					"endTimeFrom",
					undefined,
					"endTimeTo",
					undefined,
				),
			},
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => {
				const description = row.original.description;
				return <Errorable variant="missing" value={description} />;
			},
			meta: {
				isSortable: true,
				isSearchable: true,
			},
		},
		{
			accessorKey: "expense",
			header: "Expenses",
			cell: ({ row }) => {
				const expenses = row.original.expenses;
				return (
					expenses?.map((e, idx) => <p key={idx}>{e}</p>) ?? (
						<Errorable variant="missing" shouldError />
					)
				);
			},
		},
		{
			accessorKey: "actions",
			enableSorting: false,
			enableHiding: false,
			header: () => <div className="text-right"></div>,
			cell: ({ row }) => {
				const serviceId = row.original.id;
				const status = row.original.status;

				const router = useRouter();

				const RejectSchema = z.object({
					reason: z.string("Reason cant be empty"),
				});

				const [isDialogOpen, setIsDialogOpen] = useState(false);
				const form = useForm<z.infer<typeof RejectSchema>>({
					resolver: zodResolver(RejectSchema),
				});

				const t = useTranslations("Coordinator.vehicleService.toast");
				const tca = useTranslations("DataTable.columnActions");
				const trd = useTranslations(
					"Coordinator.vehicleService.rejectDialog",
				);

				function onSubmit(data: z.infer<typeof RejectSchema>) {
					toast.promise(
						rejectVehicleServiceRequest(serviceId, data.reason),
						{
							loading: t("reject.loading"),
							success: () => {
								router.refresh();
								return t("reject.success");
							},
							error: (e) => {
								const apiErr = apiErrHandler(e);
								if (apiErr) return apiErr;

								return t("reject.error", { id: serviceId });
							},
						},
					);
				}

				return (
					<div className="flex items-center justify-end gap-2">
						<ColumnActions
							targetId={serviceId}
							onView={onView}
							onEdit={onEdit}
							editDisable={
								status === "approved" || status === "rejected"
							}
							onDestructiveAction={onDestructiveAction}
							extrasActions={[
								{
									icon: Check,
									label: tca("approve"),
									renderCondition: status !== "approved",
									onClick(id) {
										toast.promise(
											approveVehicleServiceRequest(id),
											{
												loading: t("approve.loading"),
												success: () => {
													router.refresh();
													return t(
														"approve.success",
														{
															id,
														},
													);
												},
												error: (e) => {
													const apiErr =
														apiErrHandler(e);
													if (apiErr) return apiErr;

													return t("approve.error", {
														id,
													});
												},
											},
										);
									},
								},
								{
									icon: X,
									label: tca("reject"),
									renderCondition: status !== "rejected",
									onClick() {
										setIsDialogOpen(true);
									},
								},
							]}
						/>
						<AlertDialog
							open={isDialogOpen}
							onOpenChange={setIsDialogOpen}
						>
							<AlertDialogContent>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className="flex flex-col gap-4"
									>
										<AlertDialogHeader>
											<AlertDialogTitle>
												{trd("title")}
											</AlertDialogTitle>
											<AlertDialogDescription>
												{trd("description")}
											</AlertDialogDescription>
										</AlertDialogHeader>

										<FormField
											control={form.control}
											name="reason"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{trd("label")}
													</FormLabel>
													<FormControl>
														<Textarea
															placeholder={trd(
																"placeholder",
															)}
															className="resize-none"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<AlertDialogFooter>
											<AlertDialogCancel>
												{trd("cancel")}
											</AlertDialogCancel>
											<Button
												type="submit"
												variant="destructive"
											>
												{trd("confirm")}
											</Button>
										</AlertDialogFooter>
									</form>
								</Form>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				);
			},
		},
	] as ColumnDef<VehicleServiceData>[];
};
