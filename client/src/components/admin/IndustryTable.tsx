import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DataTable from "../shared/DataTable";
import DeleteConfirmationDialog from "../shared/DeleteConfirmationDialog";

interface IndustryTableProps {
  onEdit: (industry: any) => void;
}

export default function IndustryTable({ onEdit }: IndustryTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [industryToDelete, setIndustryToDelete] = useState<any | null>(null);
  
  // Fetch industries
  const { data: industries = [], isLoading } = useQuery({
    queryKey: ["/api/industries"],
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/industries/${id}`, {}),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Industry deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/industries"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete industry: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteClick = (industry: any) => {
    setIndustryToDelete(industry);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (industryToDelete) {
      deleteMutation.mutate(industryToDelete.industryId);
    }
    setIsDeleteDialogOpen(false);
  };
  
  const columns = [
    { key: "industryId", header: "ID" },
    { key: "industryName", header: "Industry Name" },
    { 
      key: "organizationCount", 
      header: "Organizations",
      render: (value: number) => value || 0
    },
  ];
  
  return (
    <>
      <DataTable
        columns={columns}
        data={industries}
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
        title="Delete Industry"
        description="Are you sure you want to delete this industry? This may affect organizations that are using this industry."
      />
    </>
  );
}
