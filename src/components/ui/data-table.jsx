'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DENSITY_ROW_HEIGHT = {
  staff: 'var(--table-row-staff, 2.5rem)',
  student: 'var(--table-row-student, 3.5rem)',
};

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  const numA = typeof a === 'number' ? a : Number(a);
  const numB = typeof b === 'number' ? b : Number(b);
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && String(a).trim() !== '' && String(b).trim() !== '') {
    return numA - numB;
  }
  return String(a).localeCompare(String(b), 'id');
}

/**
 * DataTable: tabel dengan pengurutan, caption, dan versi daftar di ponsel.
 * Kolom: { key, header, render?, align?, sortValue?, sortable?, className?, mobileHidden? }
 */
export function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  caption,
  density = 'staff',
  loading = false,
  loadingRows = 5,
  empty = null,
  onRowClick,
  initialSort = null,
  className,
  rowClassName,
}) {
  const [sort, setSort] = React.useState(initialSort);

  const getRowKey = React.useCallback(
    (row, index) => {
      if (typeof rowKey === 'function') return rowKey(row, index);
      return row?.[rowKey] ?? index;
    },
    [rowKey]
  );

  const sortedRows = React.useMemo(() => {
    if (!sort?.key) return rows;
    const column = columns.find((col) => col.key === sort.key);
    if (!column || column.sortable === false) return rows;

    const pick = (row) =>
      column.sortValue ? column.sortValue(row) : row?.[column.key];

    return [...rows].sort((a, b) => {
      const result = compareValues(pick(a), pick(b));
      return sort.direction === 'desc' ? -result : result;
    });
  }, [rows, sort, columns]);

  const toggleSort = (column) => {
    if (column.sortable === false) return;
    setSort((current) => {
      if (current?.key !== column.key) return { key: column.key, direction: 'asc' };
      if (current.direction === 'asc') return { key: column.key, direction: 'desc' };
      return null;
    });
  };

  const rowHeight = DENSITY_ROW_HEIGHT[density] ?? DENSITY_ROW_HEIGHT.staff;
  const columnCount = Math.max(columns.length, 1);
  const showEmpty = !loading && sortedRows.length === 0;

  return (
    <Table
      stackOnMobile
      density={density === 'student' ? 'comfortable' : 'compact'}
      className={cn('border-separate border-spacing-0', className)}
    >
      {caption && <TableCaption className="sr-only">{caption}</TableCaption>}
      <TableHeader>
        <TableRow className="hover:bg-transparent" style={{ height: 'var(--table-header-height, 2.5rem)' }}>
          {columns.map((column) => {
            const isSorted = sort?.key === column.key;
            const sortable = column.sortable !== false;
            return (
              <TableHead
                key={column.key}
                scope="col"
                aria-sort={
                  isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                }
                style={{ width: column.width }}
                className={cn(
                  'h-[var(--table-header-height,2.5rem)] px-[var(--table-cell-padding-x,12px)] text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]',
                  column.align === 'right' && 'text-right',
                  column.align === 'center' && 'text-center',
                  column.mobileHidden && 'hidden sm:table-cell',
                  column.className
                )}
              >
                {sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(column)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md text-left uppercase tracking-[0.04em] transition-colors hover:text-[var(--text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                      column.align === 'right' && 'justify-end'
                    )}
                  >
                    {column.header}
                    {isSorted ? (
                      sort.direction === 'asc' ? (
                        <ArrowUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="h-3 w-3" aria-hidden="true" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 opacity-40" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          Array.from({ length: loadingRows }).map((_, rowIndex) => (
            <TableRow key={`skeleton-${rowIndex}`} style={{ height: rowHeight }}>
              {columns.map((column) => (
                <TableCell
                  key={`skeleton-${rowIndex}-${column.key}`}
                  className="px-[var(--table-cell-padding-x,12px)]"
                >
                  <div className="h-3 w-full max-w-[140px] animate-pulse rounded bg-[var(--surface-sunken)]" />
                </TableCell>
              ))}
            </TableRow>
          ))}

        {showEmpty && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columnCount} className="p-0">
              {empty}
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          sortedRows.map((row, index) => (
            <TableRow
              key={getRowKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                onRowClick && 'cursor-pointer',
                rowClassName
              )}
              style={{ height: rowHeight }}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  data-label={column.header}
                  className={cn(
                    'px-[var(--table-cell-padding-x,12px)] align-middle text-[13px] text-[var(--text-body)]',
                    column.align === 'right' && 'text-right tabular-nums',
                    column.align === 'center' && 'text-center',
                    column.mobileHidden && 'hidden sm:table-cell',
                    column.className
                  )}
                >
                  {column.render ? column.render(row) : row?.[column.key] ?? '-'}
                </TableCell>
              ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}

export default DataTable;
