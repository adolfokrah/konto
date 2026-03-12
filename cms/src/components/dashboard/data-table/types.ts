import { type ColumnDef } from '@tanstack/react-table'

export type FilterOption = {
  label: string
  value: string
}

export type ColumnFilterConfig =
  | {
      type: 'search'
      paramKey: string
      placeholder?: string
      popoverWidth?: string
    }
  | {
      type: 'select'
      paramKey: string
      options: FilterOption[]
      popoverWidth?: string
      displayMap?: Record<string, string>
    }
  | {
      type: 'dateRange'
      fromParamKey: string
      toParamKey: string
      popoverWidth?: string
    }

export type DataTableColumnMeta = {
  filter?: ColumnFilterConfig
  filterLabel?: string
  headerClassName?: string
  cellClassName?: string
  size?: number
  minSize?: number
  maxSize?: number
  /** Payload field name for server-side sorting. If set, the column header becomes sortable. */
  sortKey?: string
}

export type PaginationProps = {
  currentPage: number
  totalPages: number
  totalRows: number
  rowsPerPage: number
}

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  pagination?: PaginationProps
  readOnly?: boolean
  onRowClick?: (row: TData) => void
  renderRowActions?: (row: TData) => React.ReactNode
  emptyMessage?: string
  /** Viewport offset for scrollable table height, e.g. "20rem" or "32rem" */
  scrollOffset?: string
  /** Stable ID for persisting column sizes to localStorage */
  tableId?: string
}
