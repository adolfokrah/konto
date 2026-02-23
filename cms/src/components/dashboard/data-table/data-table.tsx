'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/utilities/ui'
import { DataTableFilterHeader } from './data-table-filter-header'
import { DataTableActiveFilters } from './data-table-active-filters'
import { DataTablePagination } from './data-table-pagination'
import { useTableFilters } from './use-table-filters'
import { type DataTableProps, type DataTableColumnMeta } from './types'

export function DataTable<TData>({
  columns,
  data,
  pagination,
  readOnly = false,
  onRowClick,
  renderRowActions,
  emptyMessage = 'No results found',
}: DataTableProps<TData>) {
  const { updateParam, toggleParam, getParam, clearAll, activeFilters } = useTableFilters(columns)

  const rowOffset = pagination ? (pagination.currentPage - 1) * pagination.rowsPerPage : 0

  const numberColumn: ColumnDef<TData, any> = {
    id: '_number',
    header: '#',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{rowOffset + row.index + 1}</span>
    ),
    meta: { headerClassName: 'w-[50px]', cellClassName: 'w-[50px]' } satisfies DataTableColumnMeta,
  }

  const allColumns: ColumnDef<TData, any>[] = [
    numberColumn,
    ...columns,
    ...(renderRowActions
      ? [
          {
            id: '_actions',
            header: '',
            cell: ({ row }: { row: any }) => renderRowActions(row.original),
            meta: { headerClassName: 'w-[50px]' } satisfies DataTableColumnMeta,
          } as ColumnDef<TData, any>,
        ]
      : []),
  ]

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
  })

  const totalColumns = allColumns.length

  return (
    <>
      {!readOnly && (
        <DataTableActiveFilters
          filters={activeFilters}
          onRemove={(paramKey) => updateParam(paramKey, '')}
          onClearAll={clearAll}
        />
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <DataTableFilterHeader
                  key={header.id}
                  header={header}
                  readOnly={readOnly}
                  getParam={getParam}
                  updateParam={updateParam}
                  toggleParam={toggleParam}
                />
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={totalColumns} className="h-32 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(!readOnly && onRowClick && 'cursor-pointer')}
                onClick={!readOnly && onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => {
                  const cellMeta = cell.column.columnDef.meta as DataTableColumnMeta | undefined
                  return (
                    <TableCell key={cell.id} className={cellMeta?.cellClassName}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!readOnly && pagination && (
        <DataTablePagination {...pagination} />
      )}
    </>
  )
}
