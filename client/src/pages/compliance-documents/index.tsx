import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Folder, FileText, ChevronLeft, Plus, Upload, Trash2, File } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { PageTitle } from '@/components/shared/PageTitle';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define interfaces
interface ComplianceDocument {
  documentId: number;
  documentName: string;
  documentPath: string;
  documentType: string; // 'folder' or 'file'
  uploadedBy: number;
  uploadedAt: string;
  organizationId: number;
  folderPath: string;
  fileSize?: number;
  uploadedByName?: string;
}

// Define the form validation schemas
const newFolderSchema = z.object({
  folderName: z.string().min(1, 'Folder name is required')
});

const uploadFileSchema = z.object({
  document: z.instanceof(FileList).refine(files => files.length > 0, 'File is required'),
  documentName: z.string().optional()
});

export default function ComplianceDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use simple string array to track current folder path (following reference file approach)
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ComplianceDocument | null>(null);
  
  // Generate the server path string for API calls
  const folderPath = currentPath.length > 0 
    ? `/${currentPath.join('/')}/` 
    : '/';
    
  // Default folders structure to use if server returns empty results
  const defaultFolders: Record<string, ComplianceDocument[]> = {
    "": [
      {
        documentId: -1,
        documentName: "Notices",
        documentType: "folder",
        documentPath: "",
        uploadedBy: 1,
        uploadedAt: new Date().toISOString(),
        organizationId: user?.organizationId || 31,
        folderPath: "/",
        uploadedByName: "System"
      },
      {
        documentId: -2,
        documentName: "Translated Notices",
        documentType: "folder",
        documentPath: "",
        uploadedBy: 1,
        uploadedAt: new Date().toISOString(),
        organizationId: user?.organizationId || 31,
        folderPath: "/",
        uploadedByName: "System"
      },
      {
        documentId: -3,
        documentName: "Other Templates",
        documentType: "folder",
        documentPath: "",
        uploadedBy: 1,
        uploadedAt: new Date().toISOString(),
        organizationId: user?.organizationId || 31,
        folderPath: "/",
        uploadedByName: "System"
      }
    ]
  };

  // Setup form for new folder
  const newFolderForm = useForm<z.infer<typeof newFolderSchema>>({
    resolver: zodResolver(newFolderSchema),
    defaultValues: {
      folderName: ''
    }
  });

  // Setup form for file upload
  const uploadFileForm = useForm<z.infer<typeof uploadFileSchema>>({
    resolver: zodResolver(uploadFileSchema),
    defaultValues: {}
  });

  // Get folder documents from server with clean path handling using the path-based approach
  const { data: documents, isLoading, isError, error } = useQuery<ComplianceDocument[]>({
    queryKey: ['/api/compliance-documents', folderPath],
    queryFn: async () => {
      try {
        console.log(`Fetching documents for path: '${folderPath}'`);
        
        const response = await fetch(`/api/compliance-documents?folder=${encodeURIComponent(folderPath)}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} documents in path '${folderPath}'`);
        
        // Default folders to display if we get empty results or system-generated defaults
        if (data.length === 0 || (data.length > 0 && data.every((doc: ComplianceDocument) => doc.documentId < 0))) {
          console.log("Using default folder structure");
          
          // Get the current folder key for the defaultFolders
          const currentKey = currentPath.length > 0 ? currentPath.join('/') : "";
          
          // If we have a predefined structure for this path, use it
          if (defaultFolders[currentKey]) {
            return defaultFolders[currentKey];
          }
          
          // Otherwise return the default root folders adjusted for the current path
          return [
            {
              documentId: -1,
              documentName: "Notices",
              documentType: "folder",
              documentPath: "",
              uploadedBy: 1,
              uploadedAt: new Date().toISOString(),
              organizationId: user?.organizationId || 31,
              folderPath: folderPath,
              uploadedByName: "System"
            },
            {
              documentId: -2,
              documentName: "Translated Notices",
              documentType: "folder",
              documentPath: "",
              uploadedBy: 1,
              uploadedAt: new Date().toISOString(),
              organizationId: user?.organizationId || 31,
              folderPath: folderPath, 
              uploadedByName: "System"
            },
            {
              documentId: -3,
              documentName: "Other Templates",
              documentType: "folder",
              documentPath: "",
              uploadedBy: 1,
              uploadedAt: new Date().toISOString(),
              organizationId: user?.organizationId || 31,
              folderPath: folderPath,
              uploadedByName: "System"
            }
          ];
        }
        
        return data;
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { folderName: string }) => {
      try {
        console.log(`Creating folder "${data.folderName}" in path "${currentPath}"`);
        // Convert the path array to the string format the server expects
      const folderPathString = currentPath.length > 0 
        ? `/${currentPath.join('/')}/` 
        : '/';
            
      const response = await fetch(`/api/organizations/${user?.organizationId}/compliance-documents/folders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folderName: data.folderName,
            parentFolder: folderPathString
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Failed to create folder');
          } catch (parseError) {
            throw new Error('Failed to create folder: ' + errorText);
          }
        }
        
        try {
          const responseData = await response.json();
          console.log('Created folder with response:', responseData);
          return responseData;
        } catch (jsonError) {
          console.log('Response was not JSON, returning success anyway');
          return { success: true };
        }
      } catch (error) {
        console.error('Create folder failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Use the consistent folderPath format for query invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-documents', folderPath] });
      setIsNewFolderDialogOpen(false);
      newFolderForm.reset();
      toast({
        title: 'Folder created',
        description: 'Folder has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating folder',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (data: { document: FileList; documentName?: string }) => {
      const formData = new FormData();
      formData.append('document', data.document[0]);
      if (data.documentName) {
        formData.append('documentName', data.documentName);
      }
      // Convert the path array to a string format the server expects
      const folderPathString = currentPath.length > 0 
        ? `/${currentPath.join('/')}/` 
        : '/';
      formData.append('folderPath', folderPathString);
      formData.append('documentType', data.document[0].type.split('/')[1] || 'file');
      
      try {
        const response = await fetch(`/api/organizations/${user?.organizationId}/compliance-documents`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload file');
        }
        
        return response.json();
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Use the consistent folderPath format for query invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-documents', folderPath] });
      setIsUploadDialogOpen(false);
      uploadFileForm.reset();
      toast({
        title: 'File uploaded',
        description: 'File has been uploaded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error uploading file',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest('DELETE', `/api/compliance-documents/${documentId}`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete document');
      }
      return response.json();
    },
    onSuccess: () => {
      // Generate the server path string for API calls
      const currentFolderPath = currentPath.length > 0 
        ? `/${currentPath.join('/')}/` 
        : '/';
        
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-documents', currentFolderPath] });
      setSelectedDocument(null);
      toast({
        title: 'Document deleted',
        description: 'Document has been deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting document',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Navigate to folder with array-based path tracking for reliable navigation
  const navigateToFolder = (folder: ComplianceDocument) => {
    console.log(`Clicked on folder: ${folder.documentName}`);
    console.log(`Current path array:`, currentPath);
    
    // Add the folder name to the current path array
    const newPathArray = [...currentPath, folder.documentName];
    console.log(`New path array:`, newPathArray);
    
    // Update the path array in state - this will trigger a refetch
    setCurrentPath(newPathArray);
    
    // Show a toast notification for feedback
    toast({
      title: 'Navigating',
      description: `Opening folder: ${folder.documentName}`,
    });
    
    // Calculate new folder path - both as array and string format
    const updatedPathArray = [...currentPath, folder.documentName];
    const newFolderPath = updatedPathArray.length > 0 
      ? `/${updatedPathArray.join('/')}/` 
      : '/';
      
    // Invalidate specific path query
    queryClient.invalidateQueries({ queryKey: ['/api/compliance-documents', newFolderPath] });
    
    // Force a complete refresh of all document queries to ensure data consistency
    queryClient.invalidateQueries({ queryKey: ['/api/compliance-documents'] });
  };

  // Go back to parent folder using array-based path handling
  const goBack = () => {
    // If we're at the root, do nothing
    if (currentPath.length === 0) return;
    
    // Create a new path array without the last folder
    const newPathArray = currentPath.slice(0, -1);
    console.log(`Going back to parent folder:`, newPathArray);
    
    // Update the path
    setCurrentPath(newPathArray);
    
    // Show a toast notification for feedback
    toast({
      title: 'Navigating',
      description: 'Going back to parent folder',
    });
  };

  // This function has been replaced by the inline functions in the breadcrumb buttons

  // Handle new folder form submission
  const onNewFolderSubmit = (data: z.infer<typeof newFolderSchema>) => {
    createFolderMutation.mutate(data);
  };

  // Handle file upload form submission
  const onUploadFileSubmit = (data: z.infer<typeof uploadFileSchema>) => {
    uploadFileMutation.mutate(data);
  };

  // Handle delete document
  const handleDeleteDocument = () => {
    if (selectedDocument) {
      deleteDocumentMutation.mutate(selectedDocument.documentId);
    }
  };

  // Get document icon based on type
  const getDocumentIcon = (document: ComplianceDocument) => {
    if (document.documentType === 'folder') {
      return <Folder className="h-5 w-5 text-blue-500" />;
    }
    
    const extension = document.documentPath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Initial setup - create default folders if not present
  useEffect(() => {
    const setupDefaultFolders = async () => {
      if (!user) return;
      
      // Only create default folders at root level
      if (currentPath.length > 0) return;
      
      const defaultFolders = ['Notices', 'Translated Notices', 'Other Templates'];
      
      // Check if we need to create any default folders
      let needsDefaultFolders = defaultFolders.length > 0;
      
      if (documents) {
        const existingFolderNames = documents
          .filter(doc => doc.documentType === 'folder')
          .map(doc => doc.documentName);
        
        // Only create folders that don't exist yet
        const foldersToCreate = defaultFolders.filter(
          folder => !existingFolderNames.includes(folder)
        );
        
        if (foldersToCreate.length === 0) {
          needsDefaultFolders = false;
        } else {
          // Create the missing default folders
          for (const folderName of foldersToCreate) {
            try {
              // Fixed the endpoint path to match server-side
              await fetch(`/api/organizations/${user.organizationId}/compliance-documents/folders`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  folderName,
                  parentFolder: '/' // Root folder for default folders
                })
              });
              console.log(`Created default folder: ${folderName}`);
            } catch (error) {
              console.error(`Failed to create default folder ${folderName}:`, error);
            }
          }
          
          // Refresh the document list after creating default folders
          queryClient.invalidateQueries({ queryKey: ['/api/compliance-documents', currentPath] });
        }
      }
    };
    
    if (documents) {
      setupDefaultFolders();
    }
  }, [documents, user, currentPath]);

  return (
    <div className="container mx-auto p-4">
      <PageTitle title="Compliance Documents" />
      
      <Card className="shadow-sm dark:shadow-none border dark:border-gray-700">
        <CardHeader className="bg-primary-50 dark:bg-gray-800 py-4">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">Documents</CardTitle>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setIsNewFolderDialogOpen(true)}
                className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> New Folder
              </Button>
              <Button 
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-1" /> Upload Files
              </Button>
            </div>
          </div>
          
          {/* Breadcrumb navigation removed to avoid duplication */}
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="p-4 bg-gray-50 dark:bg-gray-850 flex items-center gap-2 border-b dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={currentPath.length === 0}
              className="text-gray-700 dark:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            
            <div className="text-sm flex items-center gap-1 flex-wrap">
              {/* Root folder */}
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentPath([])}
                  className={cn(
                    "hover:underline",
                    currentPath.length === 0
                      ? "text-[#2E77AE] dark:text-[#4B93D2] font-medium"
                      : "text-[#2E77AE] dark:text-blue-400"
                  )}
                >
                  Root
                </button>
              </div>
              
              {/* Path segments */}
              {currentPath.map((segment, i) => (
                <div key={i} className="flex items-center">
                  <span className="mx-1 text-gray-400">/</span>
                  <button
                    onClick={() => {
                      // Navigate to this specific level in the path
                      setCurrentPath(currentPath.slice(0, i + 1));
                    }}
                    className={cn(
                      "hover:underline",
                      i === currentPath.length - 1
                        ? "text-[#2E77AE] dark:text-[#4B93D2] font-medium"
                        : "text-[#2E77AE] dark:text-blue-400"
                    )}
                  >
                    {segment}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-4 text-center">Loading documents...</div>
          ) : isError ? (
            <Alert variant="destructive" className="m-4">
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load documents'}
              </AlertDescription>
            </Alert>
          ) : documents && documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>This folder is empty</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Updated By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents?.map((document) => (
                  <TableRow key={document.documentId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getDocumentIcon(document)}
                        {document.documentType === 'folder' ? (
                          <button
                            onClick={() => navigateToFolder(document)}
                            className="hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center"
                          >
                            <Folder className="h-4 w-4 mr-1 text-blue-500" />
                            {document.documentName}
                          </button>
                        ) : (
                          <span>{document.documentName}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {document.documentType === 'folder' ? '-' : document.fileSize ? 
                        `${Math.round(document.fileSize / 1024)} KB` : '-'}
                    </TableCell>
                    <TableCell>
                      {document.uploadedAt ? format(new Date(document.uploadedAt), 'yyyy-MM-dd') : '-'}
                    </TableCell>
                    <TableCell>{document.uploadedByName || 'System'}</TableCell>
                    <TableCell className="text-right">
                      {document.documentType !== 'folder' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedDocument(document)}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* New Folder Dialog */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          
          <Form {...newFolderForm}>
            <form onSubmit={newFolderForm.handleSubmit(onNewFolderSubmit)} className="space-y-4">
              <FormField
                control={newFolderForm.control}
                name="folderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter folder name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewFolderDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
                  disabled={createFolderMutation.isPending}
                >
                  {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          
          <Form {...uploadFileForm}>
            <form onSubmit={uploadFileForm.handleSubmit(onUploadFileSubmit)} className="space-y-4">
              <FormField
                control={uploadFileForm.control}
                name="document"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Select File</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        onChange={(e) => onChange(e.target.files)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={uploadFileForm.control}
                name="documentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Leave blank to use filename" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
                  disabled={uploadFileMutation.isPending}
                >
                  {uploadFileMutation.isPending ? 'Uploading...' : 'Upload File'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!selectedDocument} 
        onOpenChange={(open) => !open && setSelectedDocument(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          
          <p>Are you sure you want to delete "{selectedDocument?.documentName}"?</p>
          <p className="text-sm text-red-600">This action cannot be undone.</p>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedDocument(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteDocument}
              variant="destructive"
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}