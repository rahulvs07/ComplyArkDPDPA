import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { useLocation } from 'wouter';
import { ExceptionLog } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Clock, Search, XCircle } from 'lucide-react';

const ExceptionLogs = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ExceptionLog | null>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);

  // Fetch exception logs
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/exceptions', page, limit, status, severity],
    queryFn: async () => {
      let url = `/api/exceptions?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      if (severity) url += `&severity=${severity}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch exception logs');
      }
      return response.json();
    }
  });

  // Fetch individual log details
  const fetchLogDetails = async (id: number) => {
    const response = await fetch(`/api/exceptions/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exception log details');
    }
    const data = await response.json();
    setSelectedLog(data);
  };

  // Update log status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLog) return;
      
      const response = await fetch(`/api/exceptions/${selectedLog.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          additionalInfo: statusNotes
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update exception log status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exceptions'] });
      setStatusUpdateDialog(false);
      setStatusNotes('');
      toast({
        title: 'Status updated',
        description: `Exception log status has been updated to ${newStatus}`,
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Delete log mutation
  const deleteLogMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLog) return;
      
      const response = await fetch(`/api/exceptions/${selectedLog.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete exception log');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exceptions'] });
      setDeleteConfirmDialog(false);
      setSelectedLog(null);
      toast({
        title: 'Log deleted',
        description: 'Exception log has been deleted successfully',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete log: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">New</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'ignored':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Ignored</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Severity badge renderer
  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">High</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  // Status icon renderer
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ignored':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Open status update dialog
  const openStatusUpdateDialog = (log: ExceptionLog) => {
    setSelectedLog(log);
    setNewStatus(log.status);
    setStatusUpdateDialog(true);
  };

  // Open delete confirm dialog
  const openDeleteConfirmDialog = (log: ExceptionLog) => {
    setSelectedLog(log);
    setDeleteConfirmDialog(true);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Exception Logs</h1>
          <div className="flex space-x-2">
            <Select value={status || ''} onValueChange={(value) => setStatus(value || null)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severity || ''} onValueChange={(value) => setSeverity(value || null)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="text-center text-red-500">
                <p>Failed to load exception logs. Please try again.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <CardContent className="pt-6">
                {data?.logs?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Page Name</TableHead>
                        <TableHead>Function</TableHead>
                        <TableHead>Error Message</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.logs.map((log: ExceptionLog) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.id}</TableCell>
                          <TableCell>{log.pageName}</TableCell>
                          <TableCell>{log.functionName}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.errorMessage}
                          </TableCell>
                          <TableCell>{renderSeverityBadge(log.severity)}</TableCell>
                          <TableCell>{renderStatusBadge(log.status)}</TableCell>
                          <TableCell>{formatDate(log.createdAt.toString())}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchLogDetails(log.id)}
                              >
                                <Search className="h-4 w-4 mr-1" /> View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p>No exception logs found.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {data?.pagination && (
              <div className="flex justify-between items-center mt-4">
                <div>
                  <span className="text-sm text-gray-600">
                    Showing {data.logs.length} of {data.pagination.total} results
                  </span>
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

        {/* Exception Log Details Dialog */}
        <Dialog open={!!selectedLog && !statusUpdateDialog && !deleteConfirmDialog} onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedLog && renderStatusIcon(selectedLog.status)}
                <span className="ml-2">Exception Log Details</span>
              </DialogTitle>
              <DialogDescription>
                Detailed information about the exception.
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="mt-4">
                <Tabs defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="stacktrace">Stack Trace</TabsTrigger>
                    <TabsTrigger value="browser">Browser Info</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">ID</p>
                        <p>{selectedLog.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date & Time</p>
                        <p>{formatDate(selectedLog.createdAt.toString())}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Page Name</p>
                        <p>{selectedLog.pageName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Function Name</p>
                        <p>{selectedLog.functionName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Severity</p>
                        <p>{renderSeverityBadge(selectedLog.severity)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <p>{renderStatusBadge(selectedLog.status)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-500">Error Message</p>
                        <p className="whitespace-pre-wrap">{selectedLog.errorMessage}</p>
                      </div>
                      {selectedLog.url && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-500">URL</p>
                          <p className="break-all">{selectedLog.url}</p>
                        </div>
                      )}
                      {selectedLog.additionalInfo && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-500">Additional Info</p>
                          <p className="whitespace-pre-wrap">{selectedLog.additionalInfo}</p>
                        </div>
                      )}
                      {selectedLog.resolvedAt && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-500">Resolved At</p>
                          <p>{formatDate(selectedLog.resolvedAt.toString())}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stacktrace" className="mt-4">
                    {selectedLog.stackTrace ? (
                      <div className="bg-gray-100 p-4 rounded-md">
                        <pre className="whitespace-pre-wrap text-xs">{selectedLog.stackTrace}</pre>
                      </div>
                    ) : (
                      <p>No stack trace available</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="browser" className="mt-4">
                    {selectedLog.browserInfo ? (
                      <div className="bg-gray-100 p-4 rounded-md">
                        <pre className="whitespace-pre-wrap">{selectedLog.browserInfo}</pre>
                      </div>
                    ) : (
                      <p>No browser information available</p>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-3 mt-6">
                  {selectedLog.status !== 'resolved' && selectedLog.status !== 'ignored' && (
                    <Button variant="default" onClick={() => openStatusUpdateDialog(selectedLog)}>
                      Update Status
                    </Button>
                  )}
                  <Button variant="destructive" onClick={() => openDeleteConfirmDialog(selectedLog)}>
                    Delete Log
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Exception Status</DialogTitle>
              <DialogDescription>
                Change the status of this exception log and add notes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add notes about this status change"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusUpdateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => updateStatusMutation.mutate()}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this exception log? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteLogMutation.mutate()}
                disabled={deleteLogMutation.isPending}
              >
                {deleteLogMutation.isPending ? 'Deleting...' : 'Delete Log'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default ExceptionLogs;