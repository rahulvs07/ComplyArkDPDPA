import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle, KeyRound, ExternalLink } from 'lucide-react';

// Schema for data protection request form
const dpRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  requestType: z.enum(['Access', 'Correction', 'Nomination', 'Erasure'], {
    required_error: 'Please select a request type',
  }),
  requestComment: z.string().optional(),
  submissionType: z.literal('dpRequest'),
});

// Schema for grievance form
const grievanceSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  grievanceComment: z.string().min(1, 'Please describe your grievance'),
  submissionType: z.literal('grievance'),
});

type DPRequestFormValues = z.infer<typeof dpRequestSchema>;
type GrievanceFormValues = z.infer<typeof grievanceSchema>;

export default function RequestPage() {
  const [location, setLocation] = useLocation();
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [submissionType, setSubmissionType] = useState<'dpRequest' | 'grievance' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [organizationInfo, setOrganizationInfo] = useState<{
    organizationId: number;
    organizationName: string;
  } | null>(null);
  
  // Check for authentication token when component mounts
  useEffect(() => {
    async function checkAuthentication() {
      setLoading(true);
      setError(null);
      
      try {
        // Get organization info first
        const orgResponse = await fetch(`/api/request-page/${token}`);
        
        if (!orgResponse.ok) {
          throw new Error('Invalid or expired request page URL');
        }
        
        const orgData = await orgResponse.json();
        setOrganizationInfo(orgData);
        
        // Check for authentication token in session storage
        const accessToken = sessionStorage.getItem('requestPageAccessToken');
        const email = sessionStorage.getItem('requestPageEmail');
        
        if (!accessToken || !email) {
          // Not authenticated - redirect to auth page
          setLocation(`/request-page/${token}/auth`);
          return;
        }
        
        setAuthenticated(true);
      } catch (error) {
        console.error('Error loading page:', error);
        setError((error as Error).message || 'Failed to load request page');
        
        toast({
          title: 'Error',
          description: (error as Error).message || 'Failed to load request page',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    checkAuthentication();
  }, [token, toast, setLocation]);
  
  // Form for data protection requests
  const dpRequestForm = useForm<DPRequestFormValues>({
    resolver: zodResolver(dpRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      requestComment: '',
      submissionType: 'dpRequest',
    },
  });
  
  // Form for grievances
  const grievanceForm = useForm<GrievanceFormValues>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      grievanceComment: '',
      submissionType: 'grievance',
    },
  });
  
  // Handle DP request submission
  const handleDPRequestSubmit = async (data: DPRequestFormValues) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/request-page/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit request');
      }
      
      setSuccess(true);
      setSubmissionId(result.requestId);
      setSubmissionType('dpRequest');
      
      toast({
        title: 'Request Submitted',
        description: 'Your data protection request has been submitted successfully.',
      });
    } catch (error) {
      console.error('Error submitting DP request:', error);
      setError((error as Error).message || 'Failed to submit request. Please try again later.');
      
      toast({
        title: 'Submission Failed',
        description: (error as Error).message || 'Failed to submit request. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle grievance submission
  const handleGrievanceSubmit = async (data: GrievanceFormValues) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/request-page/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit grievance');
      }
      
      setSuccess(true);
      setSubmissionId(result.grievanceId);
      setSubmissionType('grievance');
      
      toast({
        title: 'Grievance Submitted',
        description: 'Your grievance has been submitted successfully.',
      });
    } catch (error) {
      console.error('Error submitting grievance:', error);
      setError((error as Error).message || 'Failed to submit grievance. Please try again later.');
      
      toast({
        title: 'Submission Failed',
        description: (error as Error).message || 'Failed to submit grievance. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Check request status
  const handleCheckStatus = () => {
    setLocation('/request-status');
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error if not authenticated or other errors
  if (!authenticated || !organizationInfo) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <AlertCircle size={20} />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                {error || 'Authentication is required to access this form. Please verify your email.'}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setLocation(`/request-page/${token}/auth`)} 
              className="w-full"
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Go to Verification Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If submission was successful, show success message and tracking info
  if (success && submissionId) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Submission Successful</CardTitle>
            </div>
            <CardDescription>
              Your {submissionType === 'dpRequest' ? 'data protection request' : 'grievance'} has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4 bg-muted/30">
              <h3 className="font-medium text-sm mb-2">Reference Number</h3>
              <p className="text-lg font-bold">{submissionId}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please save this reference number to check the status of your request.
              </p>
            </div>
            
            <Alert>
              <AlertTitle>What happens next?</AlertTitle>
              <AlertDescription>
                Your submission will be reviewed by {organizationInfo.organizationName}. You can check the status of your request
                at any time using your reference number and email address.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCheckStatus} className="w-full">
              Check Request Status
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Main form display (authenticated)
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{organizationInfo.organizationName} - Request Form</CardTitle>
          <CardDescription>
            Use this form to submit data protection requests or grievances to {organizationInfo.organizationName}.
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
          
          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="request">Data Protection Request</TabsTrigger>
              <TabsTrigger value="grievance">Grievance</TabsTrigger>
            </TabsList>
            
            {/* Data Protection Request Form */}
            <TabsContent value="request">
              <Form {...dpRequestForm}>
                <form onSubmit={dpRequestForm.handleSubmit(handleDPRequestSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={dpRequestForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} disabled={submitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={dpRequestForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} disabled={submitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={dpRequestForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} disabled={submitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={dpRequestForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} disabled={submitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={dpRequestForm.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Request Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                            disabled={submitting}
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Access" />
                              </FormControl>
                              <FormLabel className="font-normal">Access</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Correction" />
                              </FormControl>
                              <FormLabel className="font-normal">Correction</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Erasure" />
                              </FormControl>
                              <FormLabel className="font-normal">Erasure</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Nomination" />
                              </FormControl>
                              <FormLabel className="font-normal">Nomination</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={dpRequestForm.control}
                    name="requestComment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide additional details about your request"
                            className="min-h-[120px]"
                            {...field}
                            disabled={submitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Grievance Form */}
            <TabsContent value="grievance">
              <Form {...grievanceForm}>
                <form onSubmit={grievanceForm.handleSubmit(handleGrievanceSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={grievanceForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} disabled={submitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={grievanceForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} disabled={submitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={grievanceForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} disabled={submitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={grievanceForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} disabled={submitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={grievanceForm.control}
                    name="grievanceComment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grievance Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please describe your grievance in detail"
                            className="min-h-[150px]"
                            {...field}
                            disabled={submitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Grievance'
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCheckStatus}>
            Check Request Status
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}