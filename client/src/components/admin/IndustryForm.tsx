import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

// Industry form schema
const industrySchema = z.object({
  industryName: z.string().min(1, "Industry name is required"),
});

type IndustryFormValues = z.infer<typeof industrySchema>;

interface IndustryFormProps {
  onSuccess: () => void;
  initialData?: any;
  isEdit?: boolean;
}

export default function IndustryForm({ onSuccess, initialData, isEdit = false }: IndustryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form setup
  const form = useForm<IndustryFormValues>({
    resolver: zodResolver(industrySchema),
    defaultValues: {
      industryName: "",
    },
  });
  
  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      form.reset({
        industryName: initialData.industryName,
      });
    }
  }, [initialData, isEdit, form]);
  
  // API mutations
  const createMutation = useMutation({
    mutationFn: (data: IndustryFormValues) =>
      apiRequest("POST", "/api/industries", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Industry created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/industries"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create industry: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: IndustryFormValues) =>
      apiRequest("PUT", `/api/industries/${initialData.industryId}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Industry updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/industries"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update industry: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: IndustryFormValues) => {
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
        <FormField
          control={form.control}
          name="industryName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter industry name" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
              isEdit ? "Update Industry" : "Create Industry"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
