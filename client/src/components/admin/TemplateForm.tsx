import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

// Template form schema
const templateSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  templateBody: z.string().min(1, "Template body is required"),
  industryId: z.string().min(1, "Industry is required"),
  templateFile: z.any().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  onSuccess: () => void;
  initialData?: any;
  isEdit?: boolean;
}

export default function TemplateForm({ onSuccess, initialData, isEdit = false }: TemplateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Fetch industries for dropdown
  const { data: industries = [] } = useQuery({
    queryKey: ["/api/industries"],
  });
  
  // Form setup
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      templateName: "",
      templateBody: "",
      industryId: "",
      templateFile: undefined,
    },
  });
  
  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      form.reset({
        templateName: initialData.templateName,
        templateBody: initialData.templateBody,
        industryId: initialData.industryId.toString(),
        templateFile: undefined,
      });
    }
  }, [initialData, isEdit, form]);
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      
      // If it's a text file, try to read its contents
      if (e.target.files[0].type === "text/plain" || 
          e.target.files[0].type === "application/json" ||
          e.target.files[0].type === "text/html") {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            form.setValue("templateBody", event.target.result.toString());
          }
        };
        reader.readAsText(e.target.files[0]);
      }
    }
  };
  
  // API mutations
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const formData = new FormData();
      formData.append("templateName", data.templateName);
      formData.append("templateBody", data.templateBody);
      formData.append("industryId", data.industryId);
      
      if (selectedFile) {
        formData.append("templateFile", selectedFile);
      }
      
      return fetch("/api/templates", {
        method: "POST",
        body: formData,
        credentials: "include",
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      form.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const formData = new FormData();
      formData.append("templateName", data.templateName);
      formData.append("templateBody", data.templateBody);
      formData.append("industryId", data.industryId);
      
      if (selectedFile) {
        formData.append("templateFile", selectedFile);
      }
      
      return fetch(`/api/templates/${initialData.templateId}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: TemplateFormValues) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  const isLoading = createMutation.isPending || updateMutation.isPending;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="templateName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter template name" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="industryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {industries.map((industry: any) => (
                      <SelectItem 
                        key={industry.industryId} 
                        value={industry.industryId.toString()}
                      >
                        {industry.industryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="templateBody"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Template Body</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter template content" 
                    {...field} 
                    rows={10}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="templateFile"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Upload Template File (PDF/DOCX)</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt,.html,.json"
                    disabled={isLoading}
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? `Selected file: ${selectedFile.name}` : "No file selected"}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-primary-500 hover:bg-primary-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEdit ? "Update Template" : "Create Template"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
