import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import DataTable from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import { Search, Plus, ClipboardList, Clock, HourglassIcon, AlertTriangle, CheckCircle, FileEdit, FileArchive } from "lucide-react";

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
  const [, setLocation] = useLocation();
  
  // Default to showing only open requests (all except closed status)
  const closedStatusId = "27"; // Assuming 27 is the 'Closed' status ID
  const [currentTab, setCurrentTab] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: [`/api/organizations/${user?.organizationId}/dpr`, currentTab, requestTypeFilter],
    select: (data) => {
      let filteredData = data;
      
      // Filter by status tab
      if (currentTab === "open") {
        filteredData = filteredData.filter((request: any) => request.statusId.toString() !== closedStatusId);
      } else if (currentTab !== "all") {
        filteredData = filteredData.filter((request: any) => request.statusId.toString() === currentTab);
      }
      
      // Filter by request type
      if (requestTypeFilter !== "all") {
        filteredData = filteredData.filter((request: any) => 
          request.requestType === requestTypeFilter
        );
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter((request: any) => 
          request.firstName?.toLowerCase().includes(query) ||
          request.lastName?.toLowerCase().includes(query) ||
          request.email?.toLowerCase().includes(query) ||
          request.requestId?.toString().includes(query)
        );
      }
      
      // Sort by most recent first
      return [...filteredData].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!user?.organizationId
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
  
  // Helper function to get status name from status ID
  const getStatusName = (statusId: number) => {
    const status = statuses.find((s: any) => s.statusId === statusId);
    return status ? status.statusName : "Unknown";
  };
  
  // Helper function to get status ID from status name
  const getStatusIdByName = (statusName: string) => {
    const status = statuses.find((s: any) => s.statusName === statusName);
    return status ? status.statusId.toString() : "";
  };
  
  // Fetch request history when a request is selected
  useEffect(() => {
    if (selectedRequest) {
      const fetchHistory = async () => {
        try {
          const historyData = await apiRequest(`/api/dpr/${selectedRequest.requestId}/history`);
          setHistoryData(historyData);
        } catch (error) {
          console.error("Failed to fetch history:", error);
          toast({
            title: "Error",
            description: "Failed to load request history",
            variant: "destructive",
          });
        }
      };
      
      fetchHistory();
    }
  }, [selectedRequest, toast]);
  
  // Function to handle viewing a request
  const handleViewRequest = (requestId: number) => {
    const request = requests.find((r: any) => r.requestId === requestId);
    if (request) {
      setSelectedRequest(request);
      setDetailDialogOpen(true);
      
      // Initialize form with current request data
      form.reset({
        statusId: request.statusId.toString(),
        assignedToUserId: request.assignedToUserId ? request.assignedToUserId.toString() : "",
        closureComments: request.closureComments || ""
      });
    }
  };
  
  // Update request mutation
  const updateMutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      return apiRequest(`/api/dpr/${selectedRequest.requestId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${user?.organizationId}/dpr`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDetailDialogOpen(false);
    },
    onError: (error) => {
      console.error("Failed to update request:", error);
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form for updating requests
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      statusId: "",
      assignedToUserId: "",
      closureComments: ""
    }
  });
  
  // Form submission handler
  const onSubmit = (values: RequestFormValues) => {
    // Convert values to the right format
    const formattedValues = {
      statusId: parseInt(values.statusId),
      assignedToUserId: values.assignedToUserId ? parseInt(values.assignedToUserId) : null,
      closureComments: values.closureComments || null
    };
    updateMutation.mutate(formattedValues);
  };
  
  // Define status cards with icons and counts - use a Set to track unique status names
  const statusCards = useMemo(() => {
    // Make sure statuses are loaded
    if (!statuses || statuses.length === 0) {
      return [];
    }
    
    // Define a mapping of status names to ensure we don't have duplicates
    const uniqueStatusMap = new Map();
    
    // Default cards
    uniqueStatusMap.set("all", {
      key: "all",
      label: "All Requests",
      count: stats?.total?.count || 0,
      icon: <ClipboardList className="h-5 w-5" />,
      description: "All time"
    });
    
    // Only add each status once
    if (getStatusIdByName("Submitted")) {
      uniqueStatusMap.set("Submitted", {
        key: getStatusIdByName("Submitted"),
        label: "Submitted",
        count: stats?.submitted?.count || 0,
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        description: "Newly submitted"
      });
    }
    
    if (getStatusIdByName("InProgress")) {
      uniqueStatusMap.set("InProgress", {
        key: getStatusIdByName("InProgress"),
        label: "In Progress",
        count: stats?.inProgress?.count || 0,
        icon: <HourglassIcon className="h-5 w-5 text-amber-500" />,
        description: "Being processed"
      });
    }
    
    if (getStatusIdByName("AwaitingInfo")) {
      uniqueStatusMap.set("AwaitingInfo", {
        key: getStatusIdByName("AwaitingInfo"),
        label: "Awaiting Info",
        count: stats?.awaiting?.count || 0,
        icon: <Clock className="h-5 w-5 text-purple-500" />,
        description: "Waiting on requester"
      });
    }
    
    if (getStatusIdByName("Escalated")) {
      uniqueStatusMap.set("Escalated", {
        key: getStatusIdByName("Escalated"),
        label: "Escalated",
        count: stats?.escalated?.count || 0,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        description: "Requires attention"
      });
    }
    
    if (closedStatusId) {
      uniqueStatusMap.set("Closed", {
        key: closedStatusId,
        label: "Closed",
        count: stats?.completed?.count || 0,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        description: "Successfully completed"
      });
    }
    
    // Convert Map values to an array
    return Array.from(uniqueStatusMap.values());
  }, [stats, statuses, getStatusIdByName, closedStatusId]);
  
  // Table columns configuration
  const columns = [
    {
      header: "ID",
      accessorKey: "requestId",
      cell: ({ row }: any) => (
        <Link to={`/dpr/${row.original.requestId}`} className="text-primary hover:underline">
          #{row.original.requestId}
        </Link>
      ),
    },
    {
      header: "Requester",
      accessorKey: "firstName",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{`${row.original.firstName} ${row.original.lastName}`}</div>
          <div className="text-muted-foreground text-xs">{row.original.email}</div>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "requestType",
      cell: ({ row }: any) => {
        const requestType = row.original.requestType;
        let color = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
        
        if (requestType === "Correction") color = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
        if (requestType === "Nomination") color = "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
        if (requestType === "Erasure") color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
        
        return (
          <Badge variant="outline" className={`px-2.5 py-0.5 ${color} border-0`}>
            {requestType}
          </Badge>
        );
      }
    },
    {
      header: "Status",
      accessorKey: "statusId",
      cell: ({ row }: any) => {
        const statusId = row.original.statusId;
        const statusName = statuses.find((s: any) => s.statusId === statusId)?.statusName || "Unknown";
        const color = getStatusColor(statusName);
        
        return (
          <Badge variant="outline" className={`${color} border-${color}`}>
            {statusName}
          </Badge>
        );
      },
    },
    {
      header: "Assigned To",
      accessorKey: "assignedToUserId",
      cell: ({ row }: any) => {
        const assignedToUserId = row.original.assignedToUserId;
        if (!assignedToUserId) return <div>-</div>;
        
        const assignedUser = users.find((u: any) => u.id === assignedToUserId);
        return <div>{assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : '-'}</div>;
      },
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }: any) => {
        const date = new Date(row.original.createdAt);
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      header: "Due Date",
      accessorKey: "completionDate",
      cell: ({ row }: any) => {
        if (!row.original.completionDate) return <div>-</div>;
        
        const completionDate = new Date(row.original.completionDate);
        const today = new Date();
        const isOverdue = completionDate < today && row.original.statusId.toString() !== closedStatusId;
        
        return (
          <div className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
            {completionDate.toLocaleDateString()}
            {isOverdue && <div className="text-xs">Overdue</div>}
          </div>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewRequest(row.original.requestId);
            }}
            className="h-8 w-8 p-0 text-[#2E77AE] border-[#2E77AE]/30 hover:bg-[#2E77AE]/10 hover:border-[#2E77AE]"
          >
            <FileEdit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Data Principal Requests</h1>
          <p className="text-muted-foreground mt-1">Manage data principal access, correction, nomination and erasure requests</p>
        </div>
        
        {user?.role === "admin" && (
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Request
          </Button>
        )}
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusCards.map((card) => (
          <Card 
            key={card.key} 
            className={`cursor-pointer hover:border-[#2E77AE] hover:shadow-sm transition-all ${currentTab === card.key ? 'border-[#2E77AE] shadow-sm' : ''}`}
            onClick={() => setCurrentTab(card.key)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`p-2 rounded-full mb-2 ${currentTab === card.key ? 'bg-[#2E77AE]/10' : 'bg-muted'}`}>
                {card.icon}
              </div>
              <div className="font-medium">{card.label}</div>
              <div className="text-3xl font-bold mt-1">{card.count}</div>
              <div className="text-xs text-muted-foreground mt-1">{card.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Requests List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Requests List</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search requests..." 
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select 
                value={requestTypeFilter}
                onValueChange={setRequestTypeFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px] border-[#2E77AE]/30 focus:ring-[#2E77AE]/20 focus:border-[#2E77AE]">
                  <SelectValue placeholder="Request Type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Request Types</SelectItem>
                  <SelectItem value="Access" className="text-blue-600 font-medium">Access</SelectItem>
                  <SelectItem value="Correction" className="text-purple-600 font-medium">Correction</SelectItem>
                  <SelectItem value="Nomination" className="text-amber-600 font-medium">Nomination</SelectItem>
                  <SelectItem value="Erasure" className="text-red-600 font-medium">Erasure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E77AE]"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No data principal requests found</p>
              <p className="text-sm mt-1">Try changing your filters or create a new request</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={requests}
              onView={handleViewRequest}
              onRowClick={handleViewRequest}
              searchable={false} // We're handling search manually
              pagination={true}
              defaultRowsPerPage={10}
            />
          )}
        </CardContent>
      </Card>

      {/* Request Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request #{selectedRequest?.requestId}</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Request Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Request Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Requester</div>
                      <div className="text-sm font-medium">{selectedRequest.firstName} {selectedRequest.lastName}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="text-sm">{selectedRequest.email}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="text-sm">{selectedRequest.phone}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Request Type</div>
                      <div className="text-sm">
                        <Badge 
                          className={`
                            ${selectedRequest.requestType === 'Access' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : ''}
                            ${selectedRequest.requestType === 'Correction' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : ''}
                            ${selectedRequest.requestType === 'Nomination' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' : ''}
                            ${selectedRequest.requestType === 'Erasure' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : ''}
                          `}
                          variant="outline"
                        >
                          {selectedRequest.requestType}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="text-sm">
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(getStatusName(selectedRequest.statusId))}`}
                        >
                          {getStatusName(selectedRequest.statusId)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Assigned To</div>
                      <div className="text-sm">
                        {users.find((u: any) => u.id === selectedRequest.assignedToUserId)?.firstName || "Unassigned"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Created</div>
                      <div className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Due Date</div>
                      <div className="text-sm">
                        {selectedRequest.completionDate ? new Date(selectedRequest.completionDate).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="text-sm text-muted-foreground mb-1">Request Comment</div>
                      <div className="text-sm p-3 bg-muted rounded-md">
                        {selectedRequest.requestComment || "No comment provided"}
                      </div>
                    </div>
                    
                    {selectedRequest.statusId.toString() === closedStatusId && selectedRequest.closureComments && (
                      <div className="pt-2">
                        <div className="text-sm text-muted-foreground mb-1">Closure Comments</div>
                        <div className="text-sm p-3 bg-muted rounded-md">
                          {selectedRequest.closureComments}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Request History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Request History</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-y-auto">
                    {historyData && historyData.length > 0 ? (
                      <div className="space-y-4">
                        {historyData.map((entry: any, index: number) => (
                          <div key={entry.historyId} className="relative">
                            {index !== historyData.length - 1 && (
                              <div className="absolute top-5 left-3 bottom-0 w-px bg-border"></div>
                            )}
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-[#2E77AE]/10 flex items-center justify-center flex-shrink-0 z-10">
                                <div className="w-2 h-2 rounded-full bg-[#2E77AE]"></div>
                              </div>
                              <div className="pb-4">
                                <p className="text-sm font-medium">
                                  {entry.newStatusName && (
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
                                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                  <span>{new Date(entry.changeDate).toLocaleString()}</span>
                                  <span className="mx-2">•</span>
                                  <span>By {entry.changedByName}</span>
                                </div>
                                {entry.comments && entry.newStatusName && (
                                  <p className="text-sm mt-1 text-muted-foreground">
                                    Comment: {entry.comments}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        No history available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {(user?.role === "admin" || user?.canEdit) && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Update Request</CardTitle>
                      </CardHeader>
                      <CardContent>
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
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                  </SelectTrigger>
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
                          
                          {/* Only Org Admins can change the assigned staff */}
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
                                    <SelectTrigger>
                                      <SelectValue placeholder="Assign to user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">Unassigned</SelectItem>
                                      {users.map((user: any) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
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
                          
                          {statuses.some((s: any) => 
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
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2 border-t pt-4">
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
                          className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
                        >
                          {updateMutation.isPending ? "Updating..." : "Update Request"}
                        </Button>
                      </CardFooter>
                    </Card>
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