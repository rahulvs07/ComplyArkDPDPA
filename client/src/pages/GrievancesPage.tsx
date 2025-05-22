import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

export default function GrievancesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();
  
  // Fetch grievances data
  const { data: grievances = [], isLoading } = useQuery({
    queryKey: ["/api/grievances"],
  });
  
  // Filter grievances based on search term and active tab
  const filteredGrievances = grievances.filter((grievance: any) => {
    const matchesSearch = 
      searchTerm === "" || 
      grievance.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.grievanceComment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grievance.firstName + " " + grievance.lastName).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "open") return matchesSearch && grievance.statusId !== 10; // Assuming statusId 10 is "Closed"
    if (activeTab === "closed") return matchesSearch && grievance.statusId === 10;
    
    return matchesSearch;
  });
  
  // Get status name from status ID based on actual database values
  const getStatusName = (statusId: number) => {
    const statusMap: Record<number, { name: string; color: string }> = {
      21: { name: "Submitted", color: "blue" },
      22: { name: "Pending Verification", color: "orange" },
      23: { name: "In Progress", color: "yellow" },
      24: { name: "Under Review", color: "purple" },
      25: { name: "Awaiting Information", color: "cyan" },
      26: { name: "Completed", color: "green" },
      27: { name: "Closed", color: "green" },
      28: { name: "Rejected", color: "red" },
      29: { name: "Overdue", color: "red" },
      30: { name: "On Hold", color: "gray" }
    };
    
    return statusMap[statusId] || { name: "Unknown", color: "gray" };
  };
  
  // Badge styling based on status
  const getStatusBadge = (statusId: number) => {
    const status = getStatusName(statusId);
    
    let badgeClass = "";
    switch (status.color) {
      case "blue":
        badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
        break;
      case "yellow":
        badgeClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        break;
      case "orange":
        badgeClass = "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
        break;
      case "purple":
        badgeClass = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
        break;
      case "green":
        badgeClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
    
    return (
      <Badge className={badgeClass}>
        {status.name}
      </Badge>
    );
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Grievances Management</h1>
          {user?.role === "admin" && (
            <Button className="bg-primary-500 hover:bg-primary-600">
              <span className="material-icons mr-2 text-sm">add</span>
              Create Grievance
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Grievances</CardTitle>
            <div className="flex flex-col md:flex-row justify-between gap-4 mt-4">
              <div className="w-full md:w-1/3">
                <Input 
                  placeholder="Search by name, email or comment..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Tabs 
                defaultValue="all" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full md:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrievances.map((grievance: any) => (
                      <TableRow key={grievance.grievanceId}>
                        <TableCell className="font-medium">#{grievance.grievanceId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{grievance.firstName} {grievance.lastName}</div>
                            <div className="text-sm text-neutral-500">{grievance.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{grievance.createdAt ? format(new Date(grievance.createdAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(grievance.statusId)}</TableCell>
                        <TableCell>{grievance.assignedToUserName || 'Unassigned'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2">
                            <span className="material-icons text-sm">visibility</span>
                          </Button>
                          {user?.role === "admin" && (
                            <Button variant="outline" size="sm">
                              <span className="material-icons text-sm">edit</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}