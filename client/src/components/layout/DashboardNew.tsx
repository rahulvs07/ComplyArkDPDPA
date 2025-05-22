import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip 
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Search } from "lucide-react";

// Define types for our dashboard data
interface StatCard {
  title: string;
  count: number;
  trend: string;
  trendUp: boolean;
  icon?: React.ReactNode;
}

interface EscalatedRequest {
  id: number;
  type: "dpr" | "grievance";
  requesterName: string;
  requestType: string;
  createdAt: string;
  dueDate: string;
  status: string;
}

interface UpcomingDueRequest {
  id: number;
  type: "dpr" | "grievance";
  requesterName: string;
  requestType: string;
  dueDate: string;
  daysRemaining: number;
}

// Colors for pie chart
const COLORS = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c'];

export default function DashboardNew() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"escalated" | "upcoming">("escalated");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    // Fallback to empty data
    select: (data) => data || {
      totalRequests: { count: 0, trend: "+0.1% from last month", trendUp: true },
      grievances: { count: 0, trend: "+0.5% from last month", trendUp: true },
      pending: { count: 12, trend: "+15% from last month", trendUp: false },
      escalated: { count: 3, trend: "+7% from last month", trendUp: false }
    }
  });
  
  // Fetch weekly activity data
  const { data: weeklyActivity } = useQuery({
    queryKey: ["/api/dashboard/weekly-activity"],
    // Fallback to empty data
    select: (data) => data || [
      { name: 'Mon', 'Data Requests': 4, 'Grievances': 2 },
      { name: 'Tue', 'Data Requests': 3, 'Grievances': 1 },
      { name: 'Wed', 'Data Requests': 5, 'Grievances': 3 },
      { name: 'Thu', 'Data Requests': 2, 'Grievances': 2 },
      { name: 'Fri', 'Data Requests': 6, 'Grievances': 4 },
      { name: 'Sat', 'Data Requests': 1, 'Grievances': 0 },
      { name: 'Sun', 'Data Requests': 0, 'Grievances': 1 },
    ]
  });
  
  // Fetch status distribution data
  const { data: statusDistribution } = useQuery({
    queryKey: ["/api/dashboard/status-distribution"],
    // Fallback to empty data
    select: (data) => data || [
      { name: 'Submitted', value: 43, percentage: '43%' },
      { name: 'In Progress', value: 29, percentage: '29%' },
      { name: 'Awaiting Info', value: 18, percentage: '18%' },
      { name: 'Escalated', value: 11, percentage: '11%' },
    ]
  });
  
  // Fetch escalated requests
  const { data: escalatedRequests } = useQuery({
    queryKey: ["/api/dashboard/escalated-requests"],
    // Fallback to empty data
    select: (data) => data || []
  });
  
  // Fetch upcoming due requests
  const { data: upcomingDueRequests } = useQuery({
    queryKey: ["/api/dashboard/upcoming-due-requests"],
    // Fallback to empty data
    select: (data) => data || []
  });
  
  // Filter requests by search query
  const filterRequests = (requests: any[] = []) => {
    if (!searchQuery) return requests;
    
    const query = searchQuery.toLowerCase();
    return requests.filter(request => 
      request.requesterName.toLowerCase().includes(query) ||
      request.requestType.toLowerCase().includes(query) ||
      request.id.toString().includes(query)
    );
  };
  
  // Get active tab data
  const activeTabData = activeTab === "escalated" 
    ? filterRequests(escalatedRequests)
    : filterRequests(upcomingDueRequests);
  
  // Stats cards configuration
  const statsCards: StatCard[] = [
    {
      title: "Total Requests",
      count: stats?.totalRequests?.count || 0,
      trend: stats?.totalRequests?.trend || "",
      trendUp: stats?.totalRequests?.trendUp || false
    },
    {
      title: "Grievances",
      count: stats?.grievances?.count || 0,
      trend: stats?.grievances?.trend || "",
      trendUp: stats?.grievances?.trendUp || false
    },
    {
      title: "Pending",
      count: stats?.pending?.count || 0,
      trend: stats?.pending?.trend || "",
      trendUp: stats?.pending?.trendUp || false
    },
    {
      title: "Escalated",
      count: stats?.escalated?.count || 0,
      trend: stats?.escalated?.trend || "",
      trendUp: stats?.escalated?.trendUp || false
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-bold mt-1">{stat.count}</h3>
                  <p className={`text-xs mt-1 ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trend}
                  </p>
                </div>
                <div>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyActivity}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Data Requests" fill="#8884d8" />
                <Bar dataKey="Grievances" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current request status distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage}`}
                >
                  {statusDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Requests Tables */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Request Monitoring</CardTitle>
              <CardDescription>Track escalated requests and upcoming due dates</CardDescription>
            </div>
            <div className="w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search requests..." 
                  className="pl-8 w-full md:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "escalated" | "upcoming")}>
            <TabsList className="mb-4">
              <TabsTrigger value="escalated">Escalated Requests</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Due</TabsTrigger>
            </TabsList>
            
            <TabsContent value="escalated" className="m-0">
              {activeTabData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No escalated requests found</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTabData.map((request: EscalatedRequest) => (
                        <TableRow key={`${request.type}-${request.id}`} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <Link to={`/${request.type === 'dpr' ? 'dpr' : 'grievances'}/${request.id}`} className="text-primary hover:underline">
                              #{request.id}
                            </Link>
                          </TableCell>
                          <TableCell>{request.requesterName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              request.type === 'dpr' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-0' 
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-0'
                            }>
                              {request.type === 'dpr' ? request.requestType : 'Grievance'}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.createdAt}</TableCell>
                          <TableCell className="text-red-600 font-medium">{request.dueDate}</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-0">
                              {request.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="upcoming" className="m-0">
              {activeTabData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No upcoming due requests found</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTabData.map((request: UpcomingDueRequest) => (
                        <TableRow key={`${request.type}-${request.id}`} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <Link to={`/${request.type === 'dpr' ? 'dpr' : 'grievances'}/${request.id}`} className="text-primary hover:underline">
                              #{request.id}
                            </Link>
                          </TableCell>
                          <TableCell>{request.requesterName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              request.type === 'dpr' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-0' 
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-0'
                            }>
                              {request.type === 'dpr' ? request.requestType : 'Grievance'}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.dueDate}</TableCell>
                          <TableCell>
                            <Badge className={
                              request.daysRemaining <= 1 
                                ? 'bg-red-100 text-red-800 border-0' 
                                : request.daysRemaining <= 3 
                                ? 'bg-amber-100 text-amber-800 border-0' 
                                : 'bg-green-100 text-green-800 border-0'
                            }>
                              {request.daysRemaining} {request.daysRemaining === 1 ? 'day' : 'days'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}