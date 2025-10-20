import { GlobalFilterState } from "@/components/dashboard-table/search/table-search";
import { UrlCommonParams } from "@/types/api-params";
import { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";

/**
 * Converts an object of query params into a URLSearchParams object,
 * skipping undefined/null values and converting non-strings to strings.
 */
export function buildQueryParams<T extends Record<string, string | number>>(params: T): URLSearchParams {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      queryParams.append(key, String(value));
    }
  });
  return queryParams;
}

/**
 * Map a SortingState, ColumnFiltersState, GlobalFilterState and PaginationState to the UrlCommonParams
 */
export function mapParam<T, P extends UrlCommonParams = UrlCommonParams>(
  fn: (params: P) => Promise<T>,
  additionalParams?: Omit<P, keyof UrlCommonParams>
): (s: SortingState, f: ColumnFiltersState, gF: GlobalFilterState, p: PaginationState) => Promise<T> {


  return (s, f, gF, p) => {
    // console.log("DEBUGGING: ", s, f, gF, p)

    const filterParams = f.reduce<Record<string, string>>((acc, item) => {
      if (item.value != null && item.value !== "") {
        acc[item.id] = String(item.value);
      }
      return acc;
    }, {});

    return fn({
      ...filterParams,
      searchField: gF.id,
      searchValue: gF.value,
      orderField: s.map((item) => item.id).join(","),
      orderDirection: s.map((item) => (item.desc ? "DESC" : "ASC")).join(","),
      page: p.pageIndex,
      limit: p.pageSize,
      ...additionalParams
    } as P);
  }
}
