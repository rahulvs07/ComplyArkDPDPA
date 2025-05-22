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
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();

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
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                            <input 
                              type="text" 
                              id="fullName" 
                              className="w-full p-2 border rounded-md" 
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="dprType" className="text-sm font-medium">Request Type</label>
                            <select 
                              id="dprType" 
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="">Select request type</option>
                              <option value="access">Access Request</option>
                              <option value="correction">Correction Request</option>
                              <option value="deletion">Deletion Request</option>
                              <option value="objection">Objection</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="description" className="text-sm font-medium">Request Details</label>
                          <textarea 
                            id="description" 
                            rows={4} 
                            className="w-full p-2 border rounded-md" 
                            placeholder="Please describe your request in detail"
                          ></textarea>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded border-gray-300" />
                            <span className="text-sm">I confirm that I am the data subject or authorized to make this request</span>
                          </label>
                        </div>
                        
                        <Button type="submit" className="w-full">Submit Request</Button>
                      </form>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="grievance" className="space-y-4">
                  <div className="rounded-lg border border-muted p-4">
                    <h3 className="font-medium text-lg mb-2">File a Grievance</h3>
                    <p className="text-muted-foreground mb-4">
                      If you have a complaint regarding your data or privacy, use this form to submit a grievance.
                    </p>
                    
                    {/* Grievance Form */}
                    <div className="p-4 border rounded-md">
                      <h4 className="text-base font-medium mb-4">Submit Grievance</h4>
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="complainantName" className="text-sm font-medium">Full Name</label>
                            <input 
                              type="text" 
                              id="complainantName" 
                              className="w-full p-2 border rounded-md" 
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="grievanceType" className="text-sm font-medium">Grievance Type</label>
                            <select 
                              id="grievanceType" 
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="">Select grievance type</option>
                              <option value="privacy">Privacy Violation</option>
                              <option value="consent">Consent Issue</option>
                              <option value="breach">Data Breach</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="incidentDate" className="text-sm font-medium">Incident Date</label>
                          <input 
                            type="date" 
                            id="incidentDate" 
                            className="w-full p-2 border rounded-md"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="grievanceDescription" className="text-sm font-medium">Grievance Details</label>
                          <textarea 
                            id="grievanceDescription" 
                            rows={4} 
                            className="w-full p-2 border rounded-md" 
                            placeholder="Please describe your grievance in detail"
                          ></textarea>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="expectedResolution" className="text-sm font-medium">Expected Resolution</label>
                          <textarea 
                            id="expectedResolution" 
                            rows={2} 
                            className="w-full p-2 border rounded-md" 
                            placeholder="What outcome are you seeking?"
                          ></textarea>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded border-gray-300" />
                            <span className="text-sm">I confirm all information provided is accurate to the best of my knowledge</span>
                          </label>
                        </div>
                        
                        <Button type="submit" className="w-full">Submit Grievance</Button>
                      </form>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ComplyArk. All rights reserved.</p>
          <p className="mt-1">
            This is a secure portal for data protection requests. Your information is encrypted and protected.
          </p>
        </div>
      </footer>
    </div>
  );
}