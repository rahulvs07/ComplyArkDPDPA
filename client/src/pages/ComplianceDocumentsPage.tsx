import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export default function ComplianceDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();
  
  // Create sample compliance documents directly in the component
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample compliance documents
  const documents = [
    {
      documentId: 1,
      documentName: "Data Protection Policy",
      documentType: "Policy",
      uploadedByName: "Admin User",
      uploadedAt: "2025-05-01T10:30:00Z",
      folderPath: "/policies/data-protection/",
      organizationId: 18
    },
    {
      documentId: 2,
      documentName: "Privacy Notice Template",
      documentType: "Form",
      uploadedByName: "Admin User",
      uploadedAt: "2025-05-02T14:15:00Z",
      folderPath: "/templates/privacy-notices/",
      organizationId: 18
    },
    {
      documentId: 3,
      documentName: "Data Subject Request Handling Procedure",
      documentType: "Procedure",
      uploadedByName: "Admin User",
      uploadedAt: "2025-05-03T09:45:00Z",
      folderPath: "/procedures/data-requests/",
      organizationId: 18
    },
    {
      documentId: 4,
      documentName: "Personal Data Inventory Form",
      documentType: "Form",
      uploadedByName: "Admin User",
      uploadedAt: "2025-05-04T11:20:00Z",
      folderPath: "/forms/data-inventory/",
      organizationId: 18
    },
    {
      documentId: 5,
      documentName: "Data Breach Response Plan",
      documentType: "Procedure",
      uploadedByName: "Admin User",
      uploadedAt: "2025-05-05T16:10:00Z",
      folderPath: "/procedures/breach-response/",
      organizationId: 18
    }
  ];
  
  // Filter documents based on search term and active tab
  const filteredDocuments = documents.filter((document: any) => {
    const matchesSearch = 
      searchTerm === "" || 
      document.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "policies") return matchesSearch && document.documentType === "Policy";
    if (activeTab === "procedures") return matchesSearch && document.documentType === "Procedure";
    if (activeTab === "forms") return matchesSearch && document.documentType === "Form";
    
    return matchesSearch;
  });
  
  // Helper for truncating long document names with tooltip
  const formatDocumentName = (name: string) => {
    if (name.length > 30) {
      return (
        <div className="relative group">
          <span>{name.substring(0, 30)}...</span>
          <div className="absolute z-10 hidden group-hover:block bg-white border p-2 rounded shadow-md text-sm">
            {name}
          </div>
        </div>
      );
    }
    return name;
  };
  
  return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Compliance Documents</h1>
          <Button className="bg-primary-500 hover:bg-primary-600">
            <span className="material-icons mr-2 text-sm">upload_file</span>
            Upload Document
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Document Library</CardTitle>
            <div className="flex flex-col md:flex-row justify-between gap-4 mt-4">
              <div className="w-full md:w-1/3">
                <Input 
                  placeholder="Search documents..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Tabs 
                defaultValue="all" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full md:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="policies">Policies</TabsTrigger>
                  <TabsTrigger value="procedures">Procedures</TabsTrigger>
                  <TabsTrigger value="forms">Forms</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <p>No documents found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document: any) => (
                      <TableRow key={document.documentId}>
                        <TableCell className="font-medium">
                          {formatDocumentName(document.documentName)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {document.documentType}
                          </Badge>
                        </TableCell>
                        <TableCell>{document.uploadedByName || 'System'}</TableCell>
                        <TableCell>{document.uploadedAt ? format(new Date(document.uploadedAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2">
                            <span className="material-icons text-sm">download</span>
                          </Button>
                          <Button variant="outline" size="sm" className="mr-2">
                            <span className="material-icons text-sm">visibility</span>
                          </Button>
                          {user?.role === "admin" && (
                            <Button variant="outline" size="sm">
                              <span className="material-icons text-sm">delete</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}