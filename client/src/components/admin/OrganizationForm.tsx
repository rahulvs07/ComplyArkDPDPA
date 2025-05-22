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
import { useEffect } from "react";

// Organization form schema
const organizationSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessAddress: z.string().min(1, "Business address is required"),
  industryId: z.string().min(1, "Industry is required"),
  contactPersonName: z.string().min(1, "Contact person name is required"),
  contactEmail: z.string().email("Invalid email format"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  noOfUsers: z.coerce.number().min(1, "Number of users must be at least 1"),
  remarks: z.string().optional(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  onSuccess: () => void;
  initialData?: any;
  isEdit?: boolean;
}

export default function OrganizationForm({ onSuccess, initialData, isEdit = false }: OrganizationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch industries for dropdown
  const { data: industries = [] } = useQuery({
    queryKey: ["/api/industries"],
  });
  
  // Form setup
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      businessName: "",
      businessAddress: "",
      industryId: "",
      contactPersonName: "",
      contactEmail: "",
      contactPhone: "",
      noOfUsers: 1,
      remarks: "",
    },
  });
  
  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      form.reset({
        businessName: initialData.businessName,
        businessAddress: initialData.businessAddress,
        industryId: initialData.industryId.toString(),
        contactPersonName: initialData.contactPersonName,
        contactEmail: initialData.contactEmail,
        contactPhone: initialData.contactPhone,
        noOfUsers: initialData.noOfUsers,
        remarks: initialData.remarks || "",
      });
    }
  }, [initialData, isEdit, form]);
  
  // API mutations
  const createMutation = useMutation({
    mutationFn: (data: OrganizationFormValues) =>
      apiRequest("POST", "/api/organizations", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organization created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create organization: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: OrganizationFormValues) =>
      apiRequest("PUT", `/api/organizations/${initialData.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update organization: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: OrganizationFormValues) => {
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
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter business name" {...field} disabled={isLoading} />
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
            name="businessAddress"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Business Address</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter full address including street, city, state, and postal code" 
                    {...field} 
                    rows={3}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactPersonName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contact person's name" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="noOfUsers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Users</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1}
                    placeholder="Enter number of users" 
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter any additional remarks" 
                    {...field} 
                    rows={2}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Request Page URL Generator - Only show when editing */}
        {isEdit && initialData && (
          <div className="border rounded-md p-4 bg-muted/20">
            <h4 className="font-medium mb-2">Request Page Configuration</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a URL that allows external users to submit data protection requests and grievances for this organization.
            </p>
            
            {/* Import and use the RequestPageUrlGenerator component */}
            {React.lazy(() => import("@/components/organizations/RequestPageUrlGenerator"))({
              organizationId: initialData.id,
              currentUrl: initialData.requestPageUrlToken 
                ? `${window.location.origin}/request-page/${initialData.requestPageUrlToken}`
                : null
            })}
          </div>
        )}
        
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
              isEdit ? "Update Organization" : "Create Organization"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
