import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { getStatusColor } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

// Form schema for updating a grievance
const updateGrievanceSchema = z.object({
  statusId: z.string().optional(),
  assignedToUserId: z.string().optional(),
  comments: z.string().optional(),
});

type UpdateGrievanceValues = z.infer<typeof updateGrievanceSchema>;

export default function GrievanceDetailPage() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const grievanceId = parseInt(id);
  const [currentTab, setCurrentTab] = useState("details");
  
  // Fetch grievance details
  const { 
    data: grievance = {}, 
    isLoading: grievanceLoading 
  } = useQuery({
    queryKey: [`/api/grievances/${grievanceId}`],
    enabled: !isNaN(grievanceId),
  });
  
  // Fetch grievance history
  const { 
    data: history = [], 
    isLoading: historyLoading 
  } = useQuery({
    queryKey: [`/api/grievances/${grievanceId}/history`],
    enabled: !isNaN(grievanceId),
  });
  
  // Fetch all available statuses
  const { 
    data: statuses = [], 
    isLoading: statusesLoading 
  } = useQuery({
    queryKey: ['/api/request-statuses'],
    enabled: true,
  });
  
  // Fetch organization users for assignment (only for admins)
  const { 
    data: users = [], 
    isLoading: usersLoading 
  } = useQuery({
    queryKey: [`/api/organizations/${user?.organizationId}/users`],
    enabled: !!user?.organizationId && user?.role === "admin",
  });
  
  // Form setup
  const form = useForm<UpdateGrievanceValues>({
    resolver: zodResolver(updateGrievanceSchema),
    defaultValues: {
      statusId: grievance.statusId?.toString() || "",
      assignedToUserId: grievance.assignedToUserId?.toString() || "",
      comments: "",
    },
  });
  
  // Update form defaults when grievance data is loaded
  useEffect(() => {
    if (grievance.statusId) {
      form.setValue("statusId", grievance.statusId.toString());
    }
    if (grievance.assignedToUserId) {
      form.setValue("assignedToUserId", grievance.assignedToUserId.toString());
    }
  }, [grievance, form]);
  
  // Update grievance mutation
  const updateGrievanceMutation = useMutation({
    mutationFn: (data: UpdateGrievanceValues) => {
      const payload: any = {};
      
      // Only include changed fields
      if (data.statusId && data.statusId !== grievance.statusId?.toString()) {
        payload.statusId = parseInt(data.statusId);
      }
      
      if (data.assignedToUserId && data.assignedToUserId !== grievance.assignedToUserId?.toString()) {
        payload.assignedToUserId = parseInt(data.assignedToUserId);
      }
      
      if (data.comments?.trim()) {
        payload.comments = data.comments.trim();
      }
      
      return apiRequest("PATCH", `/api/grievances/${grievanceId}`, {
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({
        title: "Grievance updated",
        description: "The grievance has been updated successfully.",
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: [`/api/grievances/${grievanceId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/grievances/${grievanceId}/history`] });
      
      // Reset the form
      form.reset({
        statusId: grievance.statusId?.toString(),
        assignedToUserId: grievance.assignedToUserId?.toString(),
        comments: "",
      });
    },
    onError: (error) => {
      console.error("Error updating grievance:", error);
      toast({
        title: "Error",
        description: "Failed to update the grievance. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: UpdateGrievanceValues) => {
    updateGrievanceMutation.mutate(values);
  };
  
  // Format history items for timeline
  const formatHistoryItems = () => {
    if (!history.length) return [];
    
    return history.map((item: any) => {
      let title = "Request Updated";
      let icon = "edit" as "check" | "edit" | "clock" | "alert";
      let description = item.comments || "";
      let additionalDesc = "";
      
      // Status change
      if (item.newStatusId) {
        title = getStatusName(item.newStatusId);
        icon = "check";
        if (item.oldStatusId) {
          additionalDesc += `Status changed from ${getStatusName(item.oldStatusId)} to ${getStatusName(item.newStatusId)}. `;
        } else {
          additionalDesc += `Status set to ${getStatusName(item.newStatusId)}. `;
        }
      }
      
      // Assignment change
      if (item.newAssignedToUserId) {
        if (!item.newStatusId) {
          title = "Assignment Changed";
        }
        if (item.oldAssignedToUserId) {
          additionalDesc += `Reassigned from ${item.oldAssignedToName} to ${item.newAssignedToName}. `;
        } else {
          additionalDesc += `Assigned to ${item.newAssignedToName}. `;
        }
      }
      
      // If we have both comments and additional description
      if (description && additionalDesc) {
        description = `${description} (${additionalDesc.trim()})`;
      } else if (additionalDesc) {
        description = additionalDesc.trim();
      }
      
      return {
        title,
        date: format(new Date(item.changeDate), "PPP p"),
        description,
        icon,
        color: item.newStatusId ? getStatusColor(item.newStatusId, statuses) : undefined,
      };
    });
  };
  
  // Loading state
  if (grievanceLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // Helper functions
  const getStatusName = (statusId: number) => {
    const status = statuses.find((s: any) => s.statusId === statusId);
    return status?.statusName || "Unknown";
  };
  
  const getUserName = (userId: number) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown";
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            className="mr-4"
            onClick={() => navigate('/grievances')}
          >
            <span className="material-icons mr-2 text-sm">arrow_back</span>
            Back to Grievances
          </Button>
          
          <h1 className="text-2xl font-bold text-neutral-800">
            Grievance #{grievance.grievanceId}
          </h1>
          
          {grievance.statusId && (
            <Badge className={`ml-4 ${getStatusColor(grievance.statusId, statuses)}`}>
              {getStatusName(grievance.statusId)}
            </Badge>
          )}
        </div>
        
        {/* Grievance details card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Grievance #{grievance.grievanceId}</CardTitle>
              {grievance.assignedToUserId && (
                <div className="text-sm text-muted-foreground">
                  Assigned to: <span className="font-medium">{getUserName(grievance.assignedToUserId)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CardDescription>
                Submitted on {format(new Date(grievance.createdAt), "PPP")}
              </CardDescription>
              {grievance.completionDate && (
                <CardDescription>
                  <span className="mx-2">•</span>
                  Target completion: {format(new Date(grievance.completionDate), "PPP")}
                </CardDescription>
              )}
            </div>
          </CardHeader>
          
          <Tabs defaultValue="details" value={currentTab} onValueChange={setCurrentTab}>
            <div className="px-6">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="update">Update</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="details" className="px-6 py-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p>{grievance.firstName} {grievance.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{grievance.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{grievance.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-4">Grievance Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Created Date</p>
                      <p>{format(new Date(grievance.createdAt), "PPP")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p>{format(new Date(grievance.lastUpdatedAt), "PPP")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(grievance.statusId, statuses)}>
                        {getStatusName(grievance.statusId)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="font-medium mb-2">Grievance Details</h3>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 whitespace-pre-wrap">
                      {grievance.grievanceComment}
                    </CardContent>
                  </Card>
                </div>
                
                {grievance.closureComments && (
                  <div className="md:col-span-2">
                    <h3 className="font-medium mb-2">Closure Comments</h3>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 whitespace-pre-wrap">
                        {grievance.closureComments}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="px-6 py-4">
              <h3 className="font-medium mb-4">Grievance History</h3>
              {historyLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No history available</p>
                </div>
              ) : (
                <Timeline items={formatHistoryItems()} />
              )}
            </TabsContent>
            
            <TabsContent value="update" className="px-6 py-4">
              <h3 className="font-medium mb-4">Update Grievance</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="statusId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statuses.map((status: any) => (
                                <SelectItem key={status.statusId} value={status.statusId.toString()}>
                                  {status.statusName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {user?.role === "admin" && (
                      <FormField
                        control={form.control}
                        name="assignedToUserId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assigned To</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {users
                                  .filter((u: any) => u.organizationId === user.organizationId)
                                  .map((u: any) => (
                                    <SelectItem key={u.id} value={u.id.toString()}>
                                      {u.firstName} {u.lastName}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comments</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add comments about this update..."
                            {...field}
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          These comments will be recorded in the grievance history.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={updateGrievanceMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {updateGrievanceMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : "Update Grievance"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
}