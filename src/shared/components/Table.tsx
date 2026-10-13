import React from 'react';
import { cn } from '@/shared/utils';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="w-full overflow-auto">
        <table
          ref={ref}
          className={cn('w-full border-collapse text-left', className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => {
  return (
    <thead ref={ref} className={cn('bg-gray-50', className)} {...props}>
      {children}
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => {
  return (
    <tbody ref={ref} className={cn('divide-y divide-gray-200', className)} {...props}>
      {children}
    </tbody>
  );
});

TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }
>(({ className, selected, children, ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={cn(
        'transition-colors hover:bg-gray-50',
        selected && 'bg-green-50 hover:bg-green-100',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & { sortable?: boolean; sortDirection?: 'asc' | 'desc' | null }
>(({ className, sortable, sortDirection, children, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={cn(
        'px-4 py-3 text-sm font-semibold text-gray-600 whitespace-nowrap',
        sortable && 'cursor-pointer select-none hover:text-gray-900',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <span className="text-gray-400">
            {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </div>
    </th>
  );
});

TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => {
  return (
    <td
      ref={ref}
      className={cn('px-4 py-3 text-base text-gray-900 align-middle', className)}
      {...props}
    >
      {children}
    </td>
  );
});

TableCell.displayName = 'TableCell';
