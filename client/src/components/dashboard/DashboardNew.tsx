import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, Pie, PieChart } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { ChevronUpIcon, ChevronDownIcon, AlertTriangleIcon, MailIcon, UsersIcon, AlertCircleIcon, ArrowUpRightIcon } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';

// Define the color scheme based on the screenshot
const COLORS = {
  primary: '#0F3460',
  secondary: '#2E77AE',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  pending: '#2E77AE',
  submitted: '#2E77AE',
  inProgress: '#4CAF50',
  awaitingInfo: '#FF9800',
  escalated: '#F44336',
  closed: '#6B7280',
  pieColors: [
    '#2E77AE', // Submitted (Blue)
    '#4CAF50', // In Progress (Green)
    '#FF9800', // Awaiting Info (Orange)
    '#F44336', // Escalated (Red)
  ]
};

// Interfaces
interface StatCardProps {
  title: string;
  value: number;
  trend: string;
  icon: React.ReactNode;
  trendUp?: boolean;
}

interface WeeklyActivityData {
  name: string;
  'Data Requests': number;
  'Grievances': number;
}

interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

interface RequestData {
  id: string;
  type: 'Data Request' | 'Grievance';
  name: string;
  requestType?: string;
  status: string;
  createdAt: string;
  dueDate?: string;
  daysRemaining?: number;
  assignedTo?: string;
}

// StatCard Component
const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon, trendUp = true }) => {
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className="mt-1 text-2xl font-bold">{value}</div>
            <div className="mt-1 flex items-center text-xs">
              {trendUp ? (
                <ChevronUpIcon className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <ChevronDownIcon className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={trendUp ? 'text-green-500' : 'text-red-500'}>
                {trend}
              </span>
            </div>
          </div>
          <div className="p-2 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Table columns for escalated requests
const escalatedColumns = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue('id')}
      </Badge>
    )
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <Badge 
          variant="outline" 
          className={type === 'Data Request' ? 
            'bg-blue-50 text-blue-600 border-blue-200' : 
            'bg-orange-50 text-orange-600 border-orange-200'
          }
        >
          {type}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'requestType',
    header: 'Request Type',
    cell: ({ row }) => {
      const requestType = row.getValue('requestType') as string | undefined;
      if (!requestType) return null;
      return <Badge variant="secondary">{requestType}</Badge>;
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Created Date',
  },
  {
    accessorKey: 'assignedTo',
    header: 'Assigned To',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const id = row.getValue('id') as string;
      const numericId = id.replace(/[^0-9]/g, '');
      
      const href = type === 'Data Request' 
        ? `/dpr/${numericId}` 
        : `/grievances/${numericId}`;
        
      return (
        <Link to={href}>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <ArrowUpRightIcon className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
        </Link>
      );
    }
  }
];

// Table columns for upcoming due requests
const upcomingColumns = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue('id')}
      </Badge>
    )
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <Badge 
          variant="outline" 
          className={type === 'Data Request' ? 
            'bg-blue-50 text-blue-600 border-blue-200' : 
            'bg-orange-50 text-orange-600 border-orange-200'
          }
        >
          {type}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      let badgeClass = 'bg-gray-100 text-gray-800';
      
      if (status === 'Submitted') badgeClass = 'bg-blue-50 text-blue-600';
      if (status === 'InProgress') badgeClass = 'bg-green-50 text-green-600';
      if (status === 'AwaitingInfo') badgeClass = 'bg-orange-50 text-orange-600';
      if (status === 'Reassigned') badgeClass = 'bg-purple-50 text-purple-600';
      if (status === 'Escalated') badgeClass = 'bg-red-50 text-red-600';
      if (status === 'Closed') badgeClass = 'bg-gray-50 text-gray-600';
      
      return <Badge className={badgeClass}>{status}</Badge>;
    }
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
  },
  {
    accessorKey: 'daysRemaining',
    header: 'Days Remaining',
    cell: ({ row }) => {
      const days = row.getValue('daysRemaining') as number;
      const badgeClass = days <= 2 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600';
      return <Badge className={badgeClass}>{days} days</Badge>;
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const id = row.getValue('id') as string;
      const numericId = id.replace(/[^0-9]/g, '');
      
      const href = type === 'Data Request' 
        ? `/dpr/${numericId}` 
        : `/grievances/${numericId}`;
        
      return (
        <Link to={href}>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <ArrowUpRightIcon className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
        </Link>
      );
    }
  }
];

