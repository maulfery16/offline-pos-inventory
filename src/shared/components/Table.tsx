// Re-export shadcn table components with backward compatibility
export { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter,
  TableHead, 
  TableRow, 
  TableCell,
  TableCaption
} from './ui/table';

// Extended types for backward compatibility
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
}

// Note: For sortable columns and selected rows, apply these via className:
// - Selected row: add 'data-[state=selected]:bg-primary-soft' or custom selected class
// - Sortable: add interactive styling and sort indicators in your implementation
