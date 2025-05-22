import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { getStatusColor } from "@/lib/utils";
import DataTable from "@/components/shared/DataTable";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, ClipboardList, Clock, HourglassIcon, AlertTriangle, CheckCircle, Plus, FileEdit } from "lucide-react";

// Define schema for grievance update form
const updateGrievanceSchema = z.object({
  statusId: z.string().min(1, "Status is required"),
  assignedToUserId: z.string().optional(),
  comments: z.string().optional().refine((val, ctx) => {
    // Make comments mandatory when status is "Closed"
    const isClosing = ctx.data && ctx.data.statusId === "35"; // Using the actual Closed status ID
    if (isClosing && (!val || val.trim() === "")) {
      return false;
    }
    return true;
  }, {
    message: "Closure comments are required when closing a grievance",
    path: ["comments"]
  })
});

type UpdateGrievanceValues = z.infer<typeof updateGrievanceSchema>;

export default function GrievancesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  
  // State variables for filters and UI
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // Fetch request statuses
  const { data: statuses = [], isLoading: statusesLoading } = useQuery({
    queryKey: ['/api/request-statuses'],
    enabled: true,
    onSuccess: (data) => {
      console.log("Status data loaded:", data);
    },
    onError: (error) => {
      console.error("Error loading statuses:", error);
    }
  });
  
  // Fetch all users for assignment info
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: true,
  });
  
  // Fetch grievances for the current organization
  const { data: grievances = [], isLoading: grievancesLoading } = useQuery({
    queryKey: [`/api/organizations/${user?.organizationId}/grievances`, currentTab],
    enabled: !!user?.organizationId,
    select: (data) => {
      let filteredData = data;
      
      // Filter by status tab
      if (currentTab === "open") {
        filteredData = filteredData.filter((grievance: any) => grievance.statusId.toString() !== "27"); // 27 is Closed status
      } else if (currentTab !== "all") {
        const statusId = getStatusIdByName(currentTab);
        if (statusId) {
          filteredData = filteredData.filter((grievance: any) => grievance.statusId.toString() === statusId);
        }
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter((grievance: any) => 
          grievance.firstName?.toLowerCase().includes(query) ||
          grievance.lastName?.toLowerCase().includes(query) ||
          grievance.email?.toLowerCase().includes(query) ||
          grievance.grievanceId?.toString().includes(query) ||
          grievance.grievanceComment?.toLowerCase().includes(query)
        );
      }
      
      // Sort by most recent first
      return [...filteredData].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  // Helper function to get status name from status ID
  const getStatusName = (statusId: number) => {
    const status = statuses.find((s: any) => s.statusId === statusId);
    return status?.statusName || "Unknown";
  };
  
  // Helper function to get status ID from status name
  const getStatusIdByName = (statusName: string) => {
    const status = statuses.find((s: any) => s.statusName.toLowerCase() === statusName.toLowerCase());
    return status ? status.statusId.toString() : "";
  };
  
  // Helper function to get assigned user name
  const getAssignedToName = (userId: number) => {
    const assignedUser = users.find((u: any) => u.id === userId);
    return assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "Unassigned";
  };
  
  // Form for updating grievances
  const form = useForm<UpdateGrievanceValues>({
    resolver: zodResolver(updateGrievanceSchema),
    defaultValues: {
      statusId: "",
      assignedToUserId: "",
      comments: ""
    }
  });
  
  // Reset form when a new grievance is selected
  useEffect(() => {
    if (selectedGrievance) {
      form.reset({
        statusId: selectedGrievance.statusId.toString(),
        assignedToUserId: selectedGrievance.assignedToUserId ? selectedGrievance.assignedToUserId.toString() : "",
        comments: ""
      });
    }
  }, [selectedGrievance, form]);
  
  // Function to handle viewing a grievance
  const handleViewGrievance = (grievanceId: number) => {
    const grievance = grievances.find((g: any) => g.grievanceId === grievanceId);
    if (grievance) {
      setSelectedGrievance(grievance);
      
      // Fetch history for the grievance
      apiRequest(`/api/grievances/${grievanceId}/history`)
        .then((history) => setHistoryData(history))
        .catch(() => setHistoryData([]));
      
      setDetailDialogOpen(true);
    }
  };
  
  // Update grievance mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateGrievanceValues) => {
      // Find the status object to get SLA days
      const statusObj = statuses.find((s: any) => s.statusId === parseInt(data.statusId));
      
      // Calculate completion date based on SLA days
      let completionDate = null;
      if (statusObj && statusObj.slaDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + statusObj.slaDays);
        completionDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
      
      return apiRequest(`/api/grievances/${selectedGrievance.grievanceId}`, {
        method: "PATCH",
        body: JSON.stringify({
          statusId: parseInt(data.statusId),
          assignedToUserId: data.assignedToUserId ? parseInt(data.assignedToUserId) : null,
          comments: data.comments || null,
          completionDate
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grievance updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${user?.organizationId}/grievances`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDetailDialogOpen(false);
    },
    onError: (error) => {
      console.error("Failed to update grievance:", error);
      toast({
        title: "Error",
        description: "Failed to update grievance. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: UpdateGrievanceValues) => {
    updateMutation.mutate(values);
  };
  
  // Define status cards with icons and counts
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
      label: "All Grievances",
      count: stats?.grievances?.total?.count || 0,
      icon: <ClipboardList className="h-5 w-5" />,
      description: "All time"
    });
    
    // Only add each status once
    if (getStatusIdByName("Submitted")) {
      uniqueStatusMap.set("Submitted", {
        key: getStatusIdByName("Submitted"),
        label: "Submitted",
        count: stats?.grievances?.submitted?.count || 0,
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        description: "Newly submitted"
      });
    }
    
    if (getStatusIdByName("InProgress")) {
      uniqueStatusMap.set("InProgress", {
        key: getStatusIdByName("InProgress"),
        label: "In Progress",
        count: stats?.grievances?.inProgress?.count || 0,
        icon: <HourglassIcon className="h-5 w-5 text-amber-500" />,
        description: "Being processed"
      });
    }
    
    if (getStatusIdByName("AwaitingInfo")) {
      uniqueStatusMap.set("AwaitingInfo", {
        key: getStatusIdByName("AwaitingInfo"),
        label: "Awaiting Info",
        count: stats?.grievances?.awaiting?.count || 0,
        icon: <Clock className="h-5 w-5 text-purple-500" />,
        description: "Waiting on requester"
      });
    }
    
    if (getStatusIdByName("Escalated")) {
      uniqueStatusMap.set("Escalated", {
        key: getStatusIdByName("Escalated"),
        label: "Escalated",
        count: stats?.grievances?.escalated?.count || 0,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        description: "Requires attention"
      });
    }
    
    const closedStatusId = "27"; // Assuming 27 is the 'Closed' status ID
    uniqueStatusMap.set("Closed", {
      key: closedStatusId,
      label: "Closed",
      count: stats?.grievances?.completed?.count || 0,
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      description: "Successfully completed"
    });
    
    // Convert Map values to an array
    return Array.from(uniqueStatusMap.values());
  }, [stats, statuses, getStatusIdByName]);
  
  // Get Badge component with appropriate styling based on status
  const getStatusBadge = (statusId: number) => {
    const statusName = getStatusName(statusId)?.toLowerCase() || "";
    let badgeClass = "";
    
    switch (statusName) {
      case "submitted":
        badgeClass = "bg-[#2E77AE]/10 text-[#2E77AE]";
        break;
      case "in progress":
      case "inprogress":
        badgeClass = "bg-amber-100 text-amber-800";
        break;
      case "awaiting info":
      case "awaitinginfo":
        badgeClass = "bg-purple-100 text-purple-800";
        break;
      case "escalated":
        badgeClass = "bg-red-100 text-red-800";
        break;
      case "closed":
        badgeClass = "bg-green-100 text-green-800";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-800";
    }
    
    return (
      <Badge variant="outline" className={`${badgeClass} border-0`}>
        {getStatusName(statusId)}
      </Badge>
    );
  };
  
  // Table columns configuration
  const columns = [
    {
      header: "ID",
      accessorKey: "grievanceId",
      cell: ({ row }: any) => (
        <div className="text-primary hover:underline cursor-pointer">
          #{row.original.grievanceId}
        </div>
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
      header: "Status",
      accessorKey: "statusId",
      cell: ({ row }: any) => {
        const statusId = row.original.statusId;
        return getStatusBadge(statusId);
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
      header: "Last Updated",
      accessorKey: "lastUpdatedAt",
      cell: ({ row }: any) => {
        if (!row.original.lastUpdatedAt) return <div>-</div>;
        
        const date = new Date(row.original.lastUpdatedAt);
        return <div>{date.toLocaleDateString()}</div>;
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
              handleViewGrievance(row.original.grievanceId);
            }}
            className="h-8 w-8 p-0 text-[#2E77AE] border-[#2E77AE]/30 hover:bg-[#2E77AE]/10 hover:border-[#2E77AE]"
          >
            <FileEdit className="h-4 w-4" />
            <span className="sr-only">View Details</span>
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Grievances</h1>
          <p className="text-muted-foreground mt-1">Manage and track grievances submitted by data subjects</p>
        </div>
        
        {user?.role === "admin" && (
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Grievance
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
      
      {/* Grievances List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Grievances List</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search grievances..." 
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {grievancesLoading || statusesLoading || usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E77AE]"></div>
            </div>
          ) : grievances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No grievances found</p>
              <p className="text-sm mt-1">Try changing your filters or create a new grievance</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={grievances}
              onView={handleViewGrievance}
              onRowClick={handleViewGrievance}
              searchable={false} // We're handling search manually
              pagination={true}
              defaultRowsPerPage={10}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Grievance Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grievance #{selectedGrievance?.grievanceId}</DialogTitle>
          </DialogHeader>
          
          {selectedGrievance && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Grievance Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Grievance Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Requester</div>
                        <div className="font-medium">{selectedGrievance.firstName} {selectedGrievance.lastName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{selectedGrievance.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{selectedGrievance.phone || "Not provided"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className="font-medium">{getStatusName(selectedGrievance.statusId)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Created On</div>
                        <div className="font-medium">{format(new Date(selectedGrievance.createdAt), "PPP")}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Assigned To</div>
                        <div className="font-medium">
                          {selectedGrievance.assignedToUserId 
                            ? getAssignedToName(selectedGrievance.assignedToUserId) 
                            : "Unassigned"}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Grievance Comment</div>
                      <div className="mt-1 p-3 bg-muted/30 rounded-md">
                        {selectedGrievance.grievanceComment || "No comment provided"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Grievance History */}
                <Card>
                  <CardHeader>
                    <CardTitle>History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historyData && historyData.length > 0 ? (
                      <div className="space-y-4">
                        {historyData.map((entry: any, index: number) => (
                          <div key={index} className="border-l-2 border-muted pl-4 pb-4 relative">
                            <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-0"></div>
                            <div className="text-sm text-muted-foreground">{format(new Date(entry.changeDate), "PPP p")}</div>
                            <div className="font-medium">
                              Status changed from{" "}
                              <span className="font-semibold">{entry.oldStatusId ? getStatusName(entry.oldStatusId) : "New"}</span>{" "}
                              to{" "}
                              <span className="font-semibold">{getStatusName(entry.newStatusId)}</span>
                            </div>
                            {entry.oldAssignedToUserId !== entry.newAssignedToUserId && (
                              <div className="text-sm">
                                Assigned to{" "}
                                <span className="font-semibold">
                                  {entry.newAssignedToUserId ? getAssignedToName(entry.newAssignedToUserId) : "Unassigned"}
                                </span>
                              </div>
                            )}
                            {entry.comments && (
                              <div className="mt-1 text-sm italic">{entry.comments}</div>
                            )}
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
                        <CardTitle>Update Grievance</CardTitle>
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
                                      <SelectValue placeholder="Select a user" />
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
                          
                          <FormField
                            control={form.control}
                            name="comments"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Comments</FormLabel>
                                <Textarea 
                                  placeholder="Add comments about this update" 
                                  className="min-h-[100px]"
                                  disabled={updateMutation.isPending}
                                  {...field}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button
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
                          {updateMutation.isPending ? "Updating..." : "Update Grievance"}
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