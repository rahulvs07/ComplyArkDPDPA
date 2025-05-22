import { useState } from "react";
import IndustryForm from "@/components/admin/IndustryForm";
import IndustryTable from "@/components/admin/IndustryTable";

export default function IndustriesTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<any>(null);
  
  // Reset form when done
  const handleFormSuccess = () => {
    setIsEditing(false);
    setSelectedIndustry(null);
  };
  
  // Handle edit
  const handleEditIndustry = (industry: any) => {
    setSelectedIndustry(industry);
    setIsEditing(true);
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? "Edit Industry" : "Create Industry"}
        </h3>
        
        <IndustryForm 
          onSuccess={handleFormSuccess}
          initialData={selectedIndustry}
          isEdit={isEditing}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Industries List</h3>
        
        <IndustryTable onEdit={handleEditIndustry} />
      </div>
    </div>
  );
}
