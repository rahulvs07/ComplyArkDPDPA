import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { getStatusColor } from "@/lib/utils";
import DataTable from "@/components/shared/DataTable";
import { Search, ClipboardList, Clock, HourglassIcon, AlertTriangle, CheckCircle } from "lucide-react";

export default function GrievancesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Fetch request statuses
  const { data: statuses = [], isLoading: statusesLoading } = useQuery({
    queryKey: ['/api/request-statuses'],
    enabled: true,
  });
  
  // Fetch all users for assignment info
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: true,
  });
  
  // Fetch grievances for the current organization
  const { data: grievances = [], isLoading: grievancesLoading } = useQuery({
    queryKey: ['/api/organizations', user?.organizationId, 'grievances'],
    enabled: !!user?.organizationId,
  });

  // Stats for each status type
  const statusCounts = {
    all: 0,
    submitted: 0,
    inProgress: 0,
    awaitingInfo: 0,
    escalated: 0,
    closed: 0
  };
  
  // Helper function to get status name from status ID
  const getStatusName = (statusId: number) => {
    const status = statuses.find((s: any) => s.statusId === statusId);
    return status?.statusName || "Unknown";
  };
  
  // Helper function to get assigned user name
  const getAssignedToName = (userId: number) => {
    const assignedUser = users.find((u: any) => u.id === userId);
    return assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "Unassigned";
  };
  
  // Filter grievances based on search term and active tab
  const filteredGrievances = grievances.filter((grievance: any) => {
    const matchesSearch = 
      searchTerm === "" || 
      grievance.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.grievanceComment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (`${grievance.firstName} ${grievance.lastName}`).toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status-based filtering
    const statusName = getStatusName(grievance.statusId)?.toLowerCase() || "";
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "submitted") return matchesSearch && statusName === "submitted";
    if (activeTab === "inProgress") return matchesSearch && (statusName === "inprogress" || statusName === "in progress");
    if (activeTab === "awaitingInfo") return matchesSearch && (statusName === "awaitinginfo" || statusName === "awaiting info");
    if (activeTab === "escalated") return matchesSearch && statusName === "escalated";
    if (activeTab === "closed") return matchesSearch && statusName === "closed";
    
    return matchesSearch;
  });

  // Calculate status counts after filtering
  grievances.forEach((grievance: any) => {
    const statusName = getStatusName(grievance.statusId)?.toLowerCase() || "";
    
    if (statusName === "submitted") statusCounts.submitted++;
    else if (statusName === "inprogress" || statusName === "in progress") statusCounts.inProgress++;
    else if (statusName === "awaitinginfo" || statusName === "awaiting info") statusCounts.awaitingInfo++;
    else if (statusName === "escalated") statusCounts.escalated++;
    else if (statusName === "closed") statusCounts.closed++;
  });
  
  // Handle row click to navigate to detail page
  const handleRowClick = (grievanceId: number) => {
    navigate(`/grievances/${grievanceId}`);
  };
  
  // Get Badge component with appropriate styling based on status
  const getStatusBadge = (statusId: number) => {
    const statusName = getStatusName(statusId)?.toLowerCase() || "";
    let badgeClass = "";
    
    switch (statusName) {
      case "submitted":
        badgeClass = "bg-[#2E77AE]/10 text-[#2E77AE] hover:bg-[#2E77AE]/20";
        break;
      case "in progress":
      case "inprogress":
        badgeClass = "bg-[#FF9800]/10 text-[#FF9800] hover:bg-[#FF9800]/20";
        break;
      case "awaiting info":
      case "awaitinginfo":
        badgeClass = "bg-[#2E77AE]/10 text-[#2E77AE] hover:bg-[#2E77AE]/20";
        break;
      case "escalated":
        badgeClass = "bg-[#F44336]/10 text-[#F44336] hover:bg-[#F44336]/20";
        break;
      case "closed":
        badgeClass = "bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20";
        break;
      default:
        badgeClass = "bg-muted text-muted-foreground";
    }
    
    return (
      <Badge className={badgeClass}>
        {getStatusName(statusId)}
      </Badge>
    );
  };

  // Define status cards
  const statusCards = [
    {
      key: "all",
      label: "All Grievances",
      count: statusCounts.all,
      icon: <ClipboardList className="w-5 h-5 text-foreground" />
    },
    {
      key: "submitted",
      label: "Submitted",
      count: statusCounts.submitted,
      icon: <Clock className="w-5 h-5 text-primary" />
    },
    {
      key: "inProgress",
      label: "In Progress",
      count: statusCounts.inProgress,
      icon: <HourglassIcon className="w-5 h-5 text-warning" />
    },
    {
      key: "awaitingInfo",
      label: "Awaiting Info",
      count: statusCounts.awaitingInfo,
      icon: <Clock className="w-5 h-5 text-info" />
    },
    {
      key: "escalated",
      label: "Escalated",
      count: statusCounts.escalated,
      icon: <AlertTriangle className="w-5 h-5 text-destructive" />
    },
    {
      key: "closed",
      label: "Closed",
      count: statusCounts.closed,
      icon: <CheckCircle className="w-5 h-5 text-success" />
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
            onClick={() => navigate('/create-grievance')}
            className="bg-[#2E77AE] hover:bg-[#0F3460] text-white"
          >
            <span className="material-icons mr-2 text-sm">add</span>
            Create Grievance
          </Button>
        )}
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusCards.map((card) => (
          <Card 
            key={card.key} 
            className={`cursor-pointer hover:border-[#2E77AE] hover:shadow-sm transition-all ${activeTab === card.key ? 'border-[#2E77AE] shadow-sm' : ''}`}
            onClick={() => setActiveTab(card.key)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`p-2 rounded-full mb-2 ${activeTab === card.key ? 'bg-[#2E77AE]/10' : 'bg-muted'}`}>
                {card.icon}
              </div>
              <div className="font-medium">{card.label}</div>
              <div className="text-3xl font-bold mt-1">{card.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Grievances List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Grievances List</h2>
        
        <div className="bg-background rounded-lg border shadow-sm">
          <div className="p-4">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {grievancesLoading || statusesLoading || usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E77AE]"></div>
            </div>
          ) : filteredGrievances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>NAME</TableHead>
                    <TableHead>CONTACT</TableHead>
                    <TableHead>ASSIGNED TO</TableHead>
                    <TableHead>CREATED DATE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>LAST UPDATE</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrievances.map((grievance: any) => (
                    <TableRow 
                      key={grievance.grievanceId} 
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => handleRowClick(grievance.grievanceId)}
                    >
                      <TableCell className="font-medium">{grievance.grievanceId}</TableCell>
                      <TableCell>
                        {grievance.firstName} {grievance.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{grievance.email}</div>
                        <div className="text-xs text-muted-foreground">{grievance.phone}</div>
                      </TableCell>
                      <TableCell>{grievance.assignedToUserId ? getAssignedToName(grievance.assignedToUserId) : 'Unassigned'}</TableCell>
                      <TableCell>{grievance.createdAt ? format(new Date(grievance.createdAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(grievance.statusId)}</TableCell>
                      <TableCell>{grievance.lastUpdatedAt ? format(new Date(grievance.lastUpdatedAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(grievance.grievanceId);
                          }}
                          className="text-[#2E77AE] border-[#2E77AE]/30 hover:bg-[#2E77AE]/10 hover:border-[#2E77AE]"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}