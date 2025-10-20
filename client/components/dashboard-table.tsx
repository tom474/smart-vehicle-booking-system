// "use client";

import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/data-table";
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";
import { GlobalFilterState } from "./dashboard-table/search/table-search";

type Fetcher<T> = (
  sorting: SortingState,
  filters: ColumnFiltersState,
  globalFilter: GlobalFilterState,
  pagination: PaginationState,
) => Promise<T[]>;
export type TableFetcherType<T> = Promise<T[]> | Fetcher<T>;

interface Props<T> {
  columns: ColumnDef<T>[];
  onRowClick?: (row: Row<T>) => void;
  onCreate?: () => void;
  fetcher: TableFetcherType<T>;

  columnVisibility?: VisibilityState
}

function DashboardTable<T>({ columns, onRowClick, onCreate, fetcher, columnVisibility }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<GlobalFilterState>({
    id: "",
    value: "",
    pageIndex: 1, //initial page index
    pageSize: 10, //default page size
  });
  const [pagination, _setPagination] = useState<PaginationState>({
    pageIndex: 1, //initial page index
    pageSize: 10, //default page size
  });

  // Custom setter to logically check the page index
  const setPagination: OnChangeFn<PaginationState> = (updateOrValue: Updater<PaginationState>) => {
    _setPagination((prev) => {
      const newValue = typeof updateOrValue === "function" ? updateOrValue(prev) : updateOrValue;

      newValue.pageIndex = Math.max(newValue.pageIndex, 1);
      return newValue;
    });
  };

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  // Reset pagination when filters/sorting/globalFilter change
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 1,
    }));
  }, [sorting, filters, globalFilter]);

  // const actualFetcher = normalizeToPromiseFunction(fetcher);
  // const searchParams = useSearchParams()
  // const sort = searchParams.get('sorting')
  // const pathName = `${usePathname()}?page=${pagination.pageIndex}&limit=${pagination.pageSize}`;
  // const { data, isLoading, error } = useSWR('???', () => actualFetcher(sorting, filters, pagination))
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const actualFetcher = normalizeToPromiseFunction(fetcher);
      const data = await actualFetcher(sorting, filters, globalFilter, pagination);
      setData(data);
      setIsLoading(false);
    } catch (e) {
      console.error(`Error: ${String(e)}`);
      setError(`Error: ${String(e)}`);
      setIsLoading(false);
    }
  }, [sorting, filters, globalFilter, pagination, fetcher]);

  useEffect(() => {
    fetchData()
    // const fetch = async () => {
    //   try {
    //     setIsLoading(true);
    //     const actualFetcher = normalizeToPromiseFunction(fetcher);
    //     const data = await actualFetcher(sorting, filters, globalFilter, pagination);
    //     setData(data);
    //     setIsLoading(false);
    //   } catch (e) {
    //     console.log(`Error: ${String(e)}`)
    //     setError(`Error: ${String(e)}`);
    //     setIsLoading(false)
    //   }
    // };
    //
    // fetch();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, fetcher]);



  return (
    <div className="flex h-full max-w-full p-4 rounded-lg bg-background">
      <DataTable
        columns={columns}
        onRowClick={onRowClick}
        onCreate={onCreate}
        columnVisibility={columnVisibility}

        data={data}
        isLoading={isLoading}
        error={error}
        sortingState={{
          sorting,
          setSorting,
        }}
        filterState={{
          filter: filters,
          setFilter: setFilters,
        }}
        globalFilterState={{
          globalFilter,
          setGlobalFilter,
        }}
        paginationState={{
          pagination,
          setPagination,
        }}
      />
    </div>
  );
}

function normalizeToPromiseFunction<T>(input: TableFetcherType<T>): Fetcher<T> {
  if (typeof input === "function") {
    return input;
  } else {
    return () => input;
  }
}

export default DashboardTable;
