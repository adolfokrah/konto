'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type ColumnSizingState,
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

function getStorageKey(tableId: string) {
  return `dt-col-sizes:${tableId}`
}

function loadColumnSizing(tableId?: string): ColumnSizingState {
  if (!tableId) return {}
  try {
    const raw = localStorage.getItem(getStorageKey(tableId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function DataTable<TData>({
  columns,
  data,
  pagination,
  readOnly = false,
  onRowClick,
  renderRowActions,
  renderExpandedRow,
  emptyMessage = 'No results found',
  scrollOffset,
  tableId,
}: DataTableProps<TData>) {
  const { updateParam, batchUpdateParams, toggleParam, getParam, clearAll, activeFilters, sortBy, sortOrder, updateSort } = useTableFilters(columns)
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // Load persisted sizes after mount to avoid SSR/hydration mismatch
  useEffect(() => {
    const saved = loadColumnSizing(tableId)
    if (Object.keys(saved).length > 0) setColumnSizing(saved)
  }, [tableId])

  const handleColumnSizingChange = useCallback(
    (updater: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState)) => {
      setColumnSizing((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        if (tableId) {
          try {
            localStorage.setItem(getStorageKey(tableId), JSON.stringify(next))
          } catch { /* ignore quota errors */ }
        }
        return next
      })
    },
    [tableId],
  )

  const rowOffset = pagination ? (pagination.currentPage - 1) * pagination.rowsPerPage : 0

  const numberColumn: ColumnDef<TData, any> = {
    id: '_number',
    header: '#',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{rowOffset + row.index + 1}</span>
    ),
    size: 50,
    enableResizing: false,
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
            size: 50,
            enableResizing: false,
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
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    onColumnSizingChange: handleColumnSizingChange,
    state: {
      columnSizing,
    },
  })

  const totalColumns = allColumns.length

  return (
    <>
      {!readOnly && (
        <DataTableActiveFilters
          filters={activeFilters}
          onRemove={(paramKey, extraParamKeys) => {
            const updates = [{ key: paramKey, value: '' }]
            extraParamKeys?.forEach((key) => updates.push({ key, value: '' }))
            batchUpdateParams(updates)
          }}
          onClearAll={clearAll}
        />
      )}

      <Table scrollOffset={scrollOffset} className="table-fixed">
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
                  batchUpdateParams={batchUpdateParams}
                  toggleParam={toggleParam}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  updateSort={updateSort}
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
            table.getRowModel().rows.map((row) => {
              const isExpanded = expandedRowId === row.id
              const handleClick = renderExpandedRow
                ? () => setExpandedRowId(isExpanded ? null : row.id)
                : !readOnly && onRowClick
                  ? () => onRowClick(row.original)
                  : undefined
              return (
                <React.Fragment key={row.id}>
                  <TableRow
                    className={cn('group', (!readOnly && onRowClick || renderExpandedRow) && 'cursor-pointer')}
                    data-expanded={isExpanded || undefined}
                    onClick={handleClick}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const cellMeta = cell.column.columnDef.meta as DataTableColumnMeta | undefined
                      return (
                        <TableCell
                          key={cell.id}
                          className={cellMeta?.cellClassName}
                          style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize(), overflow: 'hidden' }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                  {renderExpandedRow && isExpanded && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={totalColumns} className="p-0">
                        {renderExpandedRow(row.original)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })
          )}
        </TableBody>
      </Table>

      {!readOnly && pagination && (
        <DataTablePagination {...pagination} />
      )}
    </>
  )
}
