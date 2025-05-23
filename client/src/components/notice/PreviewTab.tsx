import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface PreviewTabProps {
  questionnaireData: any;
  onNext: (data: any) => void;
  onPrevious: () => void;
}

export default function PreviewTab({ questionnaireData, onNext, onPrevious }: PreviewTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [noticeName, setNoticeName] = useState("");
  const [noticeType, setNoticeType] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  
  // Set Simple Privacy Notice as default when templates are loaded
  useEffect(() => {
    if (templates && templates.length > 0) {
      // Find the Simple Privacy Notice template
      const simpleTemplate = templates.find(t => t.templateName === "Simple Privacy Notice");
      if (simpleTemplate) {
        setSelectedTemplate(simpleTemplate.templateId.toString());
      }
    }
  }, [templates]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/templates"],
  });
  
  // Initialize notice body when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.templateId.toString() === selectedTemplate);
      if (template) {
        let templateContent = template.templateBody;
        
        // Check if this is the simple privacy notice template
        if (template.templateName === "Simple Privacy Notice") {
          // Get the formatted data from questionnaire
          const formattedData = formatSelectedData();
          
          // Replace the placeholder with the formatted data
          templateContent = templateContent.replace(
            "Selected Personal Data Fields:",
            "Selected Personal Data Fields:\n" + formattedData
          );
        }
        
        setNoticeBody(templateContent);
      }
    }
  }, [selectedTemplate, templates, questionnaireData]);
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // If it's a text file, read its contents
      if (file.type === "text/plain" || 
          file.type === "application/json" ||
          file.type === "text/html") {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            setNoticeBody(event.target.result.toString());
          }
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "Warning",
          description: "Binary file uploaded. Content cannot be previewed but will be attached.",
        });
      }
    }
  };
  
  // Format selected data for display
  const formatSelectedData = () => {
    if (!questionnaireData) return "";
    
    const { selectedData, thirdPartyData } = questionnaireData;
    let formattedText = "";
    
    // Format categories and fields
    Object.entries(selectedData).forEach(([category, fields]: [string, any]) => {
      formattedText += `${category}:\n`;
      
      Object.entries(fields).forEach(([field, reason]: [string, any]) => {
        formattedText += `  - ${field}: ${reason}\n`;
      });
      
      formattedText += "\n";
    });
    
    // Add third party information
    if (thirdPartyData.sharesWithThirdParties) {
      formattedText += "Data Sharing with Third Parties:\n";
      
      if (thirdPartyData.thirdParties.length > 0) {
        formattedText += "  Third parties:\n";
        thirdPartyData.thirdParties.forEach((party: string) => {
          formattedText += `    - ${party}\n`;
        });
      }
      
      if (thirdPartyData.sharingPurpose) {
        formattedText += `  Purpose of sharing: ${thirdPartyData.sharingPurpose}\n`;
      }
    } else {
      formattedText += "Data Sharing with Third Parties: None\n";
    }
    
    return formattedText;
  };
  
  // Generate preview
  const handlePreview = () => {
    // Simple preview - open a new window with the content
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Notice Preview</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1565C0; }
            .container { max-width: 800px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${noticeName || "Privacy Notice"}</h1>
            <div>${noticeBody}</div>
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };
  
  // Continue to next step
  const handleContinue = () => {
    if (!noticeName) {
      toast({
        title: "Error",
        description: "Please enter a notice name",
        variant: "destructive",
      });
      return;
    }
    
    if (!noticeBody) {
      toast({
        title: "Error",
        description: "Please enter notice content or select a template",
        variant: "destructive",
      });
      return;
    }
    
    onNext({
      noticeName,
      noticeType,
      noticeBody,
      selectedTemplateId: selectedTemplate ? parseInt(selectedTemplate) : null,
      uploadedFile
    });
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Notice Type & Preview</h3>
      <p className="text-neutral-600 mb-6">
        Select a template, customize the notice content, and preview the document before translation.
      </p>
      
      <div className="space-y-6">
        {/* Notice Name and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="noticeName">Notice Name</Label>
            <Input 
              id="noticeName" 
              placeholder="Enter notice name"
              value={noticeName}
              onChange={(e) => setNoticeName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="noticeType">Notice Type</Label>
            <Input 
              id="noticeType" 
              placeholder="Privacy Policy, Terms of Service, etc."
              value={noticeType}
              onChange={(e) => setNoticeType(e.target.value)}
            />
          </div>
        </div>
        
        {/* Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="template">Select Template</Label>
          <Select 
            value={selectedTemplate} 
            onValueChange={setSelectedTemplate}
          >
            <SelectTrigger id="template">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {templates.map((template: any) => (
                <SelectItem 
                  key={template.templateId} 
                  value={template.templateId.toString()}
                >
                  {template.templateName} ({template.industryName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Upload Template */}
        <div className="space-y-2">
          <Label htmlFor="uploadTemplate">Upload Notice Format</Label>
          <Input 
            id="uploadTemplate" 
            type="file" 
            accept=".pdf,.docx,.txt,.html"
            onChange={handleFileUpload}
          />
          {uploadedFile && (
            <p className="text-sm text-muted-foreground">
              Uploaded: {uploadedFile.name}
            </p>
          )}
        </div>
        
        {/* Notice Editor */}
        <div className="space-y-2">
          <Label htmlFor="noticeBody">Notice Content</Label>
          <Textarea 
            id="noticeBody" 
            placeholder="Enter or modify notice content here" 
            className="min-h-[400px] font-mono text-sm"
            value={noticeBody}
            onChange={(e) => setNoticeBody(e.target.value)}
          />
        </div>
        
        {/* Selected Data from Questionnaire */}
        <div className="space-y-2">
          <Label>Data from Questionnaire</Label>
          <Card>
            <CardContent className="p-4">
              <Textarea 
                readOnly 
                className="font-mono text-sm" 
                rows={12} 
                value={formatSelectedData()}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onPrevious}
            className="text-[#2E77AE] border-[#2E77AE]/30 hover:bg-[#2E77AE]/10 hover:border-[#2E77AE]"
          >
            Previous
          </Button>
          
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={handlePreview}
              className="text-[#2E77AE] border-[#2E77AE]/30 hover:bg-[#2E77AE]/10 hover:border-[#2E77AE]"
            >
              <span className="material-icons text-sm mr-2">visibility</span>
              Preview
            </Button>
            
            <Button 
              className="bg-[#2E77AE] text-white hover:bg-[#0F3460]"
              onClick={handleContinue}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
