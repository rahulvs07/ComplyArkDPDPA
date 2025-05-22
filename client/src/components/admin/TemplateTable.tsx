import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DataTable from "../shared/DataTable";
import DeleteConfirmationDialog from "../shared/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";

interface TemplateTableProps {
  onEdit: (template: any) => void;
}

export default function TemplateTable({ onEdit }: TemplateTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any | null>(null);
  
  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates"],
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/templates/${id}`, {}),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteClick = (template: any) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.templateId);
    }
    setIsDeleteDialogOpen(false);
  };
  
  const handleDownload = (template: any) => {
    if (template.templatePath) {
      window.open(`/api/templates/${template.templateId}/download`, '_blank');
    } else {
      toast({
        title: "Error",
        description: "No file available for download",
        variant: "destructive",
      });
    }
  };
  
  const columns = [
    { key: "templateId", header: "ID" },
    { key: "templateName", header: "Template Name" },
    { key: "industryName", header: "Industry" },
    { 
      key: "hasFile", 
      header: "File",
      render: (value: boolean, row: any) => (
        <div>
          {value ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(row);
              }}
              className="flex items-center"
            >
              <span className="material-icons text-sm mr-1">download</span>
              Download
            </Button>
          ) : (
            <span className="text-neutral-500 text-sm">No file</span>
          )}
        </div>
      )
    },
  ];
  
  return (
    <>
      <DataTable
        columns={columns}
        data={templates}
        onEdit={onEdit}
        onDelete={handleDeleteClick}
        searchable={true}
        pagination={true}
        itemsPerPage={5}
      />
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
      />
    </>
  );
}
