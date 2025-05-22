import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineIcon,
  TimelineTitle,
  TimelineBody,
} from '@/components/ui/timeline';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { getStatusColor } from '@/lib/utils';
import { format } from 'date-fns';

const DPRequestDetail = () => {
  const [, params] = useRoute('/dpr/:id');
  const { user } = useAuth();
  const requestId = params?.id ? parseInt(params.id, 10) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [closureComments, setClosureComments] = useState('');
  const [currentStatus, setCurrentStatus] = useState<number | null>(null);

  // Fetch request details
  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['/api/dpr', requestId],
    enabled: !!requestId,
  });

  // Fetch request history
  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/dpr', requestId, 'history'],
    enabled: !!requestId,
  });

  // Fetch request statuses
  const { data: statuses } = useQuery({
    queryKey: ['/api/request-statuses'],
  });

  // Fetch users for assignment
  const { data: users } = useQuery({
    queryKey: ['/api/organizations', user?.organizationId, 'users'],
    enabled: !!user?.organizationId,
  });

  // Update request mutation
  const updateRequest = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/dpr/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Request updated',
        description: 'The request has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dpr', requestId] });
      queryClient.invalidateQueries({ queryKey: ['/api/dpr', requestId, 'history'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update request. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating request:', error);
    },
  });

  useEffect(() => {
    if (request) {
      setCurrentStatus(request.statusId);
    }
  }, [request]);

  if (isLoadingRequest || !request) {
    return <div className="container p-4">Loading request details...</div>;
  }

  const isRequestClosed = request.statusId === 27; // Assuming 27 is the ID for Closed status
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'PPP');
  };

  const handleStatusChange = (value: string) => {
    const statusId = parseInt(value, 10);
    setCurrentStatus(statusId);
  };

  const handleSubmit = () => {
    const isClosed = currentStatus === 27; // Check if status is now "Closed"
    
    if (isClosed && !closureComments) {
      toast({
        title: 'Closure comments required',
        description: 'Please provide closure comments before closing the request.',
        variant: 'destructive',
      });
      return;
    }

    const updateData: any = {
      statusId: currentStatus,
      comment: comment,
    };

    if (isClosed) {
      updateData.closureComments = closureComments;
    }

    updateRequest.mutate(updateData);
  };

  return (
    <div className="container p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Request #{requestId}</h1>
        <Link href="/dpr">
          <Button variant="outline">Back to Requests</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Request Details</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
              <TabsTrigger value="workflow" className="flex-1">Workflow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Request Information</CardTitle>
                  <CardDescription>Details of the data principal request</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Request Type</Label>
                      <div className="text-sm font-medium mt-1">{request.requestType}</div>
                    </div>
                    <div>
                      <Label>Current Status</Label>
                      <div className="mt-1">
                        <Badge variant="outline" className={getStatusColor(request.statusId, statuses)}>
                          {statuses?.find(s => s.statusId === request.statusId)?.statusName || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Requester Name</Label>
                      <div className="text-sm font-medium mt-1">{request.firstName} {request.lastName}</div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <div className="text-sm font-medium mt-1">{request.email}</div>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <div className="text-sm font-medium mt-1">{request.phone}</div>
                    </div>
                    <div>
                      <Label>Created At</Label>
                      <div className="text-sm font-medium mt-1">{formatDate(request.createdAt)}</div>
                    </div>
                    <div>
                      <Label>Estimated Completion</Label>
                      <div className="text-sm font-medium mt-1">{formatDate(request.completionDate)}</div>
                    </div>
                    <div>
                      <Label>Closed At</Label>
                      <div className="text-sm font-medium mt-1">{formatDate(request.closedDateTime)}</div>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Request Comment</Label>
                      <div className="text-sm font-medium mt-1 p-2 border rounded-md min-h-10">
                        {request.requestComment || 'No comment provided'}
                      </div>
                    </div>
                    {request.closureComments && (
                      <div className="md:col-span-2">
                        <Label>Closure Comments</Label>
                        <div className="text-sm font-medium mt-1 p-2 border rounded-md min-h-10">
                          {request.closureComments}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Request History</CardTitle>
                  <CardDescription>Tracking changes to this request</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div>Loading history...</div>
                  ) : history && history.length > 0 ? (
                    <Timeline>
                      {history.map((item: any, index: number) => (
                        <TimelineItem key={item.historyId}>
                          {index < history.length - 1 && <TimelineConnector />}
                          <TimelineHeader>
                            <TimelineIcon />
                            <TimelineTitle>{formatDate(item.changeDate)}</TimelineTitle>
                          </TimelineHeader>
                          <TimelineBody className="mt-2">
                            <div className="ml-6 space-y-2">
                              {item.oldStatusId !== item.newStatusId && (
                                <p>
                                  Status changed from{' '}
                                  <Badge variant="outline" className={getStatusColor(item.oldStatusId, statuses)}>
                                    {statuses?.find(s => s.statusId === item.oldStatusId)?.statusName || 'Previous status'}
                                  </Badge>
                                  {' '}to{' '}
                                  <Badge variant="outline" className={getStatusColor(item.newStatusId, statuses)}>
                                    {statuses?.find(s => s.statusId === item.newStatusId)?.statusName || 'New status'}
                                  </Badge>
                                </p>
                              )}
                              {item.comments && (
                                <div className="text-sm p-2 bg-muted rounded-md">
                                  <span className="font-bold">Comment:</span> {item.comments}
                                </div>
                              )}
                            </div>
                          </TimelineBody>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  ) : (
                    <div className="text-center p-4">No history records found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="workflow">
              <Card>
                <CardHeader>
                  <CardTitle>Request Workflow</CardTitle>
                  <CardDescription>Visual representation of the request flow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    {history && statuses && (
                      <div className="w-full max-w-md">
                        <ul className="relative border-l border-gray-200 dark:border-gray-700">
                          {history.map((item: any, index: number) => (
                            <li key={item.historyId} className="mb-10 ml-6">
                              <span className="absolute flex items-center justify-center w-6 h-6 bg-primary rounded-full -left-3">
                                <span className="text-white text-xs">{index + 1}</span>
                              </span>
                              <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  <p className="font-bold">
                                    {formatDate(item.changeDate)} - {users?.find(u => u.id === item.changedByUserId)?.firstName || 'User'} {users?.find(u => u.id === item.changedByUserId)?.lastName || ''}
                                  </p>
                                  {item.oldStatusId !== item.newStatusId && (
                                    <p className="mt-2">
                                      Status changed to{' '}
                                      <Badge variant="outline" className={getStatusColor(item.newStatusId, statuses)}>
                                        {statuses?.find(s => s.statusId === item.newStatusId)?.statusName || 'New status'}
                                      </Badge>
                                    </p>
                                  )}
                                  {item.comments && (
                                    <p className="mt-2">Comment: {item.comments}</p>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Update Request</CardTitle>
              <CardDescription>
                {isRequestClosed 
                  ? "This request is closed and cannot be modified." 
                  : "Change request status and provide comments"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isRequestClosed ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={currentStatus?.toString() || ''}
                      onValueChange={handleStatusChange}
                      disabled={isRequestClosed}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses?.map((status: any) => (
                          <SelectItem key={status.statusId} value={status.statusId.toString()}>
                            {status.statusName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      placeholder="Add a comment about this update"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={isRequestClosed}
                    />
                  </div>
                  
                  {currentStatus === 27 && ( // Only show closure comments when status is "Closed"
                    <div>
                      <Label htmlFor="closureComments" className="text-red-500">Closure Comments (Required)</Label>
                      <Textarea
                        id="closureComments"
                        placeholder="Please provide closure comments"
                        value={closureComments}
                        onChange={(e) => setClosureComments(e.target.value)}
                        className="border-red-200"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted p-3 rounded-md text-center">
                  <p>This request has been closed and cannot be modified.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={handleSubmit} 
                disabled={isRequestClosed || updateRequest.isPending}
              >
                {updateRequest.isPending ? 'Updating...' : 'Update Request'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DPRequestDetail;