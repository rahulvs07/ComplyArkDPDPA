import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DataTable from "../shared/DataTable";
import DeleteConfirmationDialog from "../shared/DeleteConfirmationDialog";

interface OrganizationTableProps {
  onEdit: (organization: any) => void;
}

export default function OrganizationTable({ onEdit }: OrganizationTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<any | null>(null);
  
  // Fetch organizations
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["/api/organizations"],
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/organizations/${id}`, {}),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete organization: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteClick = (organization: any) => {
    setOrganizationToDelete(organization);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (organizationToDelete) {
      deleteMutation.mutate(organizationToDelete.id);
    }
    setIsDeleteDialogOpen(false);
  };
  
  const columns = [
    { key: "id", header: "ID" },
    { key: "businessName", header: "Business Name" },
    { 
      key: "industryName", 
      header: "Industry",
    },
    { key: "contactPersonName", header: "Contact Person" },
    { key: "contactEmail", header: "Email" },
    { key: "contactPhone", header: "Phone" },
    { key: "noOfUsers", header: "Users" },
  ];
  
  return (
    <>
      <DataTable
        columns={columns}
        data={organizations}
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
        title="Delete Organization"
        description="Are you sure you want to delete this organization? This action cannot be undone and will remove all associated users and data."
      />
    </>
  );
}
