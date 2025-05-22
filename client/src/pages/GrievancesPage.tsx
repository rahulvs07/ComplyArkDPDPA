import { useState } from "react";
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
import AppLayout from "@/components/layout/AppLayout";

export default function GrievancesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("open");
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
    const closedStatusIds = statuses
      .filter((s: any) => s.statusName.toLowerCase().includes("closed") || s.statusName.toLowerCase().includes("completed"))
      .map((s: any) => s.statusId);
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "open") return matchesSearch && !closedStatusIds.includes(grievance.statusId);
    if (activeTab === "closed") return matchesSearch && closedStatusIds.includes(grievance.statusId);
    
    return matchesSearch;
  });
  
  // Handle row click to navigate to detail page
  const handleRowClick = (grievanceId: number) => {
    navigate(`/grievances/${grievanceId}`);
  };
  
  // Get Badge component with appropriate styling based on status
  const getStatusBadge = (statusId: number) => {
    const badgeClass = getStatusColor(statusId, statuses);
    
    return (
      <Badge className={badgeClass}>
        {getStatusName(statusId)}
      </Badge>
    );
  };
  
  return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Grievances Management</h1>
          {user?.role === "admin" && (
            <Button 
              className="bg-primary-500 hover:bg-primary-600"
              onClick={() => navigate('/create-grievance')}
            >
              <span className="material-icons mr-2 text-sm">add</span>
              Create Grievance
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Grievances</CardTitle>
            <div className="flex flex-col md:flex-row justify-between gap-4 mt-4">
              <div className="w-full md:w-1/3">
                <Input 
                  placeholder="Search by name, email or comment..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Tabs 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full md:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {grievancesLoading || statusesLoading || usersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredGrievances.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <p>No grievances found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrievances.map((grievance: any) => (
                      <TableRow 
                        key={grievance.grievanceId} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(grievance.grievanceId)}
                      >
                        <TableCell className="font-medium">#{grievance.grievanceId}</TableCell>
                        <TableCell>
                          <div className="font-medium">{grievance.firstName} {grievance.lastName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{grievance.email}</div>
                          <div className="text-xs text-muted-foreground">{grievance.phone}</div>
                        </TableCell>
                        <TableCell>{grievance.createdAt ? format(new Date(grievance.createdAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>{grievance.lastUpdatedAt ? format(new Date(grievance.lastUpdatedAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(grievance.statusId)}</TableCell>
                        <TableCell>{grievance.assignedToUserId ? getAssignedToName(grievance.assignedToUserId) : 'Unassigned'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}