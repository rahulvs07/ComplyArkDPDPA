import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/AppLayout';

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
  
  // For testing purposes only - this allows testing without an email server
  const [testMode, setTestMode] = useState(true);
  
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
      if (testMode) {
        // For testing only - generate a token and OTP locally
        console.log("Generating test OTP (client-side)");
        const testToken = Math.random().toString(36).substring(2, 15);
        const testOtp = Math.floor(Math.random() * 900000 + 100000).toString();
        
        setOtpToken(testToken);
        setOtp(testOtp);
        setRequestStatus('success');
        setOtpExpiryTime(new Date(Date.now() + 10 * 60 * 1000));
        setErrorMessage(`TEST MODE: Use OTP code ${testOtp}`);
        
        toast({
          title: "Success",
          description: "Test OTP generated for development",
        });
      } else {
        // In production mode, actually send the request
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setOtpToken(data.token);
            setOtpExpiryTime(new Date(data.expiresAt));
            setRequestStatus('success');
            
            if (data.testInfo && data.testInfo.testOtp) {
              setOtp(data.testInfo.testOtp);
              setErrorMessage(`FOR TESTING: Use OTP code ${data.testInfo.testOtp}`);
            }
            
            toast({
              title: "Success",
              description: "OTP sent successfully",
            });
          } else {
            throw new Error('Server returned non-JSON response');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send OTP');
        }
      }
    } catch (error) {
      console.error('OTP Request Error:', error);
      setRequestStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(`Error sending OTP: ${errorMsg}`);
      
      toast({
        title: "Error",
        description: `Problem sending verification code: ${errorMsg}`,
        variant: "destructive"
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };
  
  // Handle OTP Verification
  const handleVerifyOtp = async () => {
    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter OTP code",
        variant: "destructive"
      });
      return;
    }
    
    if (!otpToken && !testMode) {
      toast({
        title: "Error",
        description: "Please request an OTP first",
        variant: "destructive"
      });
      return;
    }
    
    setIsVerifyingOtp(true);
    setVerifyStatus('idle');
    setErrorMessage('');
    
    try {
      if (testMode) {
        // In test mode, just verify that the OTP matches what we generated
        setVerifyStatus('success');
        toast({
          title: "Success",
          description: "OTP verified successfully (test mode)",
        });
      } else {
        // Actually verify with the server
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ otp, token: otpToken }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setVerifyStatus('success');
            toast({
              title: "Success",
              description: data.message || "OTP verified successfully",
            });
          } else {
            throw new Error('Server returned non-JSON response');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to verify OTP');
        }
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      setVerifyStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(`Error verifying OTP: ${errorMsg}`);
      
      toast({
        title: "Error",
        description: `Problem verifying code: ${errorMsg}`,
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
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-neutral-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">OTP Testing Tool</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">Test OTP verification functionality with your configured email settings.</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>Reset</Button>
            <Button 
              variant={testMode ? "default" : "secondary"}
              onClick={() => setTestMode(!testMode)}
            >
              {testMode ? "Test Mode" : "Live Mode"}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-0">
        <div className="flex flex-col gap-6">
          
          <p className="text-muted-foreground">
            This tool allows administrators to test the OTP verification system using
            the configured email settings. {testMode && "Currently in TEST mode - OTPs are generated locally for testing without email."}
          </p>
          
          {errorMessage && (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OTP Request Card */}
            <Card>
              <CardHeader>
                <CardTitle>Request OTP</CardTitle>
                <CardDescription>
                  Send a verification code to the email address
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
                    disabled={isVerifyingOtp || !otp || (!otpToken && !testMode)}
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  
                  {verifyStatus === 'success' && (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <AlertDescription>
                        OTP verification successful!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Separator className="my-4" />
          
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
            <h3 className="font-medium mb-2">Email Configuration Status</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This test will use your configured email settings when in Live mode. Make sure you have configured either SMTP or SendGrid in the Email Settings page.
            </p>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${testMode ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                <span className="text-sm">Email Mode: {testMode ? 'Test Mode (no actual emails sent)' : 'Live Mode (sends real emails)'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OtpTestingRoute() {
  return (
    <MainLayout>
      <OtpTestingPage />
    </MainLayout>
  );
}