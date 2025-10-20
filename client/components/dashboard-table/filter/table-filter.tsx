import { Column, Table } from "@tanstack/react-table";
import { capitalize } from "@/lib/string-utils";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import Badge from "../../badge";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnumFilterMeta, EnumLabels, FilterEnum } from "./enum-filter";
import { FilterNumber, NumberFilterMeta } from "./number-filter";
import { DateTimeFilterMeta, FilterDateTime } from "./date-time-filter";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { EnumFilterPromiseMeta, FilterEnumPromise } from "./enum-filter-promise";
import { BooleanFilterMeta, FilterBoolean } from "./boolean-filter";
import { DateRangeMeta, FilterDateRange } from "./date-range-filter";

interface TableFilterProps<T> {
  table: Table<T>,
  isLoading?: boolean,
}

export function TableFilter<T>({
  table,
  isLoading
}: TableFilterProps<T>) {
  const leafColumns = table.getAllLeafColumns()

  const [filterCount, _setFilterCount] = useState<Set<string>>(new Set())
  const setFilterCount = useCallback((id: string, b: boolean) => {
    _setFilterCount(prev => {
      const newSet = new Set(prev)
      if (b) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])

  const renderFilter: ReactNode[] = leafColumns.map((col) => {
    if (!col.getCanFilter()) return

    const filterMeta = col.columnDef.meta?.filter
    if (!filterMeta?.type) return

    const filterConfig = col.columnDef.meta?.filterConfig

    return <Filter isLoading={isLoading} key={col.id} col={col} table={table} filterMeta={filterMeta} filterConfig={filterConfig} setFilterCount={setFilterCount} />
  }).filter(Boolean)

  if (renderFilter.length === 0) return

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span>Filter:</span>
      {...renderFilter}
      {filterCount.size > 0 && (
        <Button disabled={isLoading} variant="link" className="flex-1" size="fit" onClick={() => table.resetColumnFilters()}>
          Clear filter
        </Button>
      )}
    </div>
  );
}

export interface FilterConfig {
  label?: string
}


interface FilterProps<T> {
  col: Column<T>
  table: Table<T>
  filterMeta: FilterMeta
  filterConfig?: FilterConfig,
  isLoading?: boolean,
  setFilterCount: (id: string, b: boolean) => void
}

function Filter<T>({ col, table, filterMeta, filterConfig, isLoading, setFilterCount }: FilterProps<T>) {
  const colId = col.id
  const headerLabel =
    typeof col.columnDef.header === "string"
      ? col.columnDef.header
      : colId

  const filterValue = useMemo(() =>
    (col.getFilterValue() as string[]) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [col.getFilterValue()]
  );
  const setFilterValue = col.setFilterValue

  useEffect(() => {
    if (filterValue.length > 0) setFilterCount(headerLabel, true); else setFilterCount(headerLabel, false)
  }, [filterValue, headerLabel, setFilterCount])

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation() // prevent opening the popover
    col.setFilterValue(undefined)
    if (filterMeta.type === "number") {
      table.setColumnFilters((old) => {
        return old.filter(
          (f) => f.id !== filterMeta.minId && f.id !== filterMeta.maxId
        )
      })
    } else if (filterMeta.type === "date-range") {
      table.setColumnFilters((old) => {
        return old.filter(
          (f) => f.id !== filterMeta.minId && f.id !== filterMeta.maxId
        )
      })
    }
  }

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={isLoading}
          size="sm"
          className={cn("relative min-w-[120px] justify-between",
            "text-gray-700",
            "hover:bg-background hover:text-foreground hover:border-primary",
            filterValue.length > 0 && "border-primary text-foreground")}
        >
          <div className="flex gap-2">
            <span>{filterConfig?.label ? capitalize(filterConfig.label) : capitalize(headerLabel)}</span>

            {filterValue.length > 0 && (
              <Badge
                variant="destructive"
                className="rounded-full px-2 py-0 text-xs"
              >
                {filterValue.length}
              </Badge>
            )}
          </div>


          {filterMeta.type !== 'boolean' && (
            filterValue.length > 0 ? (
              <Button className="text-muted-foreground hover:text-primary" variant='transparent' size='fit' onClick={clearFilter}>
                <X
                  className="size-4"
                />
              </Button>
            ) : <ChevronDown className="size-4" />
          )}

          {filterMeta.type === 'boolean' &&
            <FilterBoolean value={filterValue} setValue={setFilterValue} />}
        </Button>
      </PopoverTrigger>
      {filterMeta.type !== 'boolean' && (
        <PopoverContent className="p-2 bg-white w-fit">
          <FilterUI filter={filterMeta} table={table} value={filterValue} setValue={setFilterValue} />
        </PopoverContent>
      )}
    </Popover>
  )
}

export const f = {
  enum: <const T extends readonly string[]>(
    options: T,
    labels?: EnumLabels<T>
  ): EnumFilterMeta<T> => {
    return {
      type: "enum",
      options,
      labels
    };
  },

  enumPromise: (
    optionsPromise: () => Promise<string[]>,
    labels?: (opt: string) => ReactNode
  ): EnumFilterPromiseMeta => {
    return {
      type: "enum-promise",
      optionsPromise,
      labels
    };
  },

  number: (
    minId?: string,
    min?: number,
    maxId?: string,
    max?: number,
    step?: number,
    label?: (value: number) => ReactNode
  ): NumberFilterMeta => {
    return {
      type: "number",
      minId, maxId,
      min, max, step,
      label
    }
  },

  dateTime: (
    min?: Date,
    max?: Date,
    label?: (date: Date) => React.ReactNode
  ): DateTimeFilterMeta => {
    return {
      type: "date-time",
      min, max,
      label
    }
  },

  dateRange: (
    minId?: string,
    min?: Date,
    maxId?: string,
    max?: Date,
    label?: (value: Date) => ReactNode
  ): DateRangeMeta => {
    return {
      type: "date-range",
      minId, maxId,
      min, max,
      label
    }
  },

  boolean: (): BooleanFilterMeta => {
    return {
      type: "boolean",
    }
  },

}

export type FilterMeta =
  EnumFilterMeta |
  EnumFilterPromiseMeta |
  NumberFilterMeta |
  DateTimeFilterMeta |
  DateRangeMeta |
  BooleanFilterMeta

interface FilterUIProps<T> {
  table: Table<T>
  filter: FilterMeta
  value: string[]
  setValue: (val: string[] | undefined) => void
}

function FilterUI<T>({ table, filter, value, setValue }: FilterUIProps<T>) {
  switch (filter.type) {
    case "enum":
      return <FilterEnum schema={filter} value={value} setValue={setValue} />
    case "enum-promise":
      return <FilterEnumPromise schema={filter} value={value} setValue={setValue} />
    case "number":
      return <FilterNumber table={table} schema={filter} value={value} setValue={setValue} />
    case "date-time":
      return <FilterDateTime schema={filter} value={value} setValue={setValue} />
    case "date-range":
      return <FilterDateRange table={table} schema={filter} value={value} setValue={setValue} />
  }
}


