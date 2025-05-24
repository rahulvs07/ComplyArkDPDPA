import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import MainLayout from '@/components/layouts/MainLayout';

function OtpTestingPage() {
  // OTP Request State
  const [email, setEmail] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otpExpiryTime, setOtpExpiryTime] = useState<Date | null>(null);
  
  // OTP Verification State
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  // Status States
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Handle OTP Request
  const handleRequestOtp = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsRequestingOtp(true);
    setRequestStatus('idle');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRequestStatus('success');
        setOtpToken(data.token);
        setOtpExpiryTime(new Date(data.expiresAt));
        toast({
          title: "Success",
          description: "OTP sent successfully",
        });
      } else {
        setRequestStatus('error');
        setErrorMessage(data.message || 'Failed to send OTP');
        toast({
          title: "Error",
          description: data.message || 'Failed to send OTP',
          variant: "destructive"
        });
      }
    } catch (error) {
      setRequestStatus('error');
      setErrorMessage('An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };
  
  // Handle OTP Verification
  const handleVerifyOtp = async () => {
    if (!otp || !otpToken) {
      toast({
        title: "Error",
        description: "Please enter OTP and ensure you have requested an OTP first",
        variant: "destructive"
      });
      return;
    }
    
    setIsVerifyingOtp(true);
    setVerifyStatus('idle');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, token: otpToken }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVerifyStatus('success');
        toast({
          title: "Success",
          description: "OTP verified successfully",
        });
      } else {
        setVerifyStatus('error');
        setErrorMessage(data.message || 'Failed to verify OTP');
        toast({
          title: "Error",
          description: data.message || 'Failed to verify OTP',
          variant: "destructive"
        });
      }
    } catch (error) {
      setVerifyStatus('error');
      setErrorMessage('An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };
  
  // Reset All
  const handleReset = () => {
    setEmail('');
    setOtp('');
    setOtpToken('');
    setOtpExpiryTime(null);
    setRequestStatus('idle');
    setVerifyStatus('idle');
    setErrorMessage('');
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">OTP Testing Tool</h1>
            <Button variant="outline" onClick={handleReset}>Reset</Button>
          </div>
          
          <p className="text-muted-foreground">
            This tool allows administrators to test the OTP verification system using
            the configured email settings.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* OTP Request Card */}
            <Card>
              <CardHeader>
                <CardTitle>Request OTP</CardTitle>
                <CardDescription>
                  Enter an email address to receive an OTP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleRequestOtp} 
                    disabled={isRequestingOtp || !email}
                  >
                    {isRequestingOtp ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                  
                  {requestStatus === 'success' && (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <AlertDescription>
                        OTP sent successfully to {email}. 
                        {otpExpiryTime && (
                          <span> Expires at {otpExpiryTime.toLocaleTimeString()}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* OTP Verification Card */}
            <Card>
              <CardHeader>
                <CardTitle>Verify OTP</CardTitle>
                <CardDescription>
                  Enter the OTP received in your email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="otp" className="text-sm font-medium">OTP Code</label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter OTP code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleVerifyOtp} 
                    disabled={isVerifyingOtp || !otp || !otpToken}
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  
                  {verifyStatus === 'success' && (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <AlertDescription>
                        OTP verified successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Error Display */}
          {errorMessage && (
            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <Separator />
          
          <div className="text-sm text-muted-foreground">
            <h3 className="font-semibold mb-2">How to test the OTP system:</h3>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Enter a valid email address in the Request OTP section</li>
              <li>Click "Send OTP" to send an OTP to the email address</li>
              <li>Check your email for the OTP code</li>
              <li>Enter the OTP code in the Verify OTP section</li>
              <li>Click "Verify OTP" to validate the code</li>
            </ol>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default OtpTestingPage;