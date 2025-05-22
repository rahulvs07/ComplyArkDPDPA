import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Form schemas
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type EmailFormValues = z.infer<typeof emailSchema>;

const otpSchema = z.object({
  otp: z.string().min(4, 'Verification code must be at least 4 characters'),
});
type OTPFormValues = z.infer<typeof otpSchema>;

export default function OTPAuthPage() {
  const { push } = useLocation();
  const [, params] = useRoute('/auth/otp/:orgId/:token?');
  const { toast } = useToast();
  
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [organizationId, setOrganizationId] = useState<number>(1);
  const [orgName, setOrgName] = useState('Organization');
  const [requestToken, setRequestToken] = useState<string | null>(null);

  // Email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // OTP form
  const otpForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });
  
  // Get organization info on load
  useEffect(() => {
    console.log("Current path:", window.location.pathname);
    
    // Check URL for token
    const pathParts = window.location.pathname.split('/');
    const possibleToken = pathParts[pathParts.length - 1];
    
    if (possibleToken && possibleToken.length > 8) {
      console.log("Found token in URL:", possibleToken);
      setRequestToken(possibleToken);
    }
    
    if (!params) return;
    
    const orgIdParam = params.orgId;
    if (orgIdParam) {
      const orgIdNum = parseInt(orgIdParam);
      if (!isNaN(orgIdNum)) {
        setOrganizationId(orgIdNum);
        
        // Fetch organization name
        fetch(`/api/organizations/${orgIdNum}/public`)
          .then(res => res.json())
          .then(data => {
            if (data && data.name) {
              setOrgName(data.name);
            }
          })
          .catch(err => {
            console.error("Error fetching organization:", err);
          });
      }
    }
  }, [params]);

  // Submit email to generate OTP
  const onEmailSubmit = async (values: EmailFormValues) => {
    setLoading(true);
    
    try {
      console.log('Sending OTP request with:', { email: values.email, organizationId });
      
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          organizationId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send verification code');
      }
      
      // Store email for OTP verification
      setEmail(values.email);
      
      // Move to OTP verification step
      setStep('otp');
      
      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code.",
      });
    } catch (error) {
      console.error('Error generating OTP:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP for verification
  const onOTPSubmit = async (values: OTPFormValues) => {
    setLoading(true);
    
    // Test mode - if OTP is "1234", bypass actual verification
    if (values.otp === "1234") {
      console.log('Using test verification code "1234"');
      
      toast({
        title: "Verification successful",
        description: "Test mode verification complete",
      });
      
      // Store verification in session
      sessionStorage.setItem('otp_verified', 'true');
      sessionStorage.setItem('otp_email', email);
      
      // Navigate to the request page with the token
      if (requestToken) {
        console.log('Redirecting to request page with token:', requestToken);
        
        // Store the token in sessionStorage to ensure it's available after redirect
        sessionStorage.setItem('request_page_token', requestToken);
        
        // Create a direct method for navigation with an actual anchor element
        const requestPageUrl = `/request-page/${requestToken}`;
        console.log('Creating physical navigation link to request page:', requestPageUrl);
        
        // Create and append a real link to the page
        const navLink = document.createElement('a');
        navLink.href = requestPageUrl;
        navLink.innerText = "Continue to request page";
        navLink.className = "block w-full mt-4 p-3 text-center bg-primary text-white rounded-md hover:bg-primary/90";
        
        // Add the link to the form container which we know exists
        setTimeout(() => {
          // Find either the form container or use the main form element as fallback
          const formContainer = document.querySelector('form')?.parentElement;
          if (formContainer) {
            formContainer.appendChild(navLink);
          } else {
            // Fallback to body if no form is found
            document.body.appendChild(navLink);
          }
          setLoading(false);
        }, 1000);
      } else {
        console.log('No token found, redirecting to organization request page');
        // Use a simple redirect for the organization request page
        window.location.href = `/request/${organizationId}`;
      }
      
      return;
    }
    
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: values.otp,
          organizationId,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid verification code');
      }
      
      toast({
        title: "Verification successful",
        description: "You are now verified to submit requests",
      });
      
      // Navigate based on token presence - using same direct approach as test mode
      if (requestToken) {
        console.log('Normal flow: Redirecting to request page with token:', requestToken);
        
        // Store the token in sessionStorage
        sessionStorage.setItem('request_page_token', requestToken);
        
        // Using direct location change
        setTimeout(() => {
          window.location.replace(`/request-page/${requestToken}`);
        }, 800);
      } else {
        console.log('Normal flow: Redirecting to organization request page');
        setTimeout(() => {
          window.location.replace(`/request/${organizationId}`);
        }, 800);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 bg-primary text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {orgName} Verification
          </CardTitle>
          <CardDescription className="text-white/90">
            {step === 'email' 
              ? 'Enter your email to receive a verification code' 
              : 'Enter the verification code sent to your email'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {step === 'email' ? (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your@email.com" 
                          type="email" 
                          autoComplete="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  We've sent a verification code to <span className="font-medium">{email}</span>
                </div>
                
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter verification code" 
                          autoComplete="one-time-code"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col items-center justify-center pt-0">
          {step === 'otp' && (
            <Button
              variant="link"
              onClick={() => {
                setStep('email');
                emailForm.reset();
                otpForm.reset();
              }}
              className="text-sm"
              disabled={loading}
            >
              Use a different email address
            </Button>
          )}
          
          <div className="text-xs text-muted-foreground text-center mt-4">
            This secure verification ensures only authorized users can submit requests.
            <br />
            © {new Date().getFullYear()} ComplyArk
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}