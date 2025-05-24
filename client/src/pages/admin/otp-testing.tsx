import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

const OtpTestingPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  
  // Handle sending OTP
  const handleSendOtp = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address to send the OTP.',
        variant: 'destructive'
      });
      return;
    }
    
    setOtpSending(true);
    setSendStatus('idle');
    
    try {
      const organizationId = user?.organizationId || '';
      
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email,
          organizationId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        setSendStatus('success');
        setExpiryTime(new Date(data.expiresAt));
        
        toast({
          title: 'OTP Sent Successfully',
          description: `An OTP has been sent to ${email}. It will expire at ${new Date(data.expiresAt).toLocaleTimeString()}.`,
        });
      } else {
        setSendStatus('error');
        toast({
          title: 'Failed to Send OTP',
          description: data.message || 'An error occurred while sending the OTP.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setSendStatus('error');
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setOtpSending(false);
    }
  };
  
  // Handle verifying OTP
  const handleVerifyOtp = async () => {
    if (!otp || !token) {
      toast({
        title: 'OTP and Token Required',
        description: 'Please enter the OTP and ensure you have a valid token.',
        variant: 'destructive'
      });
      return;
    }
    
    setOtpVerifying(true);
    setVerifyStatus('idle');
    
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          otp,
          token 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVerifyStatus('success');
        toast({
          title: 'OTP Verified Successfully',
          description: `OTP verification successful for ${data.email}.`,
        });
      } else {
        setVerifyStatus('error');
        toast({
          title: 'OTP Verification Failed',
          description: data.message || 'The OTP could not be verified.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setVerifyStatus('error');
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during verification.',
        variant: 'destructive'
      });
    } finally {
      setOtpVerifying(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">OTP Verification Testing</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This page allows administrators to test the OTP verification system. You can send test OTPs to any email address and verify them.
        </p>
        
        <Alert className="mb-6">
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription>
            This is a testing interface only. Make sure your email settings are properly configured before testing.
            You can configure email settings in the Email Settings page.
          </AlertDescription>
        </Alert>
      </div>
      
      <Tabs defaultValue="send">
        <TabsList className="mb-6">
          <TabsTrigger value="send">Send OTP</TabsTrigger>
          <TabsTrigger value="verify">Verify OTP</TabsTrigger>
        </TabsList>
        
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Send OTP</CardTitle>
              <CardDescription>
                Send a test OTP to any email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <Button
                  onClick={handleSendOtp}
                  disabled={otpSending || !email}
                  className="w-full"
                >
                  {otpSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send OTP
                    </>
                  )}
                </Button>
                
                {sendStatus === 'success' && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">OTP Sent Successfully</p>
                      <p className="text-sm mt-1">
                        An OTP has been sent to {email}.
                        {expiryTime && (
                          <span> It will expire at {expiryTime.toLocaleTimeString()}.</span>
                        )}
                      </p>
                      <p className="text-sm mt-2 font-medium">Token: {token}</p>
                    </div>
                  </div>
                )}
                
                {sendStatus === 'error' && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded flex items-start">
                    <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Failed to Send OTP</p>
                      <p className="text-sm mt-1">
                        There was an error sending the OTP to {email}. Please check your email settings and try again.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="verify">
          <Card>
            <CardHeader>
              <CardTitle>Verify OTP</CardTitle>
              <CardDescription>
                Verify a test OTP that was previously sent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <Input
                    id="token"
                    placeholder="Enter token received from OTP send"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    placeholder="Enter the OTP received in email"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || !otp || !token}
                  className="w-full"
                >
                  {otpVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying OTP...
                    </>
                  ) : (
                    <>Verify OTP</>
                  )}
                </Button>
                
                {verifyStatus === 'success' && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">OTP Verified Successfully</p>
                      <p className="text-sm mt-1">
                        The OTP has been successfully verified.
                      </p>
                    </div>
                  </div>
                )}
                
                {verifyStatus === 'error' && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded flex items-start">
                    <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">OTP Verification Failed</p>
                      <p className="text-sm mt-1">
                        The OTP could not be verified. It may be incorrect, expired, or already used.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OtpTestingPage;