export function DashboardNew() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState('escalated');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  
  // Define all the queries with actual API endpoints
  
  // Stats query - Gets counts and trends for dashboard KPIs
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/dashboard/stats', { method: 'GET' });
      return response.json();
    },
    initialData: {
      totalRequests: { count: 5, trend: "+0.1% from last month", trendUp: true },
      grievances: { count: 0, trend: "+0.5% from last month", trendUp: true },
      pending: { count: 12, trend: "+15% from last month", trendUp: false },
      escalated: { count: 3, trend: "+7% from last month", trendUp: false }
    }
  });
  
  // Weekly activity query - Gets the data for the bar chart
  const { data: weeklyActivity, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ['/api/dashboard/weekly-activity'],
    queryFn: async () => {
      const response = await apiRequest('/api/dashboard/weekly-activity', { method: 'GET' });
      return response.json();
    },
    initialData: [
      { name: 'Mon', 'Data Requests': 4, 'Grievances': 2 },
      { name: 'Tue', 'Data Requests': 3, 'Grievances': 1 },
      { name: 'Wed', 'Data Requests': 5, 'Grievances': 3 },
      { name: 'Thu', 'Data Requests': 2, 'Grievances': 2 },
      { name: 'Fri', 'Data Requests': 6, 'Grievances': 4 },
      { name: 'Sat', 'Data Requests': 1, 'Grievances': 0 },
      { name: 'Sun', 'Data Requests': 0, 'Grievances': 1 },
    ]
  });
  
  // Status distribution query - Gets the data for the pie chart
  const { data: statusDistribution, isLoading: isDistributionLoading } = useQuery({
    queryKey: ['/api/dashboard/status-distribution'],
    queryFn: async () => {
      const response = await apiRequest('/api/dashboard/status-distribution', { method: 'GET' });
      return response.json();
    },
    initialData: [
      { name: 'Submitted', value: 43, color: COLORS.submitted },
      { name: 'In Progress', value: 29, color: COLORS.inProgress },
      { name: 'Awaiting Info', value: 18, color: COLORS.awaitingInfo },
      { name: 'Escalated', value: 11, color: COLORS.escalated }
    ]
  });
  
  // Escalated requests query - Gets all escalated requests from both DPR and Grievances
  const { data: escalatedRequests, isLoading: isEscalatedLoading } = useQuery({
    queryKey: ['/api/dashboard/escalated-requests'],
    queryFn: async () => {
      const response = await apiRequest('/api/dashboard/escalated-requests', { method: 'GET' });
      return response.json();
    },
    initialData: [
      { 
        id: 'DPR-001', 
        type: 'Data Request', 
        name: 'John Smith', 
        requestType: 'Access', 
        status: 'Escalated',
        createdAt: '2025-05-10', 
        assignedTo: 'Sarah Adams' 
      },
      { 
        id: 'DPR-003', 
        type: 'Data Request', 
        name: 'Emily Johnson', 
        requestType: 'Erasure', 
        status: 'Escalated',
        createdAt: '2025-05-15', 
        assignedTo: 'Michael Chen' 
      },
      { 
        id: 'GRV-002', 
        type: 'Grievance', 
        name: 'David Wilson', 
        status: 'Escalated',
        createdAt: '2025-05-12', 
        assignedTo: 'Jennifer Lopez' 
      }
    ]
  });
  
  // Upcoming due requests query - Gets requests approaching their due dates
  const { data: upcomingDueRequests, isLoading: isUpcomingLoading } = useQuery({
    queryKey: ['/api/dashboard/upcoming-due-requests'],
    queryFn: async () => {
      const response = await apiRequest('/api/dashboard/upcoming-due-requests', { method: 'GET' });
      return response.json();
    },
    initialData: [
      { 
        id: 'DPR-005', 
        type: 'Data Request', 
        name: 'Robert Davis', 
        requestType: 'Correction', 
        status: 'InProgress',
        createdAt: '2025-05-18', 
        dueDate: '2025-05-25',
        daysRemaining: 3,
        assignedTo: 'Sarah Adams' 
      },
      { 
        id: 'DPR-007', 
        type: 'Data Request', 
        name: 'Sophia Martinez', 
        requestType: 'Access', 
        status: 'AwaitingInfo',
        createdAt: '2025-05-19', 
        dueDate: '2025-05-24',
        daysRemaining: 2,
        assignedTo: 'Michael Chen' 
      },
      { 
        id: 'GRV-004', 
        type: 'Grievance', 
        name: 'James Thompson', 
        status: 'InProgress',
        createdAt: '2025-05-16', 
        dueDate: '2025-05-23',
        daysRemaining: 1,
        assignedTo: 'Jennifer Lopez' 
      }
    ]
  });
  
  // Filtered data based on search query
  const filteredEscalated = escalatedRequests?.filter(req => 
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const filteredUpcoming = upcomingDueRequests?.filter(req => 
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Navigate to detail page when clicking on a row
  const handleRowClick = (row: any) => {
    const type = row.type;
    const id = row.id.replace(/[^0-9]/g, '');
    
    if (type === 'Data Request') {
      navigate(`/dpr/${id}`);
    } else {
      navigate(`/grievances/${id}`);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats?.totalRequests?.count || 0}
          trend={stats?.totalRequests?.trend || "0% from last month"}
          trendUp={stats?.totalRequests?.trendUp}
          icon={<MailIcon className="h-5 w-5 text-[#0F3460]" />}
        />
        <StatCard
          title="Grievances"
          value={stats?.grievances?.count || 0}
          trend={stats?.grievances?.trend || "0% from last month"}
          trendUp={stats?.grievances?.trendUp}
          icon={<UsersIcon className="h-5 w-5 text-[#0F3460]" />}
        />
        <StatCard
          title="Pending"
          value={stats?.pending?.count || 12}
          trend={stats?.pending?.trend || "15% from last month"}
          trendUp={false}
          icon={<AlertTriangleIcon className="h-5 w-5 text-[#0F3460]" />}
        />
        <StatCard
          title="Escalated"
          value={stats?.escalated?.count || 3}
          trend={stats?.escalated?.trend || "7% from last month"}
          trendUp={false}
          icon={<AlertCircleIcon className="h-5 w-5 text-[#0F3460]" />}
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyActivity || []}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Data Requests" fill="#2E77AE" /> {/* Blue for Data Requests */}
                <Bar dataKey="Grievances" fill="#4CAF50" /> {/* Green for Grievances */}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Status Distribution Chart */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <CardDescription>Current request status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS.pieColors[index % COLORS.pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabbed Section for Requests */}
      <div>
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-gray-100">
              <TabsTrigger 
                value="escalated"
                className="data-[state=active]:bg-[#2E77AE] data-[state=active]:text-white"
              >
                Escalated
              </TabsTrigger>
              <TabsTrigger 
                value="upcoming"
                className="data-[state=active]:bg-[#2E77AE] data-[state=active]:text-white"
              >
                Upcoming Due
              </TabsTrigger>
            </TabsList>
            
            <Input 
              placeholder="Search requests..." 
              className="max-w-xs" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <TabsContent value="escalated" className="m-0">
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-0">
                <DataTable 
                  columns={escalatedColumns} 
                  data={filteredEscalated}
                  pagination={true}
                  onRowClick={handleRowClick}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming" className="m-0">
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-0">
                <DataTable 
                  columns={upcomingColumns} 
                  data={filteredUpcoming}
                  pagination={true}
                  onRowClick={handleRowClick}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}