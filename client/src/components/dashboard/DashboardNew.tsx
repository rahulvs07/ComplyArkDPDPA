import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, Pie, PieChart } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TriangleIcon, CheckCircleIcon, AlertCircleIcon, CalendarIcon, UserIcon, ListIcon } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';

// Color palette
const colors = {
  primary: '#0F3460',
  secondary: '#2E77AE',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  pieColors: ['#0F3460', '#2E77AE', '#4CAF50', '#F44336', '#FF9800']
};

type StatCardProps = {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
};

const StatCard = ({ title, value, change, icon, color }: StatCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs">
          {change > 0 ? (
            <TriangleIcon className="h-3 w-3 mr-1 text-success-500" />
          ) : (
            <TriangleIcon className="h-3 w-3 mr-1 rotate-180 text-danger-500" />
          )}
          <span className={change > 0 ? 'text-success-500' : 'text-danger-500'}>
            {Math.abs(change)}% from last month
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const escaltedColumns = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('id')}</Badge>
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <Badge 
          variant="outline" 
          className={type === 'Data Request' ? 'bg-info-50 text-info-600 border-info-200' : 'bg-warning-50 text-warning-600 border-warning-200'}
        >
          {type}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'subject',
    header: 'Subject',
  },
  {
    accessorKey: 'requestType',
    header: 'Request Type',
    cell: ({ row }) => {
      const requestType = row.getValue('requestType') as string;
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
  }
];

const upcomingColumns = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('id')}</Badge>
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <Badge 
          variant="outline" 
          className={type === 'Data Request' ? 'bg-info-50 text-info-600 border-info-200' : 'bg-warning-50 text-warning-600 border-warning-200'}
        >
          {type}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'subject',
    header: 'Subject',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      let badgeClass = 'bg-gray-100 text-gray-800';
      
      if (status === 'Submitted') badgeClass = 'bg-info-50 text-info-600';
      if (status === 'InProgress') badgeClass = 'bg-warning-50 text-warning-600';
      if (status === 'AwaitingInfo') badgeClass = 'bg-secondary-50 text-secondary-600';
      if (status === 'Reassigned') badgeClass = 'bg-purple-50 text-purple-600';
      if (status === 'Escalated') badgeClass = 'bg-danger-50 text-danger-600';
      if (status === 'Closed') badgeClass = 'bg-success-50 text-success-600';
      
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
      const badgeClass = days <= 2 ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-600';
      return <Badge className={badgeClass}>{days} days</Badge>;
    }
  }
];

export function DashboardNew() {
  const [tab, setTab] = useState('escalated');
  
  // Stats query
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchOnWindowFocus: false,
  });
  
  // Weekly activity query
  const { data: weeklyData, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ['/api/dashboard/weekly-activity'],
    refetchOnWindowFocus: false,
  });
  
  // Status distribution query
  const { data: distributionData, isLoading: isDistributionLoading } = useQuery({
    queryKey: ['/api/dashboard/status-distribution'],
    refetchOnWindowFocus: false,
  });
  
  // Escalated requests query
  const { data: escalatedData, isLoading: isEscalatedLoading } = useQuery({
    queryKey: ['/api/dashboard/escalated-requests'],
    refetchOnWindowFocus: false,
  });
  
  // Upcoming due requests query
  const { data: upcomingData, isLoading: isUpcomingLoading } = useQuery({
    queryKey: ['/api/dashboard/upcoming-due-requests'],
    refetchOnWindowFocus: false,
  });
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-1">
            <span className="text-gray-900">Comply</span>
            <span className="text-blue-600">Ark</span>
          </h2>
          <p className="text-sm text-gray-500">DPDPA Compliance Management Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs py-1">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Today: {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isStatsLoading ? (
          <>
            <Card className="h-32 animate-pulse"></Card>
            <Card className="h-32 animate-pulse"></Card>
            <Card className="h-32 animate-pulse"></Card>
            <Card className="h-32 animate-pulse"></Card>
          </>
        ) : (
          <>
            <StatCard
              title={statsData?.totalRequests?.label || "Data Requests"}
              value={statsData?.totalRequests?.count || 0}
              change={statsData?.totalRequests?.change || 0}
              icon={<ListIcon className="h-5 w-5 text-primary" />}
              color={colors.primary}
            />
            <StatCard
              title={statsData?.grievances?.label || "Grievances"}
              value={statsData?.grievances?.count || 0}
              change={statsData?.grievances?.change || 0}
              icon={<AlertCircleIcon className="h-5 w-5 text-warning" />}
              color={colors.warning}
            />
            <StatCard
              title={statsData?.pending?.label || "Pending"}
              value={statsData?.pending?.count || 0}
              change={statsData?.pending?.change || 0}
              icon={<UserIcon className="h-5 w-5 text-secondary" />}
              color={colors.secondary}
            />
            <StatCard
              title={statsData?.escalated?.label || "Escalated"}
              value={statsData?.escalated?.count || 0}
              change={statsData?.escalated?.change || 0}
              icon={<AlertCircleIcon className="h-5 w-5 text-danger" />}
              color={colors.danger}
            />
          </>
        )}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Request volume for the past week</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isWeeklyLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData?.labels.map((label, i) => ({
                  name: label,
                  'Data Requests': weeklyData?.datasets[0].data[i] || 0,
                  'Grievances': weeklyData?.datasets[1].data[i] || 0,
                })) || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Data Requests" fill={colors.primary} />
                  <Bar dataKey="Grievances" fill={colors.warning} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current status of all requests</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isDistributionLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(distributionData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors.pieColors[index % colors.pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} requests`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Request Monitoring Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Request Monitoring</h3>
        <Tabs defaultValue="escalated" className="w-full" value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100/80">
            <TabsTrigger 
              value="escalated" 
              className="flex items-center data-[state=active]:bg-[#2E77AE] data-[state=active]:text-white"
            >
              <AlertCircleIcon className="h-4 w-4 mr-2 text-danger" />
              Escalated Requests
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="flex items-center data-[state=active]:bg-[#2E77AE] data-[state=active]:text-white"
            >
              <CalendarIcon className="h-4 w-4 mr-2 text-warning" />
              Upcoming Due
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="escalated">
            <Card>
              <CardHeader>
                <CardTitle>Escalated Requests</CardTitle>
                <CardDescription>Requests that require immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                {isEscalatedLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <DataTable 
                    columns={escaltedColumns} 
                    data={escalatedData || []} 
                    pagination={true}
                    searchField="subject"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Due Requests</CardTitle>
                <CardDescription>Requests with approaching deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                {isUpcomingLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <DataTable 
                    columns={upcomingColumns} 
                    data={upcomingData || []} 
                    pagination={true}
                    searchField="subject"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}