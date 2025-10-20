"use client";

import {
	type ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	OnChangeFn,
	PaginationState,
	Row,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useId, useState } from "react";
import Spinner from "@/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/table-pagination";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	columnVisibility?: Record<string, boolean>;
	data: TData[];
	isLoading?: boolean;
	onRowClick?: (row: Row<TData>) => void;

	sortingState?: {
		sorting: SortingState;
		setSorting: OnChangeFn<SortingState>;
	};

	filterState?: {
		filter: ColumnFiltersState;
		setFilter: OnChangeFn<ColumnFiltersState>;
	};

	paginationState?: {
		pagination: PaginationState;
		setPagination: OnChangeFn<PaginationState>;
	};
}

function DataTable<TData, TValue>({
	columns,
	columnVisibility: columnVisibilityProp,
	data,
	isLoading = false,
	onRowClick,

	sortingState,
	filterState,
	paginationState,
}: DataTableProps<TData, TValue>) {
	const [rowSelection, setRowSelection] = useState({});

	const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(columnVisibilityProp ?? {});

	const toggleAllId = useId();

	const table = useReactTable({
		data,
		columns,
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		onRowSelectionChange: setRowSelection,
		onColumnVisibilityChange: setColumnVisibility,

		onSortingChange: sortingState?.setSorting,
		onColumnFiltersChange: filterState?.setFilter,
		onPaginationChange: paginationState?.setPagination,
		state: {
			rowSelection,
			columnVisibility,
			sorting: sortingState?.sorting,
			columnFilters: filterState?.filter,
			pagination: paginationState?.pagination,
		},

		rowCount: data.length,
	});

	return (
		<div className="flex flex-col w-full">
			<Popover>
				<PopoverTrigger asChild>
					<Button size="icon" variant="transparent">
						<Settings2 />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="space-y-4">
					<h6>Columns settings</h6>
					<div className="flex items-center gap-3">
						<Checkbox
							id={toggleAllId}
							checked={table.getIsAllColumnsVisible()}
							onCheckedChange={(checked) => {
								table.getToggleAllColumnsVisibilityHandler()({
									target: { checked },
									currentTarget: { checked },
								});
							}}
						/>
						<Label htmlFor={toggleAllId}>Toggle all</Label>
					</div>

					{table?.getAllColumns().map((column) => (
						<div key={column.id} className="flex items-center gap-3">
							<Checkbox
								id={column.id}
								checked={column.getIsVisible()}
								disabled={!column.getCanHide()}
								onCheckedChange={(checked) => {
									column.getToggleVisibilityHandler()({
										target: { checked },
										currentTarget: { checked },
									});
								}}
							/>
							<Label htmlFor={column.id}>{column.id}</Label>
						</div>
					))}
				</PopoverContent>
			</Popover>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder ? null : (
											<div
												{...{
													className: header.column.getCanSort()
														? "select-none cursor-pointer flex items-center gap-1"
														: "",
													onClick: header.column.getToggleSortingHandler(),
												}}
											>
												{flexRender(header.column.columnDef.header, header.getContext())}
												{{
													asc: <ChevronUp className="size-4" />,
													desc: <ChevronDown className="size-4" />,
												}[header.column.getIsSorted() as string] ?? null}
											</div>
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
								onClick={() => onRowClick?.(row)}
								className="hover:bg-muted"
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : isLoading ? (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24">
								<div className="flex items-center justify-center">
									<Spinner />
								</div>
							</TableCell>
						</TableRow>
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<TablePagination
				table={table}
				page={paginationState?.pagination}
				onSetPagination={paginationState?.setPagination}
			/>
		</div>
	);
}

export default DataTable;
