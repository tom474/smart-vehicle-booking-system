"use client";

import {
  Column,
  type ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { CSSProperties, useId, useState } from "react";
import Spinner from "@/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "./ui/button";
import { ChevronDown, ChevronsUpDown, ChevronUp, Plus, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { TablePagination } from "./table-pagination";
import { TableFilter } from "./dashboard-table/filter/table-filter";
import { GlobalFilterState, TableSearch } from "./dashboard-table/search/table-search";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { capitalize } from "@/lib/string-utils";


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  columnVisibility?: VisibilityState;

  data: TData[];
  isLoading?: boolean;
  error?: unknown;
  onRowClick?: (row: Row<TData>) => void;
  onCreate?: () => void;

  sortingState?: {
    sorting: SortingState;
    setSorting: OnChangeFn<SortingState>;
  };

  filterState?: {
    filter: ColumnFiltersState;
    setFilter: OnChangeFn<ColumnFiltersState>;
  };

  globalFilterState?: {
    globalFilter: GlobalFilterState,
    setGlobalFilter: OnChangeFn<GlobalFilterState>
  }

  paginationState?: {
    pagination: PaginationState;
    setPagination: OnChangeFn<PaginationState>;
  };
}

export default function DataTable<TData, TValue>({
  columns,
  columnVisibility: columnVisibilityProp,

  data,
  isLoading = false,
  error,

  onRowClick,
  onCreate,

  sortingState,
  filterState,
  globalFilterState,
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
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,

    onSortingChange: sortingState?.setSorting,
    onColumnFiltersChange: filterState?.setFilter,
    onGlobalFilterChange: globalFilterState?.setGlobalFilter,
    onPaginationChange: paginationState?.setPagination,

    initialState: {
      columnPinning: {
        left: [],
        right: ['actions'],
      },
    },

    state: {
      rowSelection,
      columnVisibility,
      sorting: sortingState?.sorting,
      columnFilters: filterState?.filter,
      globalFilter: globalFilterState?.globalFilter,
      pagination: paginationState?.pagination,
    },

    rowCount: data.length,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
  });

  return (
    <div className="w-full flex flex-col gap-2 space-y-2">
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="transparent">
              <Settings2 />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="space-y-4 max-h-[512px] overflow-y-auto">
            <h6>Show columns</h6>
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
              <Label htmlFor={toggleAllId}>All</Label>
            </div>

            {table?.getAllColumns().map((column) => (
              column.getCanHide() && <div key={column.id} className="flex items-center gap-3">
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
                <Label htmlFor={column.id}>{column.id === "id" ? "ID" : capitalize(typeof column.columnDef.header === "string" ? column.columnDef.header : column.id)}</Label>
              </div>
            ))}
          </PopoverContent>
        </Popover>
        {/* <TableFilterLegacy table={table} schema={schema} /> */}
        <div className="w-full max-w-[35%]">
          <TableSearch isLoading={isLoading} table={table} />
        </div>
        {isLoading && (
          <div className="flex h-full justify-center items-center aspect-square">
            <Spinner className="size-4 border-2" />
          </div>
        )}
        <div className="flex flex-1 justify-end">
          {onCreate && (
            <div className="flex w-full justify-end">
              <Button onClick={() => { onCreate() }}>
                <Plus />
              </Button>
            </div>
          )}
        </div>
      </div>
      <TableFilter isLoading={isLoading} table={table} />

      <div className="flex-1 max-h-[60dvh] overflow-auto">
        <Table className="w-full overflow-auto">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const { column } = header
                  const { className, style } = getCommonPinningStyles(column)


                  return (
                    <TableHead
                      key={header.id}
                      style={style}
                      className={cn("bg-white", className)}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: cn(header.column.columnDef.meta?.isSortable
                              ? "select-none cursor-pointer flex items-center gap-1"
                              : "",
                              "flex items-center gap-2"),
                            onClick: header.column.columnDef.meta?.isSortable ? header.column.getToggleSortingHandler() : undefined,
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {/* Render arrow/icon if the column is sortable */}
                          {header.column.columnDef.meta?.isSortable && (
                            !header.column.getIsSorted() ?
                              <ChevronsUpDown className="size-4" /> // If column is not sorted
                              :
                              {
                                asc: <ChevronUp className="size-4" />,
                                desc: <ChevronDown className="size-4" />,
                              }[header.column.getIsSorted() as string] // If column is sorted, render up/down base on sort direction
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="max-h-[100px] overflow-y-scroll">
            {error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center text-destructive font-bold italic">
                  There was an error fetching data
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row)}
                  className="hover:bg-muted"
                >
                  {row.getVisibleCells().map((cell) => {
                    const { column } = cell
                    const { className, style } = getCommonPinningStyles(column)

                    return (
                      <TableCell
                        key={cell.id}
                        style={style}
                        className={cn("bg-white", className)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>

                    )
                  })}
                </TableRow>
              ))
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48">
                  <div className="flex items-center justify-center">
                    <Spinner />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        table={table}
        isLoading={isLoading}
        page={paginationState?.pagination}
        onSetPagination={paginationState?.setPagination}
      />
    </div >
  );
}

const pinnedColumnVariants = cva("", {
  variants: {
    pinned: {
      left: "sticky z-10",
      right: "sticky z-10",
      none: "relative z-0",
    },
    visual: {
      left: "shadow-[inset_-1px_0_0_0_#e5e7eb,2px_0_24px_-8px_rgba(0,0,0,0.25)] [clip-path:inset(0px_-24px_0px_0px)]",
      right: "shadow-[inset_1px_0_0_0_#e5e7eb,-2px_0_24px_-8px_rgba(0,0,0,0.25)] [clip-path:inset(0px_0px_0px_-24px)]",
      none: "",
    },
  },
  defaultVariants: {
    pinned: "none",
    visual: "none"
  },
})

// These are the important styles to make sticky column pinning work!
// Apply styles like this using your CSS strategy of choice with this kind of logic to head cells, data cells, footer cells, etc.
// View the index.css file for more needed styles such as border-collapse: separate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCommonPinningStyles = (column: Column<any>): { className: string, style: CSSProperties } => {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    className: pinnedColumnVariants({
      pinned:
        isPinned === "left"
          ? "left"
          : isPinned === "right"
            ? "right"
            : "none",
      visual: isLastLeftPinnedColumn
        ? "left"
        : isFirstRightPinnedColumn
          ? "right"
          : "none",
    }),
    style: {
      left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
      right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
      width: column.getSize(),
    } as React.CSSProperties,
  }
}

