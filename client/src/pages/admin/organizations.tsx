import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import OrganizationForm from "@/components/admin/OrganizationForm";
import OrganizationTable from "@/components/admin/OrganizationTable";

export default function OrganizationsTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  
  // Reset form when done
  const handleFormSuccess = () => {
    setIsEditing(false);
    setSelectedOrganization(null);
  };
  
  // Handle edit
  const handleEditOrganization = (organization: any) => {
    setSelectedOrganization(organization);
    setIsEditing(true);
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? "Edit Organization" : "Create Organization"}
        </h3>
        
        <OrganizationForm 
          onSuccess={handleFormSuccess}
          initialData={selectedOrganization}
          isEdit={isEditing}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Organizations List</h3>
        
        <OrganizationTable onEdit={handleEditOrganization} />
      </div>
    </div>
  );
}
