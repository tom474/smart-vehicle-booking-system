/**
 * Aggregates common URL parameters for API requests:
 * - Pagination (`page`, `limit`)
 * - Sorting (`orderField`, `orderDirection`)
 * - Search (`searchField`, `searchValue`)
 */
export interface UrlCommonParams extends ParamPagination, ParamSortable, ParamSearchable { }

/**
 * Represents pagination parameters for API requests.
 * @property {number} page - The current page number (usually 1-based index).
 * @property {number} limit - Maximum number of items per page.
 */
export interface ParamPagination {
  page?: number
  limit?: number
}

/**
 * Defines sorting parameters for API requests.
 * @property {string} orderField - The field to sort by (e.g., "createdAt", "name").
 * @property {'ASC' | 'DESC'} orderDirection - Sort direction (ascending or descending).
 */
export interface ParamSortable {
  orderField?: string
  orderDirection?: string
  // orderDirection?: 'ASC' | 'DESC'
}

/**
 * Configures search/filtering parameters for API requests.
 * @property {string} searchField - The field to search within (e.g., "email", "username").
 * @property {string} searchValue - The value to match against the field.
 */
export interface ParamSearchable {
  searchField?: string
  searchValue?: string
}
