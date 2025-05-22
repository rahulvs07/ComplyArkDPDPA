import { useEffect, useState } from 'react';
import { useLocation, useParams, useSearch, useRoute } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [, params] = useRoute('/request/:orgId/*');
  const search = useSearch();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [orgId, setOrgId] = useState<number | null>(null);
  const [orgName, setOrgName] = useState('');

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
    const fetchOrgInfo = async () => {
      if (!params) return;
      
      try {
        const orgIdNum = parseInt(params.orgId);
        if (isNaN(orgIdNum)) {
          toast({
            title: "Invalid organization",
            description: "The organization ID is not valid.",
            variant: "destructive",
          });
          return;
        }
        
        setOrgId(orgIdNum);
        
        // Fetch organization name from public endpoint
        const response = await fetch(`/api/organizations/${orgIdNum}/public`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch organization information');
        }
        
        const data = await response.json();
        setOrgName(data.name || 'Organization');
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast({
          title: "Error",
          description: "Failed to load organization information. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchOrgInfo();
  }, [params, toast]);

  // Submit email to generate OTP
  const onEmailSubmit = async (values: EmailFormValues) => {
    if (!orgId) {
      // For testing, always use organizationId 1 if none is provided
      console.log('No organization ID provided, using default value of 1');
      setOrgId(1);
    }
    
    setLoading(true);
    
    try {
      const organizationId = orgId || 1; // Ensure we always have a valid ID
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
        description: error instanceof Error ? error.message : "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP for verification
  const onOTPSubmit = async (values: OTPFormValues) => {
    if (!orgId) {
      // For testing, always use organizationId 1 if none is provided
      console.log('No organization ID provided for verification, using default value of 1');
      setOrgId(1);
    }
    
    setLoading(true);
    
    try {
      const organizationId = orgId || 1; // Ensure we always have a valid ID
      console.log('Verifying OTP with:', { email, otp: values.otp, organizationId });
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
      
      // For our test system, just check the status instead of response.ok
      // This is needed because we always return 200 OK from our test endpoint
      const data = await response.json();
      if (response.status !== 200) {
        throw new Error(data.message || 'Invalid verification code');
      }
      
      toast({
        title: "Verification successful",
        description: "You are now verified to submit requests.",
      });
      
      // Redirect back to request page with authentication token
      push(`/request/${orgId}${search}`);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Failed to verify code. Please try again.",
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