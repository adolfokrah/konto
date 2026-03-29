'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type ColumnSizingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
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
  bulkActions,
  getRowId,
  tableMeta,
  fillParent,
}: DataTableProps<TData>) {
  const { updateParam, batchUpdateParams, toggleParam, getParam, clearAll, activeFilters, sortBy, sortOrder, updateSort } = useTableFilters(columns)
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const resolveRowId = useCallback(
    (row: TData): string => (getRowId ? getRowId(row) : (row as any).id ?? ''),
    [getRowId],
  )

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

  const checkboxColumn: ColumnDef<TData, any> = {
    id: '_select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
    size: 40,
    enableResizing: false,
    meta: { headerClassName: 'w-[40px]', cellClassName: 'w-[40px]' } satisfies DataTableColumnMeta,
  }

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
    ...(bulkActions ? [checkboxColumn] : []),
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
    enableRowSelection: !!bulkActions,
    onColumnSizingChange: handleColumnSizingChange,
    onRowSelectionChange: setRowSelection,
    getRowId: (row, index) => resolveRowId(row) || String(index),
    meta: tableMeta,
    state: {
      columnSizing,
      rowSelection,
    },
  })

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)
  const selectedCount = selectedRows.length
  const totalColumns = allColumns.length

  const inner = (
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

      {/* Bulk action toolbar */}
      {bulkActions && selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 mb-2">
          <Badge variant="secondary" className="rounded-sm tabular-nums">
            {selectedCount}
          </Badge>
          <span className="text-sm text-muted-foreground">
            row{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {bulkActions.map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                className={cn('h-7 gap-1.5 text-xs', action.className)}
                onClick={() => action.onClick(selectedRows, () => setRowSelection({}))}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setRowSelection({})}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <Table scrollOffset={fillParent ? undefined : scrollOffset} className="table-fixed">
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
                    className={cn(
                      'group',
                      (!readOnly && onRowClick || renderExpandedRow) && 'cursor-pointer',
                      row.getIsSelected() && 'bg-muted/40',
                    )}
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

  if (fillParent) {
    return <div className="flex flex-col h-full min-h-0">{inner}</div>
  }

  return inner
}
