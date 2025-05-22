import { useState, useEffect } from 'react';
import { useLocation, useParams, useRoute } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle, ChevronRight, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import MicrosoftLoginButton from '@/components/auth/MicrosoftLoginButton';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Schema for email input
const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

// Schema for OTP input
const otpSchema = z.object({
  otp: z
    .string()
    .min(4, 'OTP code must be at least 4 characters')
    .max(6, 'OTP code must be at most 6 characters'),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OTPFormValues = z.infer<typeof otpSchema>;

export default function OTPVerificationPage() {
  const [, params] = useRoute('/otp-verification/:token');
  const [, requestPageParams] = useRoute('/request-page/:token');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<{ id: number; name: string } | null>(null);
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  
  // Get token from either route
  const token = params?.token || requestPageParams?.token;
  
  // Fetch organization from token
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!token) {
        setError('Invalid URL. Please check the link and try again.');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("Fetching organization with token:", token);
        const response = await fetch(`/api/request-page/${token}`);
        
        if (!response.ok) {
          throw new Error('Invalid or expired token');
        }
        
        const data = await response.json();
        setOrganization({
          id: data.id,
          name: data.name || data.businessName || 'Organization'
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
        
        if (authData.authenticated) {
          setVerified(true);
          setEmail(authData.email);
          // Store authenticated status in session storage
          sessionStorage.setItem('otp_verified', 'true');
          sessionStorage.setItem('otp_email', authData.email);
          console.log('User is already verified via OTP:', authData.email);
        } else {
          // Check session storage as fallback
          const storedVerified = sessionStorage.getItem('otp_verified');
          const storedEmail = sessionStorage.getItem('otp_email');
          
          if (storedVerified === 'true' && storedEmail) {
            setVerified(true);
            setEmail(storedEmail);
            console.log('Session storage shows verified user:', storedEmail);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organization information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrganization();
  }, [params]);
  
  // Form for email input
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
  
  // Handle email submission
  const onEmailSubmit = async (data: EmailFormValues) => {
    if (!organization) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          organizationId: organization.id,
          organizationName: organization.name,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send OTP code');
      }
      
      const responseData = await response.json();
      
      setEmail(data.email);
      setStep('verify');
      setExpiresAt(new Date(responseData.expiresAt));
      
      toast({
        title: 'OTP Sent',
        description: `We've sent a verification code to ${data.email}. For testing, use "1234".`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send OTP code',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle OTP verification
  const onOTPSubmit = async (data: OTPFormValues) => {
    if (!organization) return;
    
    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: data.otp,
          organizationId: organization.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid OTP code');
      }
      
      const responseData = await response.json();
      
      setVerified(true);
      
      // Store authenticated status in session storage as a fallback
      sessionStorage.setItem('otp_verified', 'true');
      sessionStorage.setItem('otp_email', email);
      
      toast({
        title: 'Verification Successful',
        description: 'You can now submit your request.',
      });
      
      // Store token for verification on request page
      sessionStorage.setItem('request_page_token', params?.token || '');
      
      // Navigate to request form page (using a different route)
      navigate(`/request-form/${params?.token}`);
    } catch (err) {
      toast({
        title: 'Verification Failed',
        description: err instanceof Error ? err.message : 'Failed to verify OTP code',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-2" />
          <h1 className="text-xl font-semibold">Loading...</h1>
          <p className="text-muted-foreground">Verifying your request page</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 bg-rose-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-xl">Error</CardTitle>
            </div>
            <CardDescription className="text-white/90">
              We encountered a problem loading this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
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
  
  // Show already verified status
  if (verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 bg-green-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <CardTitle className="text-xl">Already Verified</CardTitle>
            </div>
            <CardDescription className="text-white/90">
              You're already verified and can proceed
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Verification Successful</AlertTitle>
              <AlertDescription>
                You are verified as {email}. You can now continue to the request page.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary-600 hover:bg-primary-700"
              onClick={() => navigate(`/request-form/${token}`)}
            >
              Continue to Request Page
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Show email form or OTP verification form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 bg-primary-600 text-white rounded-t-lg">
          <div className="flex flex-col items-center mb-4">
            <div className="bg-white rounded-full p-3 mb-2">
              <ShieldCheck className="h-8 w-8 text-primary-600" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">ComplyArk</h2>
              <p className="text-sm text-white/80">Privacy Request Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">
              {organization?.name ? `${organization.name}` : 'Organization'} 
            </CardTitle>
          </div>
          
          <CardDescription className="text-white/90 mt-1">
            {step === 'email'
              ? 'Please verify your email to continue to the request page'
              : `Enter the verification code sent to ${email}`}
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
                        <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white">
                          <Mail className="ml-2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your email address"
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        We'll send a verification code to this email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
                
                {organization && (
                  <>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <GoogleLoginButton 
                        onSuccess={(email) => {
                          setVerified(true);
                          setEmail(email);
                          navigate(`/request-form/${token}`);
                        }}
                        organizationId={organization.id}
                      />
                      
                      <MicrosoftLoginButton
                        onSuccess={(email) => {
                          setVerified(true);
                          setEmail(email);
                          navigate(`/request-form/${token}`);
                        }}
                        organizationId={organization.id}
                      />
                    </div>
                  </>
                )}
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter the 4-6 digit code"
                          className="text-center text-xl tracking-widest"
                          maxLength={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the code sent to your email. For testing, you can use "1234".
                        {expiresAt && (
                          <div className="text-muted-foreground text-xs mt-1">
                            Code expires in 30 minutes.
                          </div>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700"
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setStep('email');
                      otpForm.reset();
                    }}
                    disabled={isVerifying}
                  >
                    Use a different email
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 border-t flex justify-center">
          <p className="text-sm text-muted-foreground">
            Protected by ComplyArk Security
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}