import { useQuery } from "@tanstack/react-query";
import StatCard from "../shared/StatCard";
import DataTable from "../shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-provider";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Default stats for initial render
  const defaultStats = {
    pending: { 
      count: 12, 
      trend: { value: "8% from last week", isPositive: false } 
    },
    inProgress: { 
      count: 8, 
      trend: { value: "5% from last week", isPositive: true } 
    },
    completed: { 
      count: 24, 
      trend: { value: "12% from last week", isPositive: true } 
    },
    overdue: { 
      count: 3, 
      trend: { value: "2% from last week", isPositive: false } 
    }
  };
  
  // Default activities for initial render
  const defaultActivities = [
    {
      id: 1,
      type: "new_request",
      message: "New data request submitted by Sarah Johnson",
      timeAgo: "10 minutes ago",
      icon: "assignment",
      iconClass: "bg-primary-50 text-primary-500"
    },
    {
      id: 2,
      type: "completed",
      message: "Request #1243 marked as complete",
      timeAgo: "1 hour ago",
      icon: "task_alt",
      iconClass: "bg-success-50 text-success-500"
    },
    {
      id: 3,
      type: "overdue",
      message: "Request #1242 is overdue",
      timeAgo: "2 hours ago",
      icon: "report_problem",
      iconClass: "bg-error-50 text-error-500"
    },
    {
      id: 4,
      type: "new_template",
      message: "New notice template added by Admin",
      timeAgo: "Yesterday",
      icon: "description",
      iconClass: "bg-warning-50 text-warning-500"
    }
  ];
  
  // Default requests for initial render
  const defaultRequests = [
    {
      id: "#1248",
      name: "Sarah Johnson",
      requestType: "Access",
      status: "In Progress",
      assignedTo: "John Doe",
      dueDate: "Jul 29, 2023"
    },
    {
      id: "#1247",
      name: "Michael Brown",
      requestType: "Correction",
      status: "Completed",
      assignedTo: "Emma Wilson",
      dueDate: "Jul 28, 2023"
    },
    {
      id: "#1246",
      name: "Lisa Chen",
      requestType: "Erasure",
      status: "Submitted",
      assignedTo: "Unassigned",
      dueDate: "Jul 31, 2023"
    },
    {
      id: "#1245",
      name: "Robert Davis",
      requestType: "Nomination",
      status: "Overdue",
      assignedTo: "John Doe",
      dueDate: "Jul 25, 2023"
    }
  ];
  
  // Fetch dashboard stats 
  const { data: stats = defaultStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  // Fetch recent requests
  const { data: recentRequests = defaultRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-requests"],
  });
  
  // Fetch recent activities
  const { data: activities = defaultActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/dashboard/activities"],
  });
  
  const requestColumns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "requestType", header: "Request Type" },
    { 
      key: "status", 
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
    { key: "assignedTo", header: "Assigned To" },
    { key: "dueDate", header: "Due Date" },
  ];
  
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-neutral-800">
              Welcome back, {user?.firstName || "User"}
            </h1>
            <p className="text-neutral-600 mt-1">
              Here's what's happening with your compliance tasks today.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/dpr">
              <Button className="bg-primary-500 text-white rounded-md font-medium flex items-center shadow-sm hover:bg-primary-600 transition">
                <span className="material-icons text-sm mr-2">add</span>
                <span>New Request</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Requests"
          value={stats.pending.count}
          icon="assignment"
          iconColor="text-primary-500"
          iconBgColor="bg-primary-50"
          trend={stats.pending.trend}
        />
        
        <StatCard
          title="In Progress"
          value={stats.inProgress.count}
          icon="hourglass_top"
          iconColor="text-warning-500"
          iconBgColor="bg-warning-50"
          trend={stats.inProgress.trend}
        />
        
        <StatCard
          title="Completed"
          value={stats.completed.count}
          icon="task_alt"
          iconColor="text-success-500"
          iconBgColor="bg-success-50"
          trend={stats.completed.trend}
        />
        
        <StatCard
          title="Overdue"
          value={stats.overdue.count}
          icon="report_problem"
          iconColor="text-error-500"
          iconBgColor="bg-error-50"
          trend={stats.overdue.trend}
        />
      </div>
      
      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5 border border-neutral-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-neutral-800">Request Status Overview</h3>
            <div>
              <Select defaultValue="7days">
                <SelectTrigger className="text-sm border border-neutral-300 rounded-md px-2 py-1 bg-white h-auto w-auto">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Simple Chart Visualization */}
          <div className="h-64 border border-neutral-200 rounded-md bg-neutral-50 flex items-center justify-center">
            <div className="w-full h-full p-4 flex items-end justify-around">
              <div className="flex flex-col items-center">
                <div className="w-12 bg-primary-500 rounded-t-md" style={{height: '60%'}}></div>
                <p className="text-xs mt-2">Mon</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 bg-primary-500 rounded-t-md" style={{height: '80%'}}></div>
                <p className="text-xs mt-2">Tue</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 bg-primary-500 rounded-t-md" style={{height: '50%'}}></div>
                <p className="text-xs mt-2">Wed</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 bg-primary-500 rounded-t-md" style={{height: '70%'}}></div>
                <p className="text-xs mt-2">Thu</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 bg-primary-500 rounded-t-md" style={{height: '90%'}}></div>
                <p className="text-xs mt-2">Fri</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 bg-primary-500 rounded-t-md" style={{height: '40%'}}></div>
                <p className="text-xs mt-2">Sat</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 bg-primary-500 rounded-t-md" style={{height: '30%'}}></div>
                <p className="text-xs mt-2">Sun</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-neutral-800">Recent Activity</h3>
            <button className="text-primary-500 text-sm">View all</button>
          </div>
          
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${activity.iconClass} flex-shrink-0`}>
                  <span className="material-icons text-sm">{activity.icon}</span>
                </div>
                <div>
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-neutral-500">{activity.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Requests Table */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-neutral-800">Recent Data Principal Requests</CardTitle>
            <Link href="/dpr">
              <Button variant="link" className="text-primary-500">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={requestColumns}
            data={recentRequests}
            onView={(row) => console.log("View", row)}
            onEdit={(row) => console.log("Edit", row)}
          />
        </CardContent>
      </Card>
    </div>
  );
}