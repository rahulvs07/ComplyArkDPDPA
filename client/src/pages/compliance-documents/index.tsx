import { useState, useEffect } from 'react';
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
  const [currentPath, setCurrentPath] = useState('/');
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; path: string }[]>([
    { name: 'Root', path: '/' }
  ]);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ComplianceDocument | null>(null);

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

  // Real connection to the backend
  const { data: documents, isLoading, isError, error } = useQuery<ComplianceDocument[]>({
    queryKey: ['/api/compliance-documents', currentPath],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/compliance-documents?folder=${encodeURIComponent(currentPath)}`);
        return response;
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        throw err;
      }
    }
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { folderName: string }) => {
      try {
        const response = await fetch(`/api/organizations/${user?.organizationId}/compliance-documents/folders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folderName: data.folderName,
            parentFolder: currentPath
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create folder');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Create folder failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-documents', currentPath] });
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
      formData.append('folderPath', currentPath);
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
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-documents', currentPath] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-documents', currentPath] });
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

  // Navigate to folder
  const navigateToFolder = (folder: ComplianceDocument) => {
    // For clicking on a folder, we need to construct the path to include this folder
    // If we're at the root path '/' and click a folder named "test",
    // the new path should be '/test/'
    let newPath;
    if (currentPath === '/') {
      newPath = `/${folder.documentName}/`;
    } else {
      // If we're in a subfolder, append the folder name to the current path
      newPath = currentPath.endsWith('/')
        ? `${currentPath}${folder.documentName}/`
        : `${currentPath}/${folder.documentName}/`;
    }
    
    console.log(`Navigating to folder: ${folder.documentName}, new path: ${newPath}`);
    
    setCurrentPath(newPath);
    
    // Update breadcrumbs
    const parts = newPath.split('/').filter(Boolean);
    const newBreadcrumbs = [{ name: 'Root', path: '/' }];
    
    let currentBuildPath = '/';
    parts.forEach(part => {
      currentBuildPath += part + '/';
      newBreadcrumbs.push({
        name: part,
        path: currentBuildPath
      });
    });
    
    setBreadcrumbs(newBreadcrumbs);
  };

  // Go back to parent folder
  const goBack = () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}/`;
    
    setCurrentPath(parentPath);
    
    // Update breadcrumbs
    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    setBreadcrumbs(newBreadcrumbs);
  };

  // Navigate to specific breadcrumb
  const navigateToBreadcrumb = (path: string) => {
    setCurrentPath(path);
    
    // Update breadcrumbs
    const index = breadcrumbs.findIndex(b => b.path === path);
    if (index >= 0) {
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    }
  };

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
      if (currentPath !== '/') return;
      
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
              await apiRequest('POST', `/api/organizations/${user.organizationId}/folders`, {
                body: JSON.stringify({
                  folderName,
                  parentFolder: '/'
                })
              });
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
        <CardHeader className="bg-primary-50 dark:bg-gray-800 py-4 flex flex-row items-center justify-between">
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
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="p-4 bg-gray-50 dark:bg-gray-850 flex items-center gap-2 border-b dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={currentPath === '/'}
              className="text-gray-700 dark:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            
            <div className="text-sm flex items-center gap-1 flex-wrap">
              {breadcrumbs.map((breadcrumb, i) => (
                <div key={breadcrumb.path} className="flex items-center">
                  {i > 0 && <span className="mx-1 text-gray-400">/</span>}
                  <button
                    onClick={() => navigateToBreadcrumb(breadcrumb.path)}
                    className={cn(
                      "hover:underline",
                      currentPath === breadcrumb.path
                        ? "text-[#2E77AE] dark:text-[#4B93D2] font-medium"
                        : "text-[#2E77AE] dark:text-blue-400"
                    )}
                  >
                    {breadcrumb.name}
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
                            className="hover:text-blue-600 dark:hover:text-blue-400"
                          >
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