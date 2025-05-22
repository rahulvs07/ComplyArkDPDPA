import { useEffect, useState } from 'react';
import { useLocation, useParams, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

// Define the form schema for data requests
const requestFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
  requestType: z.enum(["Access", "Correction", "Nomination", "Erasure"], {
    required_error: "Please select a request type.",
  }),
  requestComment: z.string().optional(),
});

// Define the form schema for grievances
const grievanceFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
  grievanceComment: z.string().min(10, {
    message: "Grievance details must be at least 10 characters.",
  }),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;
type GrievanceFormValues = z.infer<typeof grievanceFormSchema>;

export default function RequestPage() {
  const [, params] = useRoute('/request/:orgId/:type?');
  const { push } = useLocation();
  const { toast } = useToast();

  const [orgId, setOrgId] = useState<number | null>(null);
  const [orgName, setOrgName] = useState<string>('');
  const [requestType, setRequestType] = useState<'dpr' | 'grievance'>('dpr');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize form for data requests
  const requestForm = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      requestType: "Access",
      requestComment: "",
    },
  });

  // Initialize form for grievances
  const grievanceForm = useForm<GrievanceFormValues>({
    resolver: zodResolver(grievanceFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      grievanceComment: "",
    },
  });

  // Check if the user is authenticated and fetch organization info
  useEffect(() => {
    const checkAuth = async () => {
      if (!params) {
        toast({
          title: "Error",
          description: "Invalid request URL.",
          variant: "destructive",
        });
        return;
      }

      // Parse URL parameters
      const id = parseInt(params.orgId);
      if (isNaN(id)) {
        toast({
          title: "Error",
          description: "Invalid organization ID.",
          variant: "destructive",
        });
        return;
      }

      setOrgId(id);
      
      // Set request type from URL if provided
      if (params.type === 'grievance') {
        setRequestType('grievance');
      }

      try {
        // Check authentication status
        const authResponse = await fetch('/api/otp/check-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organizationId: id }),
        });

        const authData = await authResponse.json();
        
        if (authResponse.ok && authData.authenticated) {
          setIsAuthenticated(true);
          
          // Pre-populate email field with authenticated email
          requestForm.setValue('email', authData.email);
          grievanceForm.setValue('email', authData.email);
          
          // Fetch organization name
          const orgResponse = await fetch(`/api/organizations/${id}`);
          
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            setOrgName(orgData.name || 'Organization');
          } else {
            throw new Error('Failed to fetch organization information');
          }
        } else {
          // Redirect to OTP auth page if not authenticated
          push(`/auth/otp/${id}${params.type ? '/' + params.type : ''}`);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        toast({
          title: "Error",
          description: "Failed to verify authentication. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [params, push, toast, requestForm, grievanceForm]);

  // Submit request form
  const onRequestSubmit = async (data: RequestFormValues) => {
    if (!orgId) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/request/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          organizationId: orgId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }
      
      const responseData = await response.json();
      
      setSubmissionData(responseData);
      setSubmitted(true);
      
      toast({
        title: "Request submitted",
        description: "Your data protection request has been submitted successfully.",
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit grievance form
  const onGrievanceSubmit = async (data: GrievanceFormValues) => {
    if (!orgId) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/grievance/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          organizationId: orgId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit grievance');
      }
      
      const responseData = await response.json();
      
      setSubmissionData(responseData);
      setSubmitted(true);
      
      toast({
        title: "Grievance submitted",
        description: "Your grievance has been submitted successfully.",
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit grievance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show thank you page after submission
  if (submitted && submissionData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="space-y-1 bg-primary text-white rounded-t-lg text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Thank You!
            </CardTitle>
            <CardDescription className="text-white/90">
              Your {requestType === 'dpr' ? 'data protection request' : 'grievance'} has been submitted
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Reference Number</h3>
              <p className="text-xl font-mono">{submissionData.reference}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please save this reference number for future inquiries.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Submission Details</h3>
                <p className="text-sm text-muted-foreground">
                  We have received your {requestType === 'dpr' ? 'request' : 'grievance'} and our team will review it shortly.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm">{submissionData.firstName} {submissionData.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm">{submissionData.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm">{submissionData.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Submitted On</p>
                  <p className="text-sm">{new Date().toLocaleDateString()}</p>
                </div>
                {requestType === 'dpr' && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium">Request Type</p>
                    <p className="text-sm">{submissionData.requestType}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Clear form and reset states
                if (requestType === 'dpr') {
                  requestForm.reset();
                } else {
                  grievanceForm.reset();
                }
                setSubmitted(false);
                setSubmissionData(null);
              }}
            >
              Submit Another {requestType === 'dpr' ? 'Request' : 'Grievance'}
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} {orgName} | Powered by ComplyArk
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main request forms
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1 bg-primary text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {orgName}
            </CardTitle>
            
            <div className="flex space-x-2">
              <Button
                variant={requestType === 'dpr' ? "secondary" : "ghost"}
                className="text-white hover:text-primary"
                onClick={() => setRequestType('dpr')}
              >
                Data Request
              </Button>
              <Button
                variant={requestType === 'grievance' ? "secondary" : "ghost"}
                className="text-white hover:text-primary"
                onClick={() => setRequestType('grievance')}
              >
                Grievance
              </Button>
            </div>
          </div>
          <CardDescription className="text-white/90">
            {requestType === 'dpr' 
              ? 'Submit a data protection request to manage your personal information'
              : 'Submit a grievance regarding data protection or privacy concerns'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {requestType === 'dpr' ? (
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={requestForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} disabled={submitted} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={requestForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} disabled={submitted} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={requestForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john.doe@example.com"
                            type="email"
                            {...field}
                            disabled={true} // Always disabled because it comes from OTP auth
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={requestForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+01234567890" {...field} disabled={submitted} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={requestForm.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Request Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                          disabled={submitted}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Access" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Access - Request a copy of your personal data
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Correction" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Correction - Request to correct inaccurate data
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Nomination" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Nomination - Designate someone to exercise your rights
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Erasure" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Erasure - Request deletion of your personal data
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={requestForm.control}
                  name="requestComment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide any additional details about your request..."
                          className="resize-none min-h-[100px]"
                          {...field}
                          disabled={submitted}
                        />
                      </FormControl>
                      <FormDescription>
                        Please specify which data you are referring to and any other relevant information.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isSubmitting || submitted}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...grievanceForm}>
              <form onSubmit={grievanceForm.handleSubmit(onGrievanceSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={grievanceForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} disabled={submitted} />
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
                          <Input placeholder="Doe" {...field} disabled={submitted} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={grievanceForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john.doe@example.com"
                            type="email"
                            {...field}
                            disabled={true} // Always disabled because it comes from OTP auth
                          />
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
                          <Input placeholder="+01234567890" {...field} disabled={submitted} />
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
                          placeholder="Please describe your grievance in detail..."
                          className="resize-none min-h-[150px]"
                          {...field}
                          disabled={submitted}
                        />
                      </FormControl>
                      <FormDescription>
                        Please provide specific information about your grievance, including dates, times, and any other relevant details.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isSubmitting || submitted}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Grievance"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <div className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} {orgName} | Powered by ComplyArk
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}