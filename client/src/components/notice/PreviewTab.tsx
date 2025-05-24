import { useState, useEffect, useMemo } from "react";
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Format selected data for display
  const formatSelectedData = useMemo(() => {
    if (!questionnaireData) return "";
    
    const { selectedData = {}, thirdPartyData = { sharesWithThirdParties: false, thirdParties: [], sharingPurpose: "" } } = questionnaireData || {};
    let formattedText = "";
    
    // Format categories and fields
    if (selectedData && typeof selectedData === 'object') {
      Object.entries(selectedData).forEach(([category, fields]: [string, any]) => {
        formattedText += `${category}:\n`;
        
        if (fields && typeof fields === 'object') {
          Object.entries(fields).forEach(([field, reason]: [string, any]) => {
            formattedText += `  - ${field}: ${reason}\n`;
          });
        }
        
        formattedText += "\n";
      });
    }
    
    // Add third party information
    if (thirdPartyData && thirdPartyData.sharesWithThirdParties) {
      formattedText += "Data Sharing with Third Parties:\n";
      
      if (thirdPartyData.thirdParties && thirdPartyData.thirdParties.length > 0) {
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
  }, [questionnaireData]);
  
  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/templates"],
  });
  
  // Set Simple Privacy Notice as default when templates are loaded
  useEffect(() => {
    if (templates && Array.isArray(templates) && templates.length > 0) {
      // Find the Simple Privacy Notice template
      const simpleTemplate = templates.find((t: any) => t.templateName === "Simple Privacy Notice");
      if (simpleTemplate) {
        setSelectedTemplate(simpleTemplate.templateId.toString());
      }
    }
  }, [templates]);
  
  // Initialize notice body when selected template changes
  useEffect(() => {
    if (selectedTemplate && templates && Array.isArray(templates)) {
      const template = templates.find((t: any) => t.templateId.toString() === selectedTemplate);
      if (template) {
        let templateContent = template.templateBody;
        
        // Check if this is the simple privacy notice template
        if (template.templateName === "Simple Privacy Notice") {
          // Replace the placeholder with the formatted data
          templateContent = templateContent.replace(
            "Selected Personal Data Fields:",
            "Selected Personal Data Fields:\n" + formatSelectedData
          );
        }
        
        setNoticeBody(templateContent);
      }
    }
  }, [selectedTemplate, templates, formatSelectedData]);
  
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
  
  // Generate preview
  const handlePreview = () => {
    // Get the current date for the footer
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format the notice body to preserve line breaks and styling
    const formattedNoticeBody = noticeBody
      .replace(/\n/g, '<br>')
      .replace(/\s{2,}/g, match => '&nbsp;'.repeat(match.length));
      
    // Enhanced preview with professional styling
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${noticeName || "Privacy Notice"} - ComplyArk</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap');
            
            body {
              font-family: 'Open Sans', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
            }
            
            .page {
              background-color: white;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
              max-width: 850px;
              margin: 40px auto;
              padding: 0;
              position: relative;
            }
            
            .header {
              padding: 25px 40px;
              border-bottom: 1px solid #e0e0e0;
              background: linear-gradient(135deg, #2E77AE 0%, #1E5B8D 100%);
              color: white;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .logo {
              font-weight: 700;
              font-size: 24px;
              margin: 0;
            }
            
            .document-title {
              margin-top: 10px;
              font-size: 28px;
              font-weight: 600;
            }
            
            .content {
              padding: 40px;
              font-size: 14px;
            }
            
            .section {
              margin-bottom: 20px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #1E5B8D;
              margin-bottom: 10px;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 5px;
            }
            
            .footer {
              padding: 20px 40px;
              border-top: 1px solid #e0e0e0;
              font-size: 12px;
              color: #666;
              text-align: center;
              background-color: #f5f5f5;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f2f2f2;
            }
            
            ul, ol {
              margin-left: 20px;
              padding-left: 0;
            }
            
            .metadata {
              margin-top: 5px;
              color: #666;
              font-size: 12px;
            }
            
            .document-id {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.7);
            }
            
            @media print {
              body {
                background-color: white;
              }
              
              .page {
                box-shadow: none;
                margin: 0;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div>
                <div class="logo">ComplyArk</div>
                <div class="document-id">Document ID: CA-${Math.floor(Math.random() * 10000)}-${new Date().getFullYear()}</div>
              </div>
              <div class="document-title">${noticeName || "Privacy Notice"}</div>
            </div>
            
            <div class="content">
              ${formattedNoticeBody}
            </div>
            
            <div class="footer">
              <div>© ${new Date().getFullYear()} ComplyArk Systems. All rights reserved.</div>
              <div>Last updated: ${currentDate}</div>
              <div>This document is generated and managed by ComplyArk Compliance Management System.</div>
            </div>
          </div>
          
          <script>
            // Add print button
            const printButton = document.createElement('button');
            printButton.innerHTML = '🖨️ Print';
            printButton.style.position = 'fixed';
            printButton.style.bottom = '20px';
            printButton.style.right = '20px';
            printButton.style.padding = '10px 15px';
            printButton.style.backgroundColor = '#2E77AE';
            printButton.style.color = 'white';
            printButton.style.border = 'none';
            printButton.style.borderRadius = '4px';
            printButton.style.cursor = 'pointer';
            printButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            printButton.onclick = () => { window.print(); };
            document.body.appendChild(printButton);
          </script>
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
              {Array.isArray(templates) && templates.map((template: any) => (
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
                value={formatSelectedData}
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
