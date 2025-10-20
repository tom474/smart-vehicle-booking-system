'use client';

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PaginationState, Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface PaginationProps<T> {
  table: Table<T>
  page?: PaginationState
  isLoading?: boolean
  onSetPagination?: (updater: (prev: PaginationState) => PaginationState) => void
};

export function TablePagination<T>({ table, page, isLoading, onSetPagination }: PaginationProps<T>) {
  const ttp = useTranslations("DataTable.pagination")

  // Detect shift hold down
  const [shiftDown, setShiftDown] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftDown(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftDown(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const state = page ?? table.getState().pagination;

  const setPage = (newIndex: number) => {
    if (onSetPagination) {
      onSetPagination((prev: PaginationState) => ({
        ...prev,
        pageIndex: newIndex,
      }));
    } else {
      table.setPageIndex(newIndex);
    }
  };

  const setPageSize = (size: number) => {
    if (isLoading) return;
    if (onSetPagination) {
      onSetPagination((prev: PaginationState) => ({
        ...prev,
        pageSize: size,
        pageIndex: 0,
      }));
    } else {
      table.setPageSize(size);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          className="relative flex -gap-2"
          variant="outline"
          size="icon"
          onClick={() => {
            if (shiftDown) {
              setPage(1)
            } else {
              setPage(state.pageIndex - 1)
            }
          }}
          disabled={isLoading || state.pageIndex === 1}
        >
          <ChevronLeft
            className={cn(`absolute transition-all duration-200`, (state.pageIndex !== 1 && shiftDown) && "-translate-x-1")}
          />
          <ChevronLeft
            className={cn(`absolute transition-all duration-200`, (state.pageIndex !== 1 && shiftDown) ? "opacity-100 translate-x-1" : "opacity-0")}
          />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(state.pageIndex + 1)}
          disabled={isLoading || table.getRowModel().rows.length < state.pageSize}
        // disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {ttp("page")}{" "}
          <strong>{state.pageIndex}</strong>
        </span>
        {/* <span>| Go to page:</span> */}
        {/* <Input */}
        {/*   min={1} */}
        {/*   max={table.getPageCount()} */}
        {/*   value={state.pageIndex} */}
        {/*   onChange={(e) => { */}
        {/*     const value = e.target.value ? Number(e.target.value) - 1 : 0; */}
        {/*     setPage(value); */}
        {/*   }} */}
        {/*   className="w-9" */}
        {/* /> */}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">{ttp("rowsPerPage")}:</span>
        <Select
          value={String(state.pageSize)}
          onValueChange={(val) => setPageSize(Number(val))}
        >
          <SelectTrigger disabled={isLoading} className="w-[80px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
