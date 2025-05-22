import { useState } from "react";
import UserForm from "@/components/admin/UserForm";
import UserTable from "@/components/admin/UserTable";

export default function UsersTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Reset form when done
  const handleFormSuccess = () => {
    setIsEditing(false);
    setSelectedUser(null);
  };
  
  // Handle edit
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditing(true);
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? "Edit User" : "Create User"}
        </h3>
        
        <UserForm 
          onSuccess={handleFormSuccess}
          initialData={selectedUser}
          isEdit={isEditing}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Users List</h3>
        
        <UserTable onEdit={handleEditUser} />
      </div>
    </div>
  );
}
