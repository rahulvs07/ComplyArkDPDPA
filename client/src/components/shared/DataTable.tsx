import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  searchable?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
}

export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  pagination = true,
  itemsPerPage = 5
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  
  // Filter data based on search query
  const filteredData = searchQuery
    ? data.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data;
  
  // Calculate pagination
  const totalPages = pagination ? Math.ceil(filteredData.length / itemsPerPage) : 1;
  const paginatedData = pagination 
    ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredData;
  
  const handleDeleteClick = (row: any) => {
    setItemToDelete(row);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (itemToDelete && onDelete) {
      onDelete(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  return (
    <div>
      {searchable && (
        <div className="flex justify-between mb-4">
          <div className="relative max-w-sm">
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-icons absolute left-3 top-2 text-neutral-400 text-sm">
              search
            </span>
          </div>
        </div>
      )}
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50">
              {columns.map((column) => (
                <TableHead key={column.key} className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {column.header}
                </TableHead>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableHead className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-neutral-50">
                  {columns.map((column) => (
                    <TableCell key={`${rowIndex}-${column.key}`} className="py-4">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <TableCell className="py-4">
                      <div className="flex space-x-2">
                        {onView && (
                          <button 
                            onClick={() => onView(row)}
                            className="p-1 rounded text-primary-500 hover:bg-primary-50"
                          >
                            <span className="material-icons text-sm">visibility</span>
                          </button>
                        )}
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(row)}
                            className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                          >
                            <span className="material-icons text-sm">edit</span>
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => handleDeleteClick(row)}
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                          >
                            <span className="material-icons text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)} 
                  className="py-4 text-center text-neutral-500"
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredData.length)}
              </span>{" "}
              of <span className="font-medium">{filteredData.length}</span> results
            </p>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show pages around current page
                let pageToShow: number;
                if (totalPages <= 5) {
                  pageToShow = i + 1;
                } else if (currentPage <= 3) {
                  pageToShow = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageToShow = totalPages - 4 + i;
                } else {
                  pageToShow = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageToShow}>
                    <Button
                      variant={pageToShow === currentPage ? "outline" : "ghost"}
                      className={pageToShow === currentPage ? "bg-primary-50 text-primary-500" : ""}
                      onClick={() => setCurrentPage(pageToShow)}
                    >
                      {pageToShow}
                    </Button>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      <DeleteConfirmationDialog 
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
