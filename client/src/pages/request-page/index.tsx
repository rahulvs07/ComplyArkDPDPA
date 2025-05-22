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
    const fetchOrganization = async () => {
      if (!token) {
        setError('Invalid request page URL');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/request-page/${token}`);
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
    if (!isLoading && !error && organization && !isAuthenticated) {
      navigate(`/auth/otp/${organization.id}`);
    }
  }, [isLoading, error, organization, isAuthenticated, navigate]);

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
                    
                    {/* This will be replaced with the actual DPR form */}
                    <div className="bg-muted/40 rounded-md p-4 text-center">
                      <p className="text-muted-foreground">Data Protection Request Form will appear here</p>
                      <Button className="mt-4">Continue to Form</Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="grievance" className="space-y-4">
                  <div className="rounded-lg border border-muted p-4">
                    <h3 className="font-medium text-lg mb-2">File a Grievance</h3>
                    <p className="text-muted-foreground mb-4">
                      If you have a complaint regarding your data or privacy, use this form to submit a grievance.
                    </p>
                    
                    {/* This will be replaced with the actual grievance form */}
                    <div className="bg-muted/40 rounded-md p-4 text-center">
                      <p className="text-muted-foreground">Grievance Form will appear here</p>
                      <Button className="mt-4">Continue to Form</Button>
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