import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck, KeyRound, AlertCircle } from 'lucide-react';

// Schema for email verification
const emailSchema = z.object({
  email: z.string().email('Invalid email format')
});

// Schema for OTP verification
const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be at least 6 characters')
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OTPFormValues = z.infer<typeof otpSchema>;

export default function OTPAuthPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationInfo, setOrganizationInfo] = useState<{
    organizationId: number;
    organizationName: string;
  } | null>(null);

  // Form for email
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form for OTP verification
  const otpForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Load organization info
  useEffect(() => {
    async function loadOrganizationInfo() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/request-page/${token}`);
        
        if (!response.ok) {
          throw new Error('Invalid or expired request page URL');
        }
        
        const data = await response.json();
        setOrganizationInfo(data);
      } catch (error) {
        console.error('Error loading organization info:', error);
        setError((error as Error).message || 'Failed to load organization information');
        
        toast({
          title: 'Error',
          description: (error as Error).message || 'Failed to load organization information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadOrganizationInfo();
    }
  }, [token, toast]);

  // Handle email form submission
  const handleEmailSubmit = async (data: EmailFormValues) => {
    if (!organizationInfo) return;
    
    setSendingOTP(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/request-page/${organizationInfo.organizationId}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send OTP');
      }
      
      setOtpSent(true);
      
      toast({
        title: 'OTP Sent',
        description: `A verification code has been sent to ${data.email}`,
      });

      // Store email in session storage for OTP verification
      sessionStorage.setItem('requestPageEmail', data.email);
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError((error as Error).message || 'Failed to send OTP. Please try again.');
      
      toast({
        title: 'Failed to Send OTP',
        description: (error as Error).message || 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSendingOTP(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerify = async (data: OTPFormValues) => {
    if (!organizationInfo) return;
    
    setVerifyingOTP(true);
    setError(null);
    
    const email = sessionStorage.getItem('requestPageEmail');
    
    if (!email) {
      setError('Email information missing. Please try again.');
      setVerifyingOTP(false);
      setOtpSent(false);
      return;
    }
    
    try {
      const response = await fetch('/api/request-page/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: data.otp,
          organizationId: organizationInfo.organizationId
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to verify OTP');
      }
      
      // Store access token in session storage for authenticated request page access
      sessionStorage.setItem('requestPageAccessToken', result.accessToken);
      
      toast({
        title: 'Verification Successful',
        description: 'You can now submit your request',
      });
      
      // Redirect to the request page
      setLocation(`/request-page/${token}`);
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError((error as Error).message || 'Failed to verify OTP. Please try again.');
      
      toast({
        title: 'Verification Failed',
        description: (error as Error).message || 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingOTP(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organizationInfo) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <AlertCircle size={20} />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Invalid Request Page</AlertTitle>
              <AlertDescription>
                {error || 'The request page you are trying to access is invalid or has expired.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{organizationInfo.organizationName}</CardTitle>
          <CardDescription>
            {otpSent
              ? 'Enter the verification code sent to your email'
              : 'Enter your email to receive a verification code'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!otpSent ? (
            // Email form for sending OTP
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} disabled={sendingOTP} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={sendingOTP}>
                  {sendingOTP ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MailCheck className="mr-2 h-4 w-4" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            // OTP verification form
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleOTPVerify)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter the 6-digit code" 
                          {...field} 
                          disabled={verifyingOTP}
                          maxLength={6}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full" disabled={verifyingOTP}>
                    {verifyingOTP ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Verify
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setOtpSent(false)}
                    disabled={verifyingOTP || sendingOTP}
                  >
                    Back
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-xs text-muted-foreground text-center">
            This secure form allows you to submit data protection requests or grievances
            to {organizationInfo.organizationName}.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}