import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

type Column = {
  key?: string;
  accessorKey?: string;
  id?: string;
  header: string;
  render?: (value: any, row?: any) => React.ReactNode;
  cell?: ({ row }: { row: any }) => React.ReactNode;
  filterable?: boolean;
  sortable?: boolean;
};

interface DataTableProps {
  columns: Column[];
  data: any[];
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  searchable?: boolean;
  pagination?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  searchPlaceholder?: string;
  onRowClick?: (row: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  searchable = false,
  pagination = false,
  rowsPerPageOptions = [10, 25, 50, 100],
  defaultRowsPerPage = 10,
  searchPlaceholder = "Search...",
  onRowClick
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  const handleDelete = (row: any) => {
    setSelectedRow(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (onDelete && selectedRow) {
      onDelete(selectedRow);
    }
    setDeleteDialogOpen(false);
  };
  
  // Handle sorting
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Apply sorting
  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const column = columns.find(col => (col.key || col.accessorKey || col.id) === sortConfig.key);
        const key = column?.key || column?.accessorKey || column?.id || sortConfig.key;
        
        if (a[key] === null || a[key] === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (b[key] === null || b[key] === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        
        if (a[key] < b[key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);
  
  // Search functionality
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return sortedData;
    
    return sortedData.filter(row => {
      return columns.some(column => {
        const columnKey = column.key || column.accessorKey || column.id;
        if (!columnKey) return false;
        const value = row[columnKey];
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [sortedData, searchTerm, columns]);
  
  // Pagination
  const paginatedData = React.useMemo(() => {
    if (!pagination) return filteredData;
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, pagination, currentPage, rowsPerPage]);
  
  // Get page count
  const pageCount = Math.ceil(filteredData.length / rowsPerPage);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle row click
  const handleRowClick = (row: any) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };
  
  return (
    <div className="w-full space-y-4">
      {/* Search and page size controls */}
      {(searchable || pagination) && (
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          {searchable && (
            <div className="flex-1">
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
          )}
          {pagination && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600">Rows per page:</span>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-16">
                  <SelectValue>{rowsPerPage}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {rowsPerPageOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
      
      {/* Table */}
      <div className="w-full overflow-x-auto border rounded-md">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              {columns.map((column, colIndex) => (
                <th 
                  key={column.key || column.accessorKey || column.id || `col-${colIndex}`} 
                  className={`px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-neutral-100' : ''}`}
                  onClick={() => column.sortable && requestSort(column.key || column.accessorKey || column.id || '')}
                >
                  <div className="flex items-center">
                    {column.header}
                    {sortConfig && sortConfig.key === (column.key || column.accessorKey || column.id) && (
                      <span className="material-icons text-xs ml-1">
                        {sortConfig.direction === 'ascending' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onView || onDelete) && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData && paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`border-b border-neutral-200 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} ${onRowClick ? 'cursor-pointer hover:bg-neutral-100' : ''}`}
                  onClick={() => handleRowClick(row)}
                >
                  {columns.map((column, cellIndex) => (
                    <td key={`${rowIndex}-${column.key || column.accessorKey || column.id || cellIndex}`} className="px-4 py-3 text-sm text-neutral-800">
                      {column.cell ? 
                        column.cell({ row: { getValue: (key: string) => row[key], original: row } }) : 
                        (column.render ? 
                          column.render(row[column.key || column.accessorKey || column.id || ''], row) : 
                          (row[column.key || column.accessorKey || column.id || ''] !== undefined ? 
                            row[column.key || column.accessorKey || column.id || ''] : 'N/A'))}
                    </td>
                  ))}
                  {(onEdit || onView || onDelete) && (
                    <td className="px-4 py-3 text-sm text-right space-x-2 whitespace-nowrap">
                      {onView && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(row);
                          }}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700 border-blue-600 hover:border-blue-700 hover:bg-blue-50"
                        >
                          <span className="material-icons text-sm">visibility</span>
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row);
                          }}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700 border-blue-600 hover:border-blue-700 hover:bg-blue-50 ml-2"
                        >
                          <span className="material-icons text-sm">edit</span>
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row);
                          }}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700 hover:bg-red-50 ml-2"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-4 py-6 text-sm text-center text-neutral-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
      
      {/* Pagination */}
      {pagination && pageCount > 1 && (
        <div className="flex justify-between items-center p-4">
          <div className="text-sm text-neutral-600">
            Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredData.length)} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="material-icons text-sm">first_page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="material-icons text-sm">chevron_left</span>
            </Button>
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              // Show pages around current page
              let pageNum = 1;
              if (pageCount <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pageCount - 2) {
                pageNum = pageCount - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pageCount}
            >
              <span className="material-icons text-sm">chevron_right</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pageCount)}
              disabled={currentPage === pageCount}
            >
              <span className="material-icons text-sm">last_page</span>
            </Button>
          </div>
        </div>
      )}
      
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
      />
    </div>
  );
};

export default DataTable;