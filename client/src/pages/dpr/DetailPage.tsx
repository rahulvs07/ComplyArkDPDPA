import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Timeline } from "@/components/ui/timeline";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getStatusColor } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronLeft, AlertCircle, CheckCircle, Clock } from "lucide-react";

// Update request form schema
const updateRequestSchema = z.object({
  statusId: z.string().min(1, "Status is required"),
  assignedToUserId: z.string().optional(),
  comments: z.string().optional(),
});

type UpdateRequestValues = z.infer<typeof updateRequestSchema>;

export default function DPRDetailPage() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState("details");
  
  // Fetch request details
  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: [`/api/dpr/${requestId}`],
    enabled: !!requestId,
  });
  
  // Fetch request history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: [`/api/dpr/${requestId}/history`],
    enabled: !!requestId,
  });
  
  // Fetch status options
  const { data: statuses = [] } = useQuery({
    queryKey: ["/api/request-statuses"],
  });
  
  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: [`/api/organizations/${user?.organizationId}/users`],
    enabled: !!user,
  });
  
  // Form setup for updating request
  const form = useForm<UpdateRequestValues>({
    resolver: zodResolver(updateRequestSchema),
    defaultValues: {
      statusId: request?.statusId?.toString() || "",
      assignedToUserId: request?.assignedToUserId?.toString() || "",
      comments: "",
    }
  });
  
  // Update form values when request data loads
  useEffect(() => {
    if (request) {
      form.reset({
        statusId: request.statusId?.toString() || "",
        assignedToUserId: request.assignedToUserId?.toString() || "",
        comments: "",
      });
    }
  }, [request, form]);
  
  // Get status name by ID
  const getStatusName = (statusId: number) => {
    const status = statuses.find((s: any) => s.statusId === statusId);
    return status ? status.statusName : "Unknown";
  };
  
  // Get user name by ID
  const getUserName = (userId: number) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unassigned";
  };
  
  // Calculate time remaining based on SLA
  const calculateTimeRemaining = () => {
    if (!request || !request.completionDate) return "N/A";
    
    const completionDate = new Date(request.completionDate);
    const today = new Date();
    
    // Check if already past deadline
    if (today > completionDate) {
      return "Overdue";
    }
    
    // Calculate days remaining
    const diffTime = completionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} days`;
  };
  
  // Update request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async (values: UpdateRequestValues) => {
      return apiRequest(`/api/dpr/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({
          statusId: parseInt(values.statusId),
          assignedToUserId: values.assignedToUserId ? parseInt(values.assignedToUserId) : null,
          comments: values.comments || null,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Request updated",
        description: "The request has been successfully updated",
      });
      // Clear comments field
      form.setValue("comments", "");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/dpr/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/dpr/${requestId}/history`] });
    },
    onError: (error) => {
      toast({
        title: "Error updating request",
        description: "There was a problem updating the request. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating request:", error);
    },
  });
  
  // Handle form submission
  const onSubmit = (values: UpdateRequestValues) => {
    updateRequestMutation.mutate(values);
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
  if (requestLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading request details...</p>
      </div>
    );
  }
  
  // Check if request exists
  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Request Not Found</h2>
        <p className="text-muted-foreground mb-4">The request you are looking for does not exist or you don't have permission to view it.</p>
        <Link href="/dpr">
          <Button>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header section with back button and request info */}
      <div className="flex items-start justify-between">
        <Link href="/dpr">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
        
        <div className="flex items-center space-x-2">
          <Badge variant={request.statusId === 27 ? "outline" : "default"} className={`${getStatusColor(request.statusId, statuses)}`}>
            {getStatusName(request.statusId)}
          </Badge>
          
          {request.completionDate && (
            <Badge variant={calculateTimeRemaining() === "Overdue" ? "destructive" : "secondary"}>
              {calculateTimeRemaining() === "Overdue" ? (
                <>
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Overdue
                </>
              ) : calculateTimeRemaining() === "N/A" ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </>
              ) : (
                <>
                  <Clock className="mr-1 h-3 w-3" />
                  {calculateTimeRemaining()} remaining
                </>
              )}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Request details card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <CardTitle>Request #{request.requestId}</CardTitle>
            {request.assignedToUserId && (
              <div className="text-sm text-muted-foreground">
                Assigned to: <span className="font-medium">{getUserName(request.assignedToUserId)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CardDescription>
              {request.requestType} Request submitted on {format(new Date(request.createdAt), "PPP")}
            </CardDescription>
            {request.completionDate && (
              <CardDescription>
                <span className="mx-2">•</span>
                Target completion: {format(new Date(request.completionDate), "PPP")}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        
        <Tabs defaultValue="details" value={currentTab} onValueChange={setCurrentTab}>
          <div className="px-6">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Request Details</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">Request History</TabsTrigger>
              <TabsTrigger value="update" className="flex-1">Update Request</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Request Details Tab */}
          <TabsContent value="details">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Requester Information</h3>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Name:</span> {request.firstName} {request.lastName}</p>
                      <p><span className="font-medium">Email:</span> {request.email}</p>
                      <p><span className="font-medium">Phone:</span> {request.phone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Request Details</h3>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Type:</span> {request.requestType}</p>
                      <p><span className="font-medium">Submitted:</span> {format(new Date(request.createdAt), "PPP")}</p>
                      <p><span className="font-medium">Last Updated:</span> {format(new Date(request.lastUpdatedAt), "PPP")}</p>
                      <p><span className="font-medium">Current Status:</span> {getStatusName(request.statusId)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Assignment Information</h3>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Assigned To:</span> {request.assignedToUserId ? getUserName(request.assignedToUserId) : "Unassigned"}</p>
                      <p><span className="font-medium">Target Completion:</span> {request.completionDate ? format(new Date(request.completionDate), "PPP") : "Not set"}</p>
                      <p><span className="font-medium">Time Remaining:</span> {calculateTimeRemaining()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Request Comments</h3>
                    <div className="mt-2 border rounded p-3 min-h-[100px] bg-muted/30">
                      {request.requestComment || "No comments provided"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>
          
          {/* Request History Tab */}
          <TabsContent value="history">
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Request Timeline</h3>
                {historyLoading ? (
                  <p>Loading history...</p>
                ) : history.length === 0 ? (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">No history available for this request</p>
                  </div>
                ) : (
                  <Timeline items={formatHistoryItems()} />
                )}
              </div>
            </CardContent>
          </TabsContent>
          
          {/* Update Request Tab */}
          <TabsContent value="update">
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="statusId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Update Status</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statuses.map((status: any) => (
                                <SelectItem 
                                  key={status.statusId} 
                                  value={status.statusId.toString()}
                                >
                                  {status.statusName}
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
                      name="assignedToUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign To</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {users.map((user: any) => (
                                <SelectItem 
                                  key={user.id} 
                                  value={user.id.toString()}
                                >
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comments</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add comments about this status update"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={updateRequestMutation.isPending}
                  >
                    {updateRequestMutation.isPending ? "Updating..." : "Update Request"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}