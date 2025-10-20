import { Table } from "@tanstack/react-table";
import { KeyboardEvent, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { capitalize } from "@/lib/string-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export interface SearchConfig {
  id?: string
  label?: string
}

export interface GlobalFilterState {
  id: string;
  value: string;
  pageIndex: number;
  pageSize: number;
}

interface TableSearchProps<T> {
  table: Table<T>;
  isLoading?: boolean,
}

export function TableSearch<T>({ table, isLoading }: TableSearchProps<T>) {
  const leafColumns = table.getAllLeafColumns()
    .filter((col) => col.columnDef.meta?.isSearchable);

  const globalFilter = table.getState().globalFilter as GlobalFilterState | undefined;

  const [selectedColumnId, setSelectedColumnId] = useState<string>(
    // If id is empty, use the first col in leafColumns
    // unknown is unrelated as empty length result in no render anyway
    globalFilter && globalFilter.id ? globalFilter.id : (leafColumns[0]?.id ?? "unknown"),
  );

  const [inputValue, setInputValue] = useState<string>(
    globalFilter?.id === selectedColumnId ? (globalFilter?.value ?? "") : "",
  );

  if (leafColumns.length === 0) return;

  const handleColumnChange = (colId: string) => {
    setSelectedColumnId(colId);
  };

  const handleSearchChange = (value: string) => {
    setInputValue(value);
  };

  const handleApply = () => {
    table.setGlobalFilter({ id: selectedColumnId, value: inputValue });
  };

  const handleReset = () => {
    setInputValue("");
    table.setGlobalFilter({ id: selectedColumnId, value: undefined });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleApply();
    }
  };

  return (
    <div className="flex w-full gap-2">
      {/* <Select value={selectedColumnId} onValueChange={handleColumnChange}> */}
      {/*   <SelectTrigger className="min-w-[120px]"> */}
      {/*     <SelectValue placeholder="Select column" /> */}
      {/*   </SelectTrigger> */}
      {/*   <SelectContent> */}
      {/*     {leafColumns.map((col) => { */}
      {/*       let colId = col.id; */}
      {/*       let headerLabel = typeof col.columnDef.header === "string" ? col.columnDef.header : colId; */}
      {/**/}
      {/*       if (typeof col.columnDef.meta?.isSearchable === 'object') { */}
      {/*         if (col.columnDef.meta.isSearchable.id) colId = col.columnDef.meta.isSearchable.id */}
      {/*         if (col.columnDef.meta.isSearchable.label) headerLabel = col.columnDef.meta.isSearchable.label */}
      {/*       } */}
      {/**/}
      {/*       return ( */}
      {/*         <SelectItem key={colId} value={colId}> */}
      {/*           {capitalize(headerLabel)} */}
      {/*         </SelectItem> */}
      {/*       ); */}
      {/*     })} */}
      {/*   </SelectContent> */}
      {/* </Select> */}

      {/* Search Input */}
      <div
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 rounded-md border bg-transparent py-0 px-4 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "w-full",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          "gap-2 flex items-center",
        )}
      >

        <Select value={selectedColumnId} onValueChange={handleColumnChange}>
          <SelectTrigger disabled={isLoading} className="w-[128px] [*>span]:!truncate border-none shadow-none focus-visible:border-none focus-visible:ring-0 p-0">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent className="-translate-x-4">
            {leafColumns.map((col) => {
              let colId = col.id;
              let headerLabel = typeof col.columnDef.header === "string" ? col.columnDef.header : colId;

              if (typeof col.columnDef.meta?.isSearchable === 'object') {
                if (col.columnDef.meta.isSearchable.id) colId = col.columnDef.meta.isSearchable.id
                if (col.columnDef.meta.isSearchable.label) headerLabel = col.columnDef.meta.isSearchable.label
              }

              headerLabel = headerLabel === "id" ? "ID" : capitalize(headerLabel)

              return (
                <SelectItem key={colId} value={colId}>
                  {headerLabel}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div className="py-2 w-fit h-full">
          <Separator orientation="vertical" />
        </div>

        <Input
          placeholder="Search..."
          disabled={isLoading}
          value={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full border-none shadow-none focus-visible:border-none focus-visible:ring-0 p-0"
          onKeyDown={handleKeyDown}
        />

        <Button
          className={cn("text-gray-700 hover:text-primary transition-all duration-150",
            inputValue.trim().length !== 0
              ? "opacity-100 scale-100 visible"
              : "opacity-0 scale-95 invisible"
          )}
          disabled={isLoading}
          variant="transparent"
          size="fit"
          onClick={() => handleReset()}
        >
          <X className="size-4" />
        </Button>

        <Button
          className="text-gray-700 hover:text-primary"
          disabled={isLoading}
          variant="transparent"
          size="fit"
          onClick={() => handleApply()}
        >
          <Search className="size-4" />
        </Button>

        {/* <Button size='icon' onClick={() => handleApply()}> */}
        {/*   <Check className="size-4" /> */}
        {/* </Button> */}
      </div>
    </div>
  );
}
