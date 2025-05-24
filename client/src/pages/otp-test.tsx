import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function OtpTestPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [organizationId, setOrganizationId] = useState('32');
  const [organizationName, setOrganizationName] = useState('ComplyArk Systems');
  const [isLoading, setIsLoading] = useState(false);
  const [otpResponse, setOtpResponse] = useState<any>(null);
  const [otpCode, setOtpCode] = useState('');
  const [verificationResponse, setVerificationResponse] = useState<any>(null);

  const handleGenerateOtp = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          organizationId: parseInt(organizationId),
          organizationName
        }),
      });

      const data = await response.json();
      setOtpResponse(data);
      
      if (response.ok) {
        toast({
          title: "OTP Generated",
          description: `OTP sent to ${email}. Check the response below for the code.`,
        });
        
        // If OTP is directly included in the response, show it
        if (data.otp) {
          setOtpCode(data.otp);
          toast({
            title: "Test OTP Code",
            description: `Your verification code is: ${data.otp}`,
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to generate OTP",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      console.error("OTP generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || !email) {
      toast({
        title: "Error",
        description: "Please enter both email and OTP code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpCode,
          token: otpResponse?.token,
          organizationId: parseInt(organizationId)
        }),
      });

      const data = await response.json();
      setVerificationResponse(data);
      
      if (response.ok) {
        toast({
          title: "Verification Successful",
          description: "OTP verified successfully!",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Failed to verify OTP",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during verification",
        variant: "destructive"
      });
      console.error("OTP verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format JSON for display
  const formatJson = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return 'Invalid JSON';
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">OTP Testing Tool</h1>
      <p className="text-muted-foreground mb-6">
        This page allows you to test the OTP generation and verification system without needing to go through the entire request flow.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate OTP</CardTitle>
          <CardDescription>Send a verification code to the specified email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organizationId">Organization ID</Label>
              <Input
                id="organizationId"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateOtp} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate OTP"}
          </Button>
        </CardFooter>
      </Card>

      {otpResponse && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>OTP Response</CardTitle>
            <CardDescription>Response from the OTP generation API</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {formatJson(otpResponse)}
            </pre>
            
            <Separator className="my-6" />
            
            <div className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="otp">Enter OTP Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter the code from your email or response"
                  />
                  <Button onClick={handleVerifyOtp} disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {verificationResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Response</CardTitle>
            <CardDescription>Response from the OTP verification API</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {formatJson(verificationResponse)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}