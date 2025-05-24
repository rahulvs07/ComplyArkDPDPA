import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Clipboard, Info, Mail, Terminal } from 'lucide-react';

// Form schema for the test email
const testEmailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  organizationName: z.string().min(1, { message: 'Organization name is required' }),
  organizationId: z.string().optional(),
});

// Form schema for the OTP verification
const otpVerificationSchema = z.object({
  token: z.string().min(1, { message: 'Token is required' }),
  otp: z.string().min(6, { message: 'OTP must be at least 6 digits' }),
});

export default function OtpTesting() {
  const { toast } = useToast();
  const [testTab, setTestTab] = useState('sendOtp');
  const [otpResult, setOtpResult] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [testMode, setTestMode] = useState(false);

  // Form for sending OTP
  const form = useForm<z.infer<typeof testEmailSchema>>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      email: '',
      organizationName: 'ComplyArk Systems',
      organizationId: '32',
    },
  });

  // Form for verifying OTP
  const verifyForm = useForm<z.infer<typeof otpVerificationSchema>>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      token: '',
      otp: '',
    },
  });

  // Get email settings
  const { data: emailSettings = {} } = useQuery({
    queryKey: ['/api/email-settings'],
  });

  // Handle submitting the test email form
  const onSubmit = async (values: z.infer<typeof testEmailSchema>) => {
    try {
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      setOtpResult(data);

      if (data.emailSent) {
        toast({
          title: 'Success',
          description: 'OTP email sent successfully',
        });
      } else {
        toast({
          title: 'Warning',
          description: 'OTP generated but email sending failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive',
      });
    }
  };

  // Handle verifying OTP
  const onVerifySubmit = async (values: z.infer<typeof otpVerificationSchema>) => {
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      setVerificationResult(data);

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'OTP verified successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Verification failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify OTP',
        variant: 'destructive',
      });
    }
  };

  // Copy OTP to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };

  // Toggle test mode
  const toggleTestMode = async () => {
    setTestMode(!testMode);
    toast({
      title: 'Test Mode',
      description: `Test mode ${!testMode ? 'enabled' : 'disabled'}`,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">OTP Email Testing</h1>
      <p className="text-muted-foreground mb-6">
        Use this page to test OTP generation and email delivery
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: Email settings info */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Current Email Configuration
              </CardTitle>
              <CardDescription>
                This shows the current email settings used for sending OTPs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="font-medium">Provider</div>
                  <div>
                    {(emailSettings as any).provider || 'smtp'}
                    <Badge variant="outline" className="ml-2">
                      {(emailSettings as any).provider === 'smtp' ? 'SMTP' : 'SendGrid'}
                    </Badge>
                  </div>
                </div>

                {(emailSettings as any).provider === 'smtp' && (
                  <>
                    <div>
                      <div className="font-medium">SMTP Host</div>
                      <div>{(emailSettings as any).smtpHost || 'smtp.gmail.com'}</div>
                    </div>
                    <div>
                      <div className="font-medium">SMTP Port</div>
                      <div>{(emailSettings as any).smtpPort || '587'}</div>
                    </div>
                    <div>
                      <div className="font-medium">SMTP Username</div>
                      <div>{(emailSettings as any).smtpUsername || 'automatikgarage@gmail.com'}</div>
                    </div>
                  </>
                )}

                <div>
                  <div className="font-medium">From Email</div>
                  <div>{(emailSettings as any).fromEmail || 'automatikgarage@gmail.com'}</div>
                </div>
                <div>
                  <div className="font-medium">From Name</div>
                  <div>{(emailSettings as any).fromName || 'ComplyArk'}</div>
                </div>

                <Button variant="outline" onClick={toggleTestMode}>
                  {testMode ? 'Disable Test Mode' : 'Enable Test Mode'}
                </Button>
                {testMode && (
                  <Alert className="bg-yellow-50 border-yellow-200 mt-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Test Mode Enabled</AlertTitle>
                    <AlertDescription>
                      OTPs will be shown in the interface instead of being sent via email.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results section */}
          {otpResult && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  OTP Generation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium">Email</div>
                    <div>{otpResult.email}</div>
                  </div>
                  <div>
                    <div className="font-medium">Token</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted p-1 rounded text-sm">
                        {otpResult.token}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(otpResult.token)}
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {otpResult.otpForTesting && (
                    <div>
                      <div className="font-medium">OTP Code</div>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted p-1 rounded text-sm font-bold">
                          {otpResult.otpForTesting}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(otpResult.otpForTesting)}
                        >
                          <Clipboard className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">Email Status</div>
                    <Badge
                      variant={otpResult.emailSent ? 'default' : 'destructive'}
                    >
                      {otpResult.emailSent ? 'Sent' : 'Failed'}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                <Button 
                  onClick={() => {
                    verifyForm.setValue('token', otpResult.token);
                    if (otpResult.otpForTesting) {
                      verifyForm.setValue('otp', otpResult.otpForTesting);
                    }
                    setTestTab('verifyOtp');
                  }}
                >
                  Verify this OTP
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Verification results */}
          {verificationResult && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Verification Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium">Status</div>
                    <Badge
                      variant={verificationResult.message?.includes('successfully') ? 'default' : 'destructive'}
                    >
                      {verificationResult.message?.includes('successfully') ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <div>
                    <div className="font-medium">Message</div>
                    <div>{verificationResult.message}</div>
                  </div>
                  {verificationResult.email && (
                    <div>
                      <div className="font-medium">Email</div>
                      <div>{verificationResult.email}</div>
                    </div>
                  )}
                  {verificationResult.organizationId && (
                    <div>
                      <div className="font-medium">Organization ID</div>
                      <div>{verificationResult.organizationId}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Test forms */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>OTP Testing</CardTitle>
              <CardDescription>
                Test OTP generation and verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={testTab} onValueChange={setTestTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="sendOtp" className="flex-1">Generate OTP</TabsTrigger>
                  <TabsTrigger value="verifyOtp" className="flex-1">Verify OTP</TabsTrigger>
                </TabsList>

                <TabsContent value="sendOtp" className="pt-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="user@example.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              The email address to send the OTP to
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Organization Name" {...field} />
                            </FormControl>
                            <FormDescription>
                              Name to display in the OTP email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="organizationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization ID</FormLabel>
                            <FormControl>
                              <Input placeholder="1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Optional organization ID for verification
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full">
                        Generate and Send OTP
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="verifyOtp" className="pt-4">
                  <Form {...verifyForm}>
                    <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-6">
                      <FormField
                        control={verifyForm.control}
                        name="token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token</FormLabel>
                            <FormControl>
                              <Input placeholder="Token from OTP request" {...field} />
                            </FormControl>
                            <FormDescription>
                              The token received from the OTP generation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={verifyForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OTP Code</FormLabel>
                            <FormControl>
                              <Input placeholder="6-digit OTP code" {...field} />
                            </FormControl>
                            <FormDescription>
                              The OTP code received via email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full">
                        Verify OTP
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>OTP Process Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                <li>Generate an OTP using the form above</li>
                <li>The system will send an email with the OTP code</li>
                <li>In development mode, the OTP will be displayed here</li>
                <li>Use the verification tab to verify the OTP</li>
                <li>If successful, the user will be authenticated</li>
              </ol>

              <Separator className="my-4" />

              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Troubleshooting Tips:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Check your spam folder for OTP emails</li>
                  <li>Verify email settings are correct</li>
                  <li>OTPs expire after 15 minutes</li>
                  <li>You can use the test mode to bypass email sending</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}