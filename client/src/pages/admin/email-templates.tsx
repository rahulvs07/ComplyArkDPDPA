import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "../../components/layouts/MainLayout";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function EmailTemplatesPage() {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate>({
    id: 0,
    name: "",
    subject: "",
    body: "",
  });

  // Fetch all email templates
  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/email-templates"],
  });

  // Create or update template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const method = template.id ? "PUT" : "POST";
      const url = template.id 
        ? `/api/admin/email-templates/${template.id}` 
        : "/api/admin/email-templates";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save template");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: currentTemplate.id 
          ? "Email template updated successfully" 
          : "Email template created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete template");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Email template deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Handle edit button click
  const handleEditTemplate = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setIsEditDialogOpen(true);
  };

  // Handle create new template
  const handleCreateTemplate = () => {
    setCurrentTemplate({
      id: 0,
      name: "",
      subject: "",
      body: "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteTemplate = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  // Handle template save
  const handleSaveTemplate = () => {
    if (!currentTemplate.name || !currentTemplate.subject || !currentTemplate.body) {
      toast({
        title: "Validation Error",
        description: "Name, subject, and body are required",
        variant: "destructive",
      });
      return;
    }
    
    saveTemplateMutation.mutate(currentTemplate);
  };

  // Handle template delete confirmation
  const handleDeleteConfirm = () => {
    if (currentTemplate.id) {
      deleteTemplateMutation.mutate(currentTemplate.id);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <Button onClick={handleCreateTemplate}>Create New Template</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-500">
                Failed to load templates. Please try again.
              </div>
            </CardContent>
          </Card>
        ) : templates && templates.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template: EmailTemplate) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.subject}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {template.body.replace(/<[^>]*>?/gm, '').substring(0, 100)}
                          {template.body.length > 100 ? '...' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="mb-4">No email templates found.</p>
                <Button onClick={handleCreateTemplate}>Create First Template</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit/Create Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {currentTemplate.id ? "Edit Email Template" : "Create Email Template"}
            </DialogTitle>
            <DialogDescription>
              Define the content and appearance of emails sent from the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                placeholder="e.g., OTP Verification, Welcome Email"
                value={currentTemplate.name}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier for this template
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateSubject">Email Subject</Label>
              <Input
                id="templateSubject"
                placeholder="e.g., Your Verification Code"
                value={currentTemplate.subject}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The subject line that will appear in the recipient's inbox
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateBody">Email Content (HTML)</Label>
              <Textarea
                id="templateBody"
                placeholder="<html><body><h1>Hello</h1><p>Your content here...</p></body></html>"
                rows={12}
                value={currentTemplate.body}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, body: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                HTML content of the email. You can use placeholders like &#123;firstName&#125;, &#123;requestType&#125;, etc. which will be replaced with actual values.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={saveTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={saveTemplateMutation.isPending}
            >
              {saveTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : currentTemplate.id ? (
                "Update Template"
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template "{currentTemplate.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}