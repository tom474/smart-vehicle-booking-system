/* eslint-disable react-hooks/rules-of-hooks */
import type { ColumnDef } from "@tanstack/react-table";
import { CircleOff, CircleX, StepForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { activateDriver, deactivateDriver, type DriverData, DriverSchema, suspendDriver } from "@/apis/driver";
import { getLocationById } from "@/apis/location";
import { getVendor } from "@/apis/vendor";
import Badge from "@/components/badge";
import ColumnActions from "@/components/dashboard-table/column-actions";
import { f } from "@/components/dashboard-table/filter/table-filter";
import { DataFetcher } from "@/components/data-fetcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Errorable } from "@/components/undefinable";
import { capitalize } from "@/lib/string-utils";
import type { ColumnProps } from "@/types/column-props";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

export const driverColumns = ({
	onView,
	onEdit,
	// onDestructiveAction,
}: ColumnProps): ColumnDef<DriverData>[] => {
	return [
		{
			accessorKey: "id",
			header: () => <p className="text-right">ID</p>,
			cell: ({ row }) => {
				const id = row.original.id;
				return <p className="">{id}</p>;
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
				// Get initials from name for fallback
				const initials = name
					.split(" ")
					.map((word) => word[0])
					.join("")
					.toUpperCase()
					.slice(0, 2);
				return (
					<Avatar className="size-10">
						<AvatarImage src={profileImageUrl ?? undefined} alt={`@${name}`} />
						<AvatarFallback>{initials}</AvatarFallback>
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
			accessorKey: "username",
			header: "Username",
			cell: ({ row }) => {
				const username = row.original.username;
				return <p className="font-medium">{username}</p>;
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

				return <Errorable value={email} variant="missing" />;
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
				return <Errorable value={phoneNumber} variant="missing" />;
			},
			meta: {
				isSearchable: true,
				isSortable: true,
			},
		},
		{
			accessorKey: "vehicleId",
			header: "VehicleId",
			cell: ({ row }) => {
				const vehicleId = row.original.vehicleId;
				return <Errorable value={vehicleId} variant="missing" />;
			},
		},
		{
			accessorKey: "vendorId",
			header: "Vendor Name",
			cell: ({ row }) => {
				const vendorId = row.original.vendorId;
				if (!vendorId) return <Errorable shouldError variant="missing" />;

				return (
					<DataFetcher
						urlId={`/api/vendors/${vendorId}`}
						loading={vendorId}
						fetcher={getVendor(vendorId)}
						onFetchFinished={(user) => user.name}
					/>
				);
			},
			meta: {
				// isSearchable: true,
				isSearchable: {
					id: "vendorName",
				},
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

				return <Badge variant={statusVariants[status]}>{capitalize(status)}</Badge>;
			},
			meta: {
				filter: f.enum(DriverSchema.shape.status.options, (opt) => {
					const statusVariants = {
						active: "success",
						inactive: "info",
						suspended: "destructive",
					} as const;

					return (
						<div className="flex items-center">
							<Badge variant={statusVariants[opt]}>{capitalize(opt)}</Badge>
						</div>
					);
				}),
			},
		},
		{
			accessorKey: "availability",
			header: "Availability",
			cell: ({ row }) => {
				const availability = row.original.availability;

				const statusVariants = {
					available: "success",
					on_leave: "warning",
					on_trip: "info",
					on_return: "info",
					unavailable: "destructive",
				} as const;

				return (
					<Badge variant={statusVariants[availability]}>
						{capitalize(availability.split("_").map(capitalize).join(" "))}
					</Badge>
				);
			},
			meta: {
				filter: f.enum([...DriverSchema.shape.availability.options, "unavailable"], (opt) => {
					const statusVariants = {
						available: "success",
						on_leave: "warning",
						on_trip: "info",
						on_return: "info",
						unavailable: "destructive",
					} as const;

					return <Badge variant={statusVariants[opt]}>{capitalize(opt.replaceAll("_", " "))}</Badge>;
				}),
			},
		},
		{
			accessorKey: "ownershipType",
			header: "Ownership",
			cell: ({ row }) => {
				const ownershipType = row.original.ownershipType;

				const ownershipVariants = {
					company: "success",
					vendor: "info",
				} as const;

				return <Badge variant={ownershipVariants[ownershipType]}>{capitalize(ownershipType)}</Badge>;
			},
			meta: {
				filter: f.enum(DriverSchema.shape.ownershipType.options, (opt) => {
					const ownershipVariants = {
						company: "success",
						vendor: "info",
					} as const;

					return <Badge variant={ownershipVariants[opt]}>{capitalize(opt)}</Badge>;
				}),
			},
		},

		{
			accessorKey: "baseLocationId",
			header: "Base Location",
			cell: ({ row }) => {
				const baseLocId = row.original.baseLocationId;
				if (!baseLocId) return <Errorable shouldError />;

				return (
					<DataFetcher
						urlId={`/api/locations/${baseLocId}`}
						loading={baseLocId}
						fetcher={getLocationById(baseLocId)}
						onFetchFinished={(loc) => loc.name}
					/>
				);
			},
			meta: {
				isSearchable: true,
			},

			// meta: {
			//   filter: f.enumPromise(async () => {
			//     const vendors = await getFixedLocations();
			//     return vendors.map((loc) => loc.id);
			//   }),
			// },
		},
		// {
		//   accessorKey: "currentLocation",
		//   header: "Current Location",
		//   cell: ({ row }) => {
		//     const currentLocation = row.original.currentLocation;
		//     return <p className="text-sm">{currentLocation}</p>;
		//   },
		// },
		{
			accessorKey: "actions",
			enableHiding: false,
			header: () => <div className="text-right"></div>,
			cell: ({ row }) => {
				const router = useRouter();

				const tdca = useTranslations("Admin.driver.columnActions");
				const tToast = useTranslations("Admin.driver.toast");

				const status = row.original.status;
				const driverId = row.original.id;
				return (
					<div className="flex items-center justify-end gap-2">
						<ColumnActions
							targetId={driverId}
							onView={onView}
							onEdit={onEdit}
							editDisable={status !== "active"}
							extrasActions={[
								{
									icon: CircleOff,
									label: tdca("suspend"),
									renderCondition: status !== "suspended",
									onClick(id) {
										toast.promise(suspendDriver(id), {
											loading: tToast("suspend.loading"),
											success: () => {
												router.refresh();
												return tToast("suspend.success", { userId: id });
											},
											error: (e) => {
												const apiErr = apiErrHandler(e);
												if (apiErr) return apiErr;

												return tToast("suspend.error", {
													userId: id,
												});
											},
										});
									},
								},
								{
									icon: CircleX,
									label: tdca("deActivate"),
									renderCondition: status !== "inactive",
									onClick(id) {
										toast.promise(deactivateDriver(id), {
											loading: tToast("deactivate.loading"),
											success: () => {
												router.refresh();
												return tToast("deactivate.success", { userId: id });
											},
											error: (e) => {
												const apiErr = apiErrHandler(e);
												if (apiErr) return apiErr;

												return tToast("deactivate.error", {
													userId: id,
												});
											},
										});
									},
								},
								{
									icon: StepForward,
									label: tdca("activate"),
									renderCondition: status !== "active",
									onClick(id) {
										toast.promise(activateDriver(id), {
											loading: tToast("activate.loading"),
											success: () => {
												router.refresh();
												return tToast("activate.success", { userId: id });
											},
											error: (e) => {
												const apiErr = apiErrHandler(e);
												if (apiErr) return apiErr;

												return tToast("activate.error", {
													userId: id,
												});
											},
										});
									},
								},
							]}
						/>
					</div>
				);
			},
		},
	] as ColumnDef<DriverData>[];
};
