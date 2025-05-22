import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

// Schema for status check form
const statusCheckSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  email: z.string().email('Invalid email format'),
  requestType: z.enum(['dpRequest', 'grievance'], {
    required_error: 'Please select request type',
  }),
});

type StatusCheckFormValues = z.infer<typeof statusCheckSchema>;

interface RequestStatus {
  requestId: number;
  status: string;
  lastUpdated: string;
  type: string;
}

export default function RequestStatusPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form for status check
  const form = useForm<StatusCheckFormValues>({
    resolver: zodResolver(statusCheckSchema),
    defaultValues: {
      requestId: '',
      email: '',
      requestType: 'dpRequest',
    },
  });
  
  // Handle status check submission
  const handleStatusCheck = async (data: StatusCheckFormValues) => {
    setChecking(true);
    setError(null);
    setRequestStatus(null);
    
    try {
      const queryParams = new URLSearchParams({
        id: data.requestId,
        email: data.email,
        type: data.requestType,
      });
      
      const response = await fetch(`/api/request-page/status?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to check request status');
      }
      
      setRequestStatus(result);
      
      toast({
        title: 'Status Retrieved',
        description: 'The request status has been retrieved successfully.',
      });
    } catch (error) {
      console.error('Error checking status:', error);
      setError((error as Error).message || 'Failed to check status. Please verify your reference number and email.');
      
      toast({
        title: 'Status Check Failed',
        description: (error as Error).message || 'Failed to check status. Please verify your details.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };
  
  // Navigate back to request form
  const handleBackToForm = () => {
    setLocation('/');
  };
  
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Check Request Status</CardTitle>
          <CardDescription>
            Enter your reference number and email to check the status of your request or grievance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {requestStatus ? (
            <div className="space-y-6">
              <Alert variant="default" className="bg-muted">
                <div className="flex items-center space-x-2">
                  {requestStatus.status === 'Completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-500" />
                  )}
                  <AlertTitle>
                    {requestStatus.type} Status: <span className="font-bold">{requestStatus.status}</span>
                  </AlertTitle>
                </div>
                <AlertDescription className="mt-2">
                  <div className="text-sm space-y-2">
                    <p><span className="font-medium">Reference Number:</span> {requestStatus.requestId}</p>
                    <p><span className="font-medium">Last Updated:</span> {new Date(requestStatus.lastUpdated).toLocaleString()}</p>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  If you have any questions about your request, please contact the organization directly
                  with your reference number.
                </p>
              </div>
              
              <Button onClick={() => setRequestStatus(null)} variant="outline" className="w-full">
                Check Another Request
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleStatusCheck)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="requestId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your reference number" {...field} disabled={checking} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} disabled={checking} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Request Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-6"
                          disabled={checking}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="dpRequest" />
                            </FormControl>
                            <FormLabel className="font-normal">Data Protection Request</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="grievance" />
                            </FormControl>
                            <FormLabel className="font-normal">Grievance</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={checking}>
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBackToForm}>
            Back to Request Form
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}