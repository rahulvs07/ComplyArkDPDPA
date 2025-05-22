import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

interface DataField {
  id: string;
  label: string;
  reason: string;
  selected: boolean;
}

interface Category {
  id: string;
  name: string;
  fields: DataField[];
}

interface QuestionnaireTabProps {
  onNext: (data: any) => void;
}

export default function QuestionnaireTab({ onNext }: QuestionnaireTabProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "name",
      name: "Name",
      fields: [
        { id: "firstName", label: "First Name", reason: "To identify the individual correctly.", selected: false },
        { id: "middleName", label: "Middle Name", reason: "For full legal identification.", selected: false },
        { id: "lastName", label: "Last Name", reason: "To identify the individual correctly.", selected: false },
        { id: "preferredName", label: "Preferred Name / Nickname", reason: "For personalised communication.", selected: false },
        { id: "formerName", label: "Former Name(s)", reason: "For record-keeping and legal verification.", selected: false },
      ]
    },
    {
      id: "contactDetails",
      name: "Contact Details",
      fields: [
        { id: "residentialAddress", label: "Residential Address", reason: "For official correspondence and service delivery.", selected: false },
        { id: "mailingAddress", label: "Mailing Address", reason: "To send documents, communications, or parcels.", selected: false },
        { id: "countryOfResidence", label: "Country of Residence", reason: "For compliance with regional laws.", selected: false },
        { id: "postcode", label: "Postcode", reason: "For accurate address verification.", selected: false },
        { id: "emergencyContactInfo", label: "Emergency Contact Information", reason: "For emergencies or health & safety reasons.", selected: false },
      ]
    },
    {
      id: "financialInfo",
      name: "Financial Info",
      fields: [
        { id: "bankAccountNumber", label: "Bank Account Number", reason: "For salary or financial transactions.", selected: false },
        { id: "sortCode", label: "Sort Code", reason: "For banking and payment processing (UK-specific).", selected: false },
        { id: "cardDetails", label: "Credit/Debit Card Details", reason: "For billing and secure payments.", selected: false },
        { id: "billingAddress", label: "Billing Address", reason: "For issuing invoices and matching transactions.", selected: false },
        { id: "taxId", label: "Tax Identification Number", reason: "For tax reporting and statutory compliance.", selected: false },
      ]
    },
    {
      id: "healthData",
      name: "Health Data",
      fields: [
        { id: "medicalHistory", label: "Medical History", reason: "For providing appropriate care and accommodations.", selected: false },
        { id: "disabilityStatus", label: "Disability Status", reason: "To ensure accessibility and legal compliance.", selected: false },
        { id: "mentalHealthInfo", label: "Mental Health Information", reason: "To support employee well-being and workplace accommodations.", selected: false },
        { id: "immunizationRecords", label: "Immunisation Records", reason: "For workplace health compliance (e.g., COVID-19).", selected: false },
        { id: "prescriptionDetails", label: "Prescription Details", reason: "For health and medical records.", selected: false },
      ]
    },
    {
      id: "sensitiveData",
      name: "Sensitive Data",
      fields: [
        { id: "racialOrigin", label: "Racial or Ethnic Origin", reason: "For diversity compliance and monitoring.", selected: false },
        { id: "politicalOpinions", label: "Political Opinions", reason: "Only collected when required for transparency (e.g., political organisations).", selected: false },
        { id: "religiousBeliefs", label: "Religious or Philosophical Beliefs", reason: "For accommodation of practices (e.g., holidays, dietary needs).", selected: false },
        { id: "tradeUnionMembership", label: "Trade Union Membership", reason: "For collective bargaining and legal compliance.", selected: false },
        { id: "geneticData", label: "Genetic Data", reason: "For specific health or legal contexts (with consent).", selected: false },
      ]
    }
  ]);
  
  const [sharesWithThirdParties, setSharesWithThirdParties] = useState<string>("no");
  const [thirdParties, setThirdParties] = useState<{ id: string; name: string }[]>([
    { id: "1", name: "" }
  ]);
  const [sharingPurpose, setSharingPurpose] = useState("");
  
  // Handle field selection
  const handleFieldSelect = (categoryId: string, fieldId: string, checked: boolean) => {
    setCategories(prev => 
      prev.map(category => 
        category.id === categoryId
          ? {
              ...category,
              fields: category.fields.map(field => 
                field.id === fieldId
                  ? { ...field, selected: checked }
                  : field
              )
            }
          : category
      )
    );
  };
  
  // Handle reason change
  const handleReasonChange = (categoryId: string, fieldId: string, reason: string) => {
    setCategories(prev => 
      prev.map(category => 
        category.id === categoryId
          ? {
              ...category,
              fields: category.fields.map(field => 
                field.id === fieldId
                  ? { ...field, reason }
                  : field
              )
            }
          : category
      )
    );
  };
  
  // Add a new field to a category
  const addField = (categoryId: string) => {
    const newFieldId = `custom_${new Date().getTime()}`;
    setCategories(prev => 
      prev.map(category => 
        category.id === categoryId
          ? {
              ...category,
              fields: [
                ...category.fields,
                { id: newFieldId, label: "", reason: "", selected: true }
              ]
            }
          : category
      )
    );
  };
  
  // Update custom field label
  const updateFieldLabel = (categoryId: string, fieldId: string, label: string) => {
    setCategories(prev => 
      prev.map(category => 
        category.id === categoryId
          ? {
              ...category,
              fields: category.fields.map(field => 
                field.id === fieldId
                  ? { ...field, label }
                  : field
              )
            }
          : category
      )
    );
  };
  
  // Add a new third party
  const addThirdParty = () => {
    const newId = `tp_${new Date().getTime()}`;
    setThirdParties([...thirdParties, { id: newId, name: "" }]);
  };
  
  // Update third party name
  const updateThirdPartyName = (id: string, name: string) => {
    setThirdParties(prev => 
      prev.map(party => 
        party.id === id ? { ...party, name } : party
      )
    );
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Check if any fields are selected
    const hasSelectedFields = categories.some(category => 
      category.fields.some(field => field.selected)
    );
    
    if (!hasSelectedFields) {
      toast({
        title: "Error",
        description: "Please select at least one data field",
        variant: "destructive",
      });
      return;
    }
    
    // Collect selected fields by category
    const selectedData: Record<string, Record<string, string>> = {};
    
    categories.forEach(category => {
      const selectedFields = category.fields.filter(field => field.selected);
      
      if (selectedFields.length > 0) {
        selectedData[category.name] = {};
        selectedFields.forEach(field => {
          selectedData[category.name][field.label] = field.reason;
        });
      }
    });
    
    // Add third party data if applicable
    const thirdPartyData = {
      sharesWithThirdParties: sharesWithThirdParties === "yes",
      thirdParties: sharesWithThirdParties === "yes" ? thirdParties.map(tp => tp.name).filter(Boolean) : [],
      sharingPurpose: sharesWithThirdParties === "yes" ? sharingPurpose : "",
    };
    
    // Pass data to parent component
    onNext({
      selectedData,
      thirdPartyData
    });
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Data Collection Questionnaire</h3>
      <p className="text-neutral-600 mb-6">
        Select the categories and specific data fields that your organization collects, along with the reason for collection.
      </p>
      
      {/* Category Accordion */}
      <div className="space-y-4">
        <Accordion type="multiple" className="w-full">
          {categories.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger className="hover:no-underline bg-neutral-50 px-4 py-3 font-medium">
                {category.name}
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="p-4 border-t border-neutral-200">
                  {/* Data Fields Table */}
                  <table className="min-w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-10">Select</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Data Field</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Reason for Collection</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {category.fields.map((field) => (
                        <tr key={field.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Checkbox 
                              checked={field.selected} 
                              onCheckedChange={(checked) => 
                                handleFieldSelect(category.id, field.id, checked as boolean)
                              }
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                            {field.id.startsWith('custom_') ? (
                              <Input 
                                type="text" 
                                value={field.label} 
                                onChange={(e) => updateFieldLabel(category.id, field.id, e.target.value)}
                                placeholder="Enter custom field name"
                                className="w-full"
                              />
                            ) : (
                              field.label
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Input 
                              type="text" 
                              value={field.reason} 
                              onChange={(e) => handleReasonChange(category.id, field.id, e.target.value)}
                              placeholder="Explain why this data is collected"
                              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 flex justify-end">
                    <Button 
                      variant="outline"
                      className="text-sm text-primary-500 flex items-center"
                      onClick={() => addField(category.id)}
                    >
                      <span className="material-icons text-sm mr-1">add</span>
                      <span>Add additional field</span>
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      
      {/* Third Party Sharing */}
      <div className="mt-6 p-4 border border-neutral-200 rounded-md">
        <h4 className="font-medium mb-3">Data Sharing with Third Parties</h4>
        <div className="space-y-4">
          <RadioGroup 
            value={sharesWithThirdParties} 
            onValueChange={setSharesWithThirdParties}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="third-party-yes" />
              <Label htmlFor="third-party-yes">Yes, we share data with third parties</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="third-party-no" />
              <Label htmlFor="third-party-no">No, we do not share data with third parties</Label>
            </div>
          </RadioGroup>
          
          {/* Conditionally shown if "Yes" is selected */}
          {sharesWithThirdParties === "yes" && (
            <div className="pl-6 space-y-3">
              <div>
                <Label className="block text-sm font-medium text-neutral-700 mb-1">Names of Third Parties</Label>
                {thirdParties.map((party, index) => (
                  <div key={party.id} className="mb-2">
                    <Input
                      value={party.name}
                      onChange={(e) => updateThirdPartyName(party.id, e.target.value)}
                      placeholder={`Third party ${index + 1}`}
                      className="mb-2"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="mt-2 text-sm text-primary-500 flex items-center"
                  onClick={addThirdParty}
                >
                  <span className="material-icons text-sm mr-1">add</span>
                  <span>Add another third party</span>
                </Button>
              </div>
              <div>
                <Label className="block text-sm font-medium text-neutral-700 mb-1">Purpose of Sharing</Label>
                <textarea 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  rows={3}
                  placeholder="Explain why data is shared with third parties"
                  value={sharingPurpose}
                  onChange={(e) => setSharingPurpose(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Next Button */}
      <div className="mt-6 flex justify-end">
        <Button 
          className="bg-[#2E77AE] text-white hover:bg-[#0F3460]"
          onClick={handleSubmit}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
