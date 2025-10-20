import { FilterConfig } from "./components/dashboard-table/filter/table-filter";
import { SearchConfig } from "./components/dashboard-table/search/table-search";
import locales from "./locales/en.json";
import "@tanstack/react-table";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof locales;
  }
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    isSearchable?: boolean | SearchConfig
    isSortable?: boolean
    // filter?: FilterMeta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter?: any
    filterConfig?: FilterConfig
  }
}
