import React from 'react';
import { Button } from '@/components/ui/button';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

type Column = {
  key: string;
  header: string;
  render?: (value: any) => React.ReactNode;
};

interface DataTableProps {
  columns: Column[];
  data: any[];
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onView,
  onEdit,
  onDelete
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState<any>(null);

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

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            {columns.map((column) => (
              <th 
                key={column.key} 
                className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {(onView || onEdit || onDelete) && (
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`border-b border-neutral-200 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-neutral-800">
                    {column.render ? column.render(row[column.key]) : row[column.key]}
                  </td>
                ))}
                {(onView || onEdit || onDelete) && (
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end space-x-2">
                      {onView && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onView(row)}
                          className="text-primary-500 hover:text-primary-600 hover:bg-primary-50"
                        >
                          <span className="material-icons text-sm">visibility</span>
                        </Button>
                      )}
                      {onEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEdit(row)}
                          className="text-warning-500 hover:text-warning-600 hover:bg-warning-50"
                        >
                          <span className="material-icons text-sm">edit</span>
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(row)}
                          className="text-error-500 hover:text-error-600 hover:bg-error-50"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td 
                colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)} 
                className="px-4 py-6 text-sm text-center text-neutral-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

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