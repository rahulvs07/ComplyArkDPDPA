import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { AlertCircle, CheckCircle, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function OTPVerificationSimplePage() {
  const [, params] = useRoute('/otp-verification/:token');
  const [, requestPageParams] = useRoute('/request-page/:token');
  const { toast } = useToast();
  
  const token = params?.token || requestPageParams?.token;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<{ id: number; name: string } | null>(null);
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  
  // Clear any previous verification data on load
  useEffect(() => {
    if (token) {
      const oldKeys = Object.keys(sessionStorage).filter(
        key => key.startsWith('otp_verified_') || key.startsWith('otp_email_')
      );
      
      oldKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log('Cleared previous verification data');
    }
  }, [token]);
  
  // Fetch organization based on the token
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
        
        // Check if already authenticated
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
          sessionStorage.setItem(`otp_verified_${data.id}`, 'true');
          sessionStorage.setItem(`otp_email_${data.id}`, authData.email);
        } else {
          // Check session storage as fallback
          const storedVerified = sessionStorage.getItem(`otp_verified_${data.id}`);
          const storedEmail = sessionStorage.getItem(`otp_email_${data.id}`);
          
          if (storedVerified === 'true' && storedEmail) {
            setVerified(true);
            setEmail(storedEmail);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organization');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrganization();
  }, [token]);
  
  // Send email verification code
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('email-input') as HTMLInputElement;
    const emailValue = emailInput ? emailInput.value : '';
    
    if (!emailValue || !organization) {
      toast({
        title: 'Email Required',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailValue,
          organizationId: organization.id,
          organizationName: organization.name,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send OTP code');
      }
      
      const responseData = await response.json();
      
      setEmail(emailValue);
      setStep('verify');
      setExpiresAt(new Date(responseData.expiresAt));
      
      toast({
        title: 'OTP Sent',
        description: `We've sent a verification code to ${emailValue}. For testing, use "1234".`,
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
  
  // Verify OTP code
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpValue || !organization) {
      toast({
        title: 'Code Required',
        description: 'Please enter the verification code',
        variant: 'destructive',
      });
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // For testing, accept "1234" without server validation
      if (otpValue === "1234") {
        setVerified(true);
        
        // Store authenticated status in organization-specific session storage
        sessionStorage.setItem(`otp_verified_${organization.id}`, 'true');
        sessionStorage.setItem(`otp_email_${organization.id}`, email);
        
        toast({
          title: 'Verification Successful',
          description: 'You can now submit your request.',
        });
        
        setIsVerifying(false);
        return;
      }
      
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpValue,
          organizationId: organization.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid OTP code');
      }
      
      setVerified(true);
      
      // Store authenticated status in organization-specific session storage
      sessionStorage.setItem(`otp_verified_${organization.id}`, 'true');
      sessionStorage.setItem(`otp_email_${organization.id}`, email);
      
      toast({
        title: 'Verification Successful',
        description: 'You can now submit your request.',
      });
      
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
  
  // Continue to request page
  const continueToRequestPage = () => {
    window.location.href = `/request-form/${token}`;
  };
  
  // Reset to email step
  const resetToEmailStep = () => {
    setStep('email');
    setEmail('');
    setOtpValue('');
  };
  
  // Loading state
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
  
  // Error state
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
  
  // Already verified state
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
              onClick={continueToRequestPage}
            >
              Continue to Request Page
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Email verification or OTP verification forms
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 bg-primary-600 text-white rounded-t-lg">
          <div className="flex flex-col items-center mb-4">
            <div className="bg-white rounded-full p-3 mb-2">
              <ShieldCheck className="h-8 w-8 text-primary-600" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">
                <span className="text-black">Comply</span>
                <span className="text-white">Ark</span>
              </h2>
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
            <div>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email-input" className="text-sm font-medium">
                    Email Address
                  </label>
                  <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white">
                    <span className="ml-3 text-gray-500">@</span>
                    <input
                      id="email-input"
                      type="email" 
                      placeholder="Enter your email address"
                      className="flex-1 p-2 border-0 focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We'll send a verification code to this email.
                  </p>
                </div>
                
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
                          console.log('Google login successful');
                          window.location.href = `/request-form/${token}`;
                        }}
                        organizationId={organization.id}
                      />
                      
                      <MicrosoftLoginButton
                        onSuccess={(email) => {
                          setVerified(true);
                          setEmail(email);
                          console.log('Microsoft login successful');
                          window.location.href = `/request-form/${token}`;
                        }}
                        organizationId={organization.id}
                      />
                    </div>
                  </>
                )}
              </form>
            </div>
          ) : (
            <div>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="otp-input" className="text-sm font-medium">
                    Verification Code
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    placeholder="Enter the 4-6 digit code"
                    className="w-full p-2 text-center text-xl tracking-widest border rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => {
                      console.log("OTP input changed:", e.target.value);
                      setOtpValue(e.target.value);
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the code sent to your email. For testing, use "1234".
                    {expiresAt && (
                      <span className="block text-xs mt-1">
                        Code expires in 30 minutes.
                      </span>
                    )}
                  </p>
                </div>
                
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
                    variant="link"
                    className="text-sm"
                    onClick={resetToEmailStep}
                  >
                    Use a different email address
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}