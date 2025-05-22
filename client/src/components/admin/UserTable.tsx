import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DataTable from "../shared/DataTable";
import DeleteConfirmationDialog from "../shared/DeleteConfirmationDialog";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

interface UserTableProps {
  onEdit: (user: any) => void;
  organizationId?: number;
}

export default function UserTable({ onEdit, organizationId }: UserTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: organizationId 
      ? [`/api/organizations/${organizationId}/users`]
      : ["/api/users"],
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`, {}),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ 
        queryKey: organizationId 
          ? [`/api/organizations/${organizationId}/users`]
          : ["/api/users"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteClick = (user: any) => {
    // Prevent deleting your own account
    if (user.id === currentUser?.id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }
    
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
    setIsDeleteDialogOpen(false);
  };
  
  const columns = [
    { key: "id", header: "ID" },
    { 
      key: "name", 
      header: "Name",
      render: (_: any, row: any) => `${row.firstName} ${row.lastName}`
    },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { 
      key: "role", 
      header: "Role",
      render: (value: string) => (
        <Badge variant={value === "admin" ? "default" : "secondary"}>
          {value === "admin" ? "Admin" : "User"}
        </Badge>
      )
    },
    { key: "organizationName", header: "Organization" },
    { 
      key: "isActive", 
      header: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "success" : "destructive"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      )
    },
  ];
  
  return (
    <>
      <DataTable
        columns={columns}
        data={users}
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
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
      />
    </>
  );
}
