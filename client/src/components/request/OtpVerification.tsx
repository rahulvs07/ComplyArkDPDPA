import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

interface OtpVerificationProps {
  email: string;
  onVerificationSuccess: (email: string) => void;
  onBack?: () => void;
  organizationId?: number;
}

function OtpVerification({ email, onVerificationSuccess, onBack, organizationId }: OtpVerificationProps) {
  // State for OTP flow
  const [otpSent, setOtpSent] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [otpExpiryTime, setOtpExpiryTime] = useState<Date | null>(null);

  // Request OTP
  const handleRequestOtp = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsRequestingOtp(true);
    setErrorMessage('');

    try {
      // Use the correct API endpoint for OTP generation
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          organizationId: organizationId || null,
          organizationName: 'ComplyArk Systems' // Add organization name for email context
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpToken(data.token);
        setOtpExpiryTime(new Date(data.expiresAt));
        
        // Show the OTP in a toast notification for testing
        if (data.otp) {
          toast({
            title: "Test OTP Code",
            description: `Your verification code is: ${data.otp}`,
          });
        } else {
          toast({
            title: "OTP Sent",
            description: "We've sent a verification code to your email. Please check and enter it below.",
          });
        }
      } else {
        setErrorMessage(data.message || 'Failed to send verification code');
        toast({
          title: "Error",
          description: data.message || 'Failed to send verification code',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OTP Request Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Connection error';
      setErrorMessage(`Error: ${errorMsg}`);
      toast({
        title: "Error",
        description: `Problem sending verification code: ${errorMsg}`,
        variant: "destructive"
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage('');

    try {
      // Use the correct API endpoint for OTP verification
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, token: otpToken }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email verified successfully",
        });
        onVerificationSuccess(email);
      } else {
        setErrorMessage(data.message || 'Invalid verification code');
        toast({
          title: "Error",
          description: data.message || 'Invalid verification code',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Connection error';
      setErrorMessage(`Error: ${errorMsg}`);
      toast({
        title: "Error",
        description: `Problem verifying code: ${errorMsg}`,
        variant: "destructive"
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = () => {
    setOtp('');
    setOtpToken('');
    setOtpSent(false);
    handleRequestOtp();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          {!otpSent 
            ? "We need to verify your email before submitting the request."
            : "Enter the verification code sent to your email."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!otpSent ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address</label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-muted-foreground">
                A verification code will be sent to this email address.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
              )}
              <Button 
                onClick={handleRequestOtp} 
                disabled={isRequestingOtp}
                className={onBack ? "" : "w-full"}
              >
                {isRequestingOtp ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">Verification Code</label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                placeholder="Enter the code from your email"
                maxLength={6}
              />
              
              {otpExpiryTime && (
                <p className="text-sm text-muted-foreground">
                  Code expires at {otpExpiryTime.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <Button 
                variant="outline" 
                onClick={handleResendOtp}
                disabled={isVerifyingOtp || isRequestingOtp}
              >
                Resend Code
              </Button>
              <Button 
                onClick={handleVerifyOtp} 
                disabled={isVerifyingOtp || !otp}
              >
                {isVerifyingOtp ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <Alert className="mt-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <Separator className="my-4" />
        
        <div className="text-sm text-muted-foreground">
          <h3 className="font-semibold mb-1">Why do we need to verify your email?</h3>
          <p>Email verification helps us ensure that requests are legitimate and provides a secure way to communicate about your request.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default OtpVerification;