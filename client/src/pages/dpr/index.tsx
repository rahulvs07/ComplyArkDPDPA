import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import DataTable from "@/components/shared/DataTable";
import DeleteConfirmationDialog from "@/components/shared/DeleteConfirmationDialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import StatCard from "@/components/shared/StatCard";

// Request form schema
const requestFormSchema = z.object({
  statusId: z.string().min(1, "Status is required"),
  assignedToUserId: z.string().optional(),
  closureComments: z.string().optional()
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function DPRModule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  // Fetch requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: [`/api/organizations/${user?.organizationId}/dpr`, currentTab !== "all" ? currentTab : null],
  });
  
  // Fetch status options
  const { data: statuses = [] } = useQuery({
    queryKey: ["/api/request-statuses"],
  });
  
  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: [`/api/organizations/${user?.organizationId}/users`],
  });
  
  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  // Fetch request history when a request is selected
  useEffect(() => {
    if (selectedRequest) {
      const fetchHistory = async () => {
        try {
          const response = await fetch(`/api/dpr/${selectedRequest.requestId}/history`, {
            credentials: "include"
          });
          
          if (response.ok) {
            const data = await response.json();
            setHistoryData(data);
          } else {
            toast({
              title: "Error",
              description: "Failed to fetch request history",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Fetch history error:", error);
          toast({
            title: "Error",
            description: "An error occurred while fetching history",
            variant: "destructive",
          });
        }
      };
      
      fetchHistory();
    }
  }, [selectedRequest, toast]);
  
  // Update request form
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      statusId: "",
      assignedToUserId: "",
      closureComments: ""
    }
  });
  
  // Update form when selected request changes
  useEffect(() => {
    if (selectedRequest) {
      form.reset({
        statusId: selectedRequest.statusId.toString(),
        assignedToUserId: selectedRequest.assignedToUserId ? selectedRequest.assignedToUserId.toString() : "",
        closureComments: selectedRequest.closureComments || ""
      });
    }
  }, [selectedRequest, form]);
  
  // Update request mutation
  const updateMutation = useMutation({
    mutationFn: (data: RequestFormValues & { requestId: number }) => 
      apiRequest("PUT", `/api/dpr/${data.requestId}`, {
        statusId: parseInt(data.statusId),
        assignedToUserId: data.assignedToUserId ? parseInt(data.assignedToUserId) : null,
        closureComments: data.closureComments
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${user?.organizationId}/dpr`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: [`/api/dpr/${selectedRequest?.requestId}/history`] });
      setDetailDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle view request
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };
  
  // Handle update request
  const onSubmit = (values: RequestFormValues) => {
    if (!selectedRequest) return;
    
    // Check if closure comments are provided when status is "Closed"
    const newStatus = statuses.find((s: any) => s.statusId.toString() === values.statusId);
    if (newStatus?.statusName === "Closed" && !values.closureComments) {
      toast({
        title: "Error",
        description: "Closure comments are required when closing a request",
        variant: "destructive",
      });
      return;
    }
    
    updateMutation.mutate({
      ...values,
      requestId: selectedRequest.requestId
    });
  };
  
  // Data table columns
  const columns = [
    { 
      key: "requestId", 
      header: "ID",
      render: (value: number) => `#${value}`
    },
    { 
      key: "name", 
      header: "Name",
      render: (_: any, row: any) => `${row.firstName} ${row.lastName}`
    },
    { key: "requestType", header: "Request Type" },
    { 
      key: "statusName", 
      header: "Status",
      render: (value: string) => {
        let statusClass = "";
        switch (value.toLowerCase()) {
          case "in progress":
            statusClass = "bg-warning-50 text-warning-500";
            break;
          case "completed":
            statusClass = "bg-success-50 text-success-500";
            break;
          case "submitted":
            statusClass = "bg-primary-50 text-primary-500";
            break;
          case "overdue":
            statusClass = "bg-error-50 text-error-500";
            break;
          case "closed":
            statusClass = "bg-neutral-50 text-neutral-500";
            break;
          default:
            statusClass = "bg-neutral-50 text-neutral-500";
        }
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusClass}`}>
            {value}
          </span>
        );
      }
    },
    { key: "assignedToName", header: "Assigned To" },
    { 
      key: "completionDate", 
      header: "Due Date",
      render: (value: string) => {
        if (!value) return "N/A";
        const date = new Date(value);
        return date.toLocaleDateString();
      }
    }
  ];
  
  // Format the status for tab filter
  const getStatusIdByName = (name: string): string => {
    const status = statuses.find((s: any) => s.statusName.toLowerCase() === name.toLowerCase());
    return status ? status.statusId.toString() : "";
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-neutral-800">
              DPR Requests
            </h1>
            <p className="text-neutral-600 mt-1">
              Manage data principal requests and track their status.
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Requests"
          value={stats?.pending?.count || 0}
          icon="assignment"
          iconColor="text-primary-500"
          iconBgColor="bg-primary-50"
          trend={stats?.pending?.trend}
        />
        
        <StatCard
          title="In Progress"
          value={stats?.inProgress?.count || 0}
          icon="hourglass_top"
          iconColor="text-warning-500"
          iconBgColor="bg-warning-50"
          trend={stats?.inProgress?.trend}
        />
        
        <StatCard
          title="Completed"
          value={stats?.completed?.count || 0}
          icon="task_alt"
          iconColor="text-success-500"
          iconBgColor="bg-success-50"
          trend={stats?.completed?.trend}
        />
        
        <StatCard
          title="Overdue"
          value={stats?.overdue?.count || 0}
          icon="report_problem"
          iconColor="text-error-500"
          iconBgColor="bg-error-50"
          trend={stats?.overdue?.trend}
        />
      </div>
      
      {/* Requests List */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Data Principal Requests</CardTitle>
        </CardHeader>
        
        <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
          <div className="px-6 pt-2">
            <TabsList className="w-full bg-muted">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value={getStatusIdByName("Submitted")} className="flex-1">Submitted</TabsTrigger>
              <TabsTrigger value={getStatusIdByName("In Progress")} className="flex-1">In Progress</TabsTrigger>
              <TabsTrigger value={getStatusIdByName("Completed")} className="flex-1">Completed</TabsTrigger>
              <TabsTrigger value={getStatusIdByName("Overdue")} className="flex-1">Overdue</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value={currentTab}>
            <CardContent>
              <DataTable
                columns={columns}
                data={requests}
                onView={handleViewRequest}
                searchable={true}
                pagination={true}
              />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
      
      {/* Request Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Request ID</Label>
                  <div className="font-medium">#{selectedRequest.requestId}</div>
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="font-medium">{selectedRequest.requestType}</div>
                </div>
                <div>
                  <Label>Name</Label>
                  <div className="font-medium">{selectedRequest.firstName} {selectedRequest.lastName}</div>
                </div>
                <div>
                  <Label>Contact</Label>
                  <div className="font-medium">{selectedRequest.email} | {selectedRequest.phone}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="font-medium">{selectedRequest.statusName}</div>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <div className="font-medium">
                    {selectedRequest.completionDate ? new Date(selectedRequest.completionDate).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
              
              {selectedRequest.requestComment && (
                <div>
                  <Label>Request Comment</Label>
                  <div className="p-3 border rounded-md bg-neutral-50">
                    {selectedRequest.requestComment}
                  </div>
                </div>
              )}
              
              {selectedRequest.closureComments && (
                <div>
                  <Label>Closure Comments</Label>
                  <div className="p-3 border rounded-md bg-neutral-50">
                    {selectedRequest.closureComments}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="mb-2 block">Request History</Label>
                <div className="border rounded-md overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    {historyData.length > 0 ? (
                      <div className="divide-y">
                        {historyData.map((entry) => (
                          <div key={entry.historyId} className="p-3 hover:bg-neutral-50">
                            <div className="flex items-start">
                              <div className="p-2 rounded-full bg-primary-50 text-primary-500 flex-shrink-0 mr-3">
                                <span className="material-icons text-sm">history</span>
                              </div>
                              <div>
                                <p className="text-sm">
                                  {entry.newStatusName && entry.oldStatusName && (
                                    <>Status changed from <span className="font-medium">{entry.oldStatusName}</span> to <span className="font-medium">{entry.newStatusName}</span></>
                                  )}
                                  {entry.newAssignedToName && entry.oldAssignedToName && (
                                    <>Reassigned from <span className="font-medium">{entry.oldAssignedToName}</span> to <span className="font-medium">{entry.newAssignedToName}</span></>
                                  )}
                                  {entry.newAssignedToName && !entry.oldAssignedToName && (
                                    <>Assigned to <span className="font-medium">{entry.newAssignedToName}</span></>
                                  )}
                                  {!entry.newStatusName && !entry.newAssignedToName && entry.comments && (
                                    <>{entry.comments}</>
                                  )}
                                </p>
                                <div className="flex items-center mt-1 text-xs text-neutral-500">
                                  <span>{new Date(entry.changeDate).toLocaleString()}</span>
                                  <span className="mx-2">•</span>
                                  <span>By {entry.changedByName}</span>
                                </div>
                                {entry.comments && entry.newStatusName && (
                                  <p className="text-sm mt-1 text-neutral-600">
                                    Comment: {entry.comments}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-neutral-500">
                        No history available
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {user?.role === "admin" || user?.canEdit && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="statusId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={updateMutation.isPending}
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
                                disabled={updateMutation.isPending}
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
                      )}
                      
                      {form.watch("statusId") && statuses.find((s: any) => 
                        s.statusId.toString() === form.watch("statusId") && 
                        s.statusName === "Closed"
                      ) && (
                        <FormField
                          control={form.control}
                          name="closureComments"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Closure Comments</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter closure comments" 
                                  {...field}
                                  rows={3}
                                  disabled={updateMutation.isPending}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDetailDialogOpen(false)}
                        disabled={updateMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? "Updating..." : "Update Request"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
