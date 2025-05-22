import { useState } from "react";
import TemplateForm from "@/components/admin/TemplateForm";
import TemplateTable from "@/components/admin/TemplateTable";

export default function TemplatesTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Reset form when done
  const handleFormSuccess = () => {
    setIsEditing(false);
    setSelectedTemplate(null);
  };
  
  // Handle edit
  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? "Edit Template" : "Create Template"}
        </h3>
        
        <TemplateForm 
          onSuccess={handleFormSuccess}
          initialData={selectedTemplate}
          isEdit={isEditing}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Templates List</h3>
        
        <TemplateTable onEdit={handleEditTemplate} />
      </div>
    </div>
  );
}
