import useSWR from "swr";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { DriverData, getDrivers } from "@/apis/driver";
import TableView from "../dashboard-table/table-view";
import Spinner from "../spinner";
import { ComponentProps, PropsWithChildren, useState } from "react";
import { driverColumns } from "@/app/admin/drivers/_columns/driver";

interface SelectDriverProps extends PropsWithChildren, ComponentProps<typeof DialogTrigger> {
	onRowSelect?: (v: string) => void;
}

export const SelectDriver = ({ onRowSelect, children, ...props }: SelectDriverProps) => {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger {...props}>{children}</DialogTrigger>
			<DialogContent className="min-w-fit">
				<DialogHeader>
					<DialogTitle>Select a driver</DialogTitle>
					<DialogDescription>
						Selected request will be merged together with the current request
					</DialogDescription>
				</DialogHeader>
				<DriverList onOpenChange={setOpen} onRowSelect={onRowSelect} />
			</DialogContent>
		</Dialog>
	);
};

interface DriverListProps {
	onOpenChange: (v: boolean) => void;
	onRowSelect?: (v: string) => void;
}

const DriverList = ({ onOpenChange, onRowSelect }: DriverListProps) => {
	const { data, error, isLoading } = useSWR("/api/trips", () => getDrivers({}));

	if (isLoading)
		return (
			<div className="items-center justify-center size-full">
				<Spinner />
			</div>
		);
	if (error) return <h1>Error getting avaiable requests</h1>;
	if (!data) return <p>No available requests could be found</p>;

	return (
		<TableView
			onRowClick={(row) => {
				console.log(row.original);
				onRowSelect?.(row.original.id);
				onOpenChange(false);
			}}
			columns={driverColumns}
			fetcher={new Promise<DriverData[]>((r) => r(data))}
		/>
	);
};
