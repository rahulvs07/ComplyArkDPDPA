import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldAlert, AlertCircle, AlertTriangle } from 'lucide-react';

interface RequestPageProps {}

interface Organization {
  id: number;
  name: string;
  token: string;
}

export default function RequestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dpr');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{message: string, id: number, type: string} | null>(null);
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  
  // Form submission handlers
  const handleDPRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organization) return;
    
    setIsSubmitting(true);
    setSubmitSuccess(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      const requestData = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        requestType: formData.get('requestType') as 'Access' | 'Correction' | 'Nomination' | 'Erasure',
        requestComment: formData.get('requestComment') as string,
        organizationId: organization.id
      };
      
      const response = await fetch('/api/dpr/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }
      
      const data = await response.json();
      setSubmitSuccess({
        message: data.message || 'Your data protection request has been submitted successfully.',
        id: data.requestId,
        type: 'dpr'
      });
      
      // Reset form
      e.currentTarget.reset();
      
    } catch (error) {
      console.error('Error submitting DP request:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGrievanceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organization) return;
    
    setIsSubmitting(true);
    setSubmitSuccess(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      const grievanceData = {
        firstName: formData.get('grievanceFirstName') as string,
        lastName: formData.get('grievanceLastName') as string,
        email: formData.get('grievanceEmail') as string,
        phone: formData.get('grievancePhone') as string,
        grievanceComment: formData.get('grievanceComments') as string,
        organizationId: organization.id
      };
      
      const response = await fetch('/api/grievance/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(grievanceData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit grievance');
      }
      
      const data = await response.json();
      setSubmitSuccess({
        message: data.message || 'Your grievance has been submitted successfully.',
        id: data.grievanceId,
        type: 'grievance'
      });
      
      // Reset form
      e.currentTarget.reset();
      
    } catch (error) {
      console.error('Error submitting grievance:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit grievance');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Check session storage for authentication flag from OTP process
    const checkSessionAuth = () => {
      const isVerified = sessionStorage.getItem('otp_verified');
      const verifiedEmail = sessionStorage.getItem('otp_email');
      if (isVerified === 'true' && verifiedEmail) {
        console.log('User is already verified via OTP:', verifiedEmail);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    };
    
    const fetchOrganization = async () => {
      // Try to get token from params or session storage
      const pageToken = token || sessionStorage.getItem('request_page_token');
      
      if (!pageToken) {
        setError('Invalid request page URL');
        setIsLoading(false);
        return;
      }

      // Check if user is already verified from OTP flow
      const isAlreadyVerified = checkSessionAuth();
      
      try {
        const response = await fetch(`/api/request-page/${pageToken}`);
        if (!response.ok) {
          throw new Error('Invalid or expired URL');
        }

        const data = await response.json();
        setOrganization({
          id: data.id,
          name: data.name,
          token: data.token
        });

        // Check if user is already authenticated
        const authCheckResponse = await fetch('/api/otp/check-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: data.id
          }),
        });

        const authData = await authCheckResponse.json();
        setIsAuthenticated(authData.authenticated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organization information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [token]);

  // Redirect to OTP verification if not authenticated
  useEffect(() => {
    // Always check session storage first
    const isVerified = sessionStorage.getItem('otp_verified') === 'true';
    const verifiedEmail = sessionStorage.getItem('otp_email');
    const storedToken = sessionStorage.getItem('request_page_token');
    
    // If we have verified status in session storage, use it
    if (isVerified && verifiedEmail && storedToken) {
      console.log('Session storage shows verified user:', verifiedEmail);
      setIsAuthenticated(true);
      return;
    }
    
    // Otherwise redirect to OTP verification
    if (!isLoading && !error && organization && !isAuthenticated) {
      console.log('Redirecting to OTP verification:', `/auth/otp/${organization.id}/${token}`);
      navigate(`/auth/otp/${organization.id}/${token}`);
    }
  }, [isLoading, error, organization, isAuthenticated, navigate, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-1" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 bg-rose-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-xl">Error</CardTitle>
            </div>
            <CardDescription className="text-white/90">
              We encountered a problem loading this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Invalid Request Page</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              This URL may be invalid or expired. Please contact the organization that provided you with this URL.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Return to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  // If not authenticated, the useEffect will handle the redirect to OTP page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Redirecting to Verification</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-primary">
              <span className="text-black">Comply</span>
              <span className="text-blue-600">Ark</span>
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Request Page for {organization.name}
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                {organization.name} Data Protection Portal
              </CardTitle>
              <CardDescription>
                This secure portal allows you to submit data protection requests or file a grievance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Successful</AlertTitle>
                <AlertDescription>
                  You have been verified and can now proceed with your request.
                </AlertDescription>
              </Alert>

              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="dpr">Data Protection Request</TabsTrigger>
                  <TabsTrigger value="grievance">File a Grievance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dpr" className="space-y-4">
                  <div className="rounded-lg border border-muted p-4">
                    <h3 className="font-medium text-lg mb-2">Submit a Data Protection Request</h3>
                    <p className="text-muted-foreground mb-4">
                      Use this form to exercise your rights under data protection regulations.
                    </p>
                    
                    {/* Data Protection Request Form */}
                    <div className="p-4 border rounded-md">
                      <h4 className="text-base font-medium mb-4">Submit Data Protection Request</h4>
                      
                      {(submitSuccess && submitSuccess.type === 'dpr') ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">Request Submitted Successfully!</h3>
                              <div className="mt-2 text-sm text-green-700">
                                <p>{submitSuccess.message}</p>
                                <p className="mt-1">Your reference number: <span className="font-medium">DPR-{submitSuccess.id}</span></p>
                              </div>
                              <div className="mt-4">
                                <Button variant="outline" size="sm" onClick={() => setSubmitSuccess(null)}>
                                  Submit Another Request
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form className="space-y-4" onSubmit={handleDPRequestSubmit}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="firstName" className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                              <input 
                                type="text" 
                                id="firstName" 
                                name="firstName"
                                required
                                className="w-full p-2 border rounded-md" 
                                placeholder="Enter your first name"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="lastName" className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                              <input 
                                type="text" 
                                id="lastName" 
                                name="lastName"
                                required
                                className="w-full p-2 border rounded-md" 
                                placeholder="Enter your last name"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="email" className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                              <input 
                                type="email" 
                                id="email" 
                                name="email"
                                required
                                className="w-full p-2 border rounded-md" 
                                placeholder="your@email.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="phone" className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                              <input 
                                type="tel" 
                                id="phone" 
                                name="phone"
                                required
                                className="w-full p-2 border rounded-md" 
                                placeholder="Your phone number"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="requestType" className="text-sm font-medium">Request Type <span className="text-red-500">*</span></label>
                            <select 
                              id="requestType" 
                              name="requestType"
                              required
                              className="w-full p-2 border rounded-md bg-white"
                            >
                              <option value="">Select a request type</option>
                              <option value="Access">Access</option>
                              <option value="Correction">Correction</option>
                              <option value="Nomination">Nomination</option>
                              <option value="Erasure">Erasure</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="requestComment" className="text-sm font-medium">Additional Information <span className="text-red-500">*</span></label>
                            <textarea 
                              id="requestComment" 
                              name="requestComment"
                              rows={4} 
                              required
                              className="w-full p-2 border rounded-md" 
                              placeholder="Please provide details about your request"
                            ></textarea>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" required className="rounded border-gray-300" />
                              <span className="text-sm">I confirm all information provided is accurate and complete</span>
                            </label>
                          </div>
                          
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
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
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="grievance" className="space-y-4">
                  <div className="rounded-lg border border-muted p-4">
                    <h3 className="font-medium text-lg mb-2">File a Grievance</h3>
                    <p className="text-muted-foreground mb-4">
                      Use this form to report any privacy-related concerns or complaints.
                    </p>
                    
                    {/* Grievance Form */}
                    <div className="p-4 border rounded-md">
                      <h4 className="text-base font-medium mb-4">Submit Grievance</h4>
                      
                      {submitSuccess && submitSuccess.type === 'grievance' ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">Grievance Submitted Successfully!</h3>
                              <div className="mt-2 text-sm text-green-700">
                                <p>{submitSuccess.message}</p>
                                <p className="mt-1">Your reference number: <span className="font-medium">GRV-{submitSuccess.id}</span></p>
                              </div>
                              <div className="mt-4">
                                <Button variant="outline" size="sm" onClick={() => setSubmitSuccess(null)}>
                                  Submit Another Grievance
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form className="space-y-4" onSubmit={handleGrievanceSubmit}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="grievanceFirstName" className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                              <input 
                                type="text" 
                                id="grievanceFirstName" 
                                name="grievanceFirstName"
                                required
                                className="w-full p-2 border rounded-md" 
                                placeholder="Enter your first name"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="grievanceLastName" className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                              <input 
                                type="text" 
                                id="grievanceLastName" 
                                name="grievanceLastName"
                                required
                                className="w-full p-2 border rounded-md" 
                                placeholder="Enter your last name"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="grievanceEmail" className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                              <input 
                                type="email" 
                                id="grievanceEmail" 
                                name="grievanceEmail"
                                required
                                className="w-full p-2 border rounded-md" 
                                placeholder="your@email.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="grievancePhone" className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                              <input 
                                type="tel" 
                                id="grievancePhone" 
                                name="grievancePhone"
                                required
                                className="w-full p-2 border rounded-md" 
                                placeholder="Your phone number"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="grievanceComments" className="text-sm font-medium">Grievance Comments <span className="text-red-500">*</span></label>
                            <textarea 
                              id="grievanceComments" 
                              name="grievanceComments"
                              rows={4} 
                              required
                              className="w-full p-2 border rounded-md" 
                              placeholder="Please describe your grievance in detail"
                            ></textarea>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" required className="rounded border-gray-300" name="grievanceConsent" />
                              <span className="text-sm">I confirm all information provided is accurate and complete</span>
                            </label>
                          </div>
                          
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
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
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="py-4 px-6 bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ComplyArk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}