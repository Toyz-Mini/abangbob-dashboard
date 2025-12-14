'use client';

import { useState, useMemo, useCallback, ReactNode } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface Column<T> {
  id: string;
  header: ReactNode;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  width?: string | number;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  searchable?: boolean;
  searchPlaceholder?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: ReactNode;
  loading?: boolean;
  actions?: ReactNode;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  searchable = true,
  searchPlaceholder = 'Search...',
  selectable = false,
  onSelectionChange,
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  emptyMessage = 'No data available',
  loading = false,
  actions,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Get cell value
  const getCellValue = useCallback((row: T, column: Column<T>): ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as ReactNode;
  }, []);

  // Get raw value for sorting/searching
  const getRawValue = useCallback((row: T, column: Column<T>): string | number => {
    if (typeof column.accessor === 'function') {
      const value = column.accessor(row);
      return typeof value === 'string' || typeof value === 'number' ? value : String(value);
    }
    const value = row[column.accessor];
    return typeof value === 'string' || typeof value === 'number' ? value : String(value);
  }, []);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(row => {
      return columns.some(column => {
        const value = getRawValue(row, column);
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, columns, getRawValue]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    const column = columns.find(c => c.id === sortColumn);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getRawValue(a, column);
      const bValue = getRawValue(b, column);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [filteredData, sortColumn, sortDirection, columns, getRawValue]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = useCallback((columnId: string) => {
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelected = new Set(paginatedData.map(row => String(row[keyField])));
      setSelectedRows(newSelected);
      onSelectionChange?.(paginatedData);
    }
  }, [selectedRows.size, paginatedData, keyField, onSelectionChange]);

  const handleSelectRow = useCallback((row: T) => {
    const rowKey = String(row[keyField]);
    const newSelected = new Set(selectedRows);
    
    if (newSelected.has(rowKey)) {
      newSelected.delete(rowKey);
    } else {
      newSelected.add(rowKey);
    }
    
    setSelectedRows(newSelected);
    onSelectionChange?.(data.filter(r => newSelected.has(String(r[keyField]))));
  }, [selectedRows, keyField, data, onSelectionChange]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Handle page size change
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const isAllSelected = paginatedData.length > 0 && selectedRows.size === paginatedData.length;

  return (
    <div className={`data-table-container ${className}`}>
      {/* Toolbar */}
      {(searchable || actions) && (
        <div className="data-table-toolbar">
          {searchable && (
            <div className="data-table-search">
              <Search size={16} className="data-table-search-icon" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          {actions && <div className="data-table-actions">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="data-table-checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.id}
                  className={`${column.sortable ? 'sortable' : ''} ${sortColumn === column.id ? 'sorted' : ''} ${column.className || ''}`}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {column.header}
                    {column.sortable && (
                      <span className="sort-icon">
                        {sortColumn === column.id ? (
                          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ChevronUp size={14} />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i}>
                  {selectable && <td><div className="skeleton" style={{ width: 18, height: 18 }} /></td>}
                  {columns.map(column => (
                    <td key={column.id}>
                      <div className="skeleton" style={{ width: '80%', height: 16 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map(row => {
                const rowKey = String(row[keyField]);
                const isSelected = selectedRows.has(rowKey);
                
                return (
                  <tr key={rowKey} className={isSelected ? 'selected' : ''}>
                    {selectable && (
                      <td>
                        <input
                          type="checkbox"
                          className="data-table-checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(row)}
                          aria-label={`Select row ${rowKey}`}
                        />
                      </td>
                    )}
                    {columns.map(column => (
                      <td key={column.id} className={column.className}>
                        {getCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && sortedData.length > 0 && (
        <div className="data-table-pagination">
          <div className="data-table-pagination-info">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
            </span>
            {selectable && selectedRows.size > 0 && (
              <span style={{ marginLeft: '1rem', color: 'var(--primary)' }}>
                ({selectedRows.size} selected)
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              className="form-select"
              style={{ width: 'auto', padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>

            <div className="data-table-pagination-controls">
              <button
                className="data-table-page-btn"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                aria-label="First page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                className="data-table-page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`data-table-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="data-table-page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="data-table-page-btn"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




