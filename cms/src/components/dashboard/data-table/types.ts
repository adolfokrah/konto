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

export type DataTableColumnMeta = {
  filter?: ColumnFilterConfig
  filterLabel?: string
  headerClassName?: string
  cellClassName?: string
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
}
