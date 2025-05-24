import { useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Save, SendHorizontal } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EmailSettings {
  emailEnabled: boolean;
  emailTestMode: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  defaultFromEmail: string;
  defaultFromName: string;
}

interface TestEmailParams {
  recipient: string;
  subject: string;
  message: string;
}

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    emailEnabled: false,
    emailTestMode: true,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    defaultFromEmail: "noreply@complyark.com",
    defaultFromName: "ComplyArk Notifications"
  });

  const [testEmail, setTestEmail] = useState<TestEmailParams>({
    recipient: "",
    subject: "ComplyArk Test Email",
    message: "This is a test email from the ComplyArk Compliance Management System."
  });

  // Fetch current email settings
  useState(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/email-settings");
        const data = await response.json();
        if (data) {
          setEmailSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch email settings:", error);
      }
    };

    fetchSettings();
  });

  // Update email settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: EmailSettings) => {
      const res = await apiRequest("POST", "/api/admin/email-settings", settings);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Email settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update email settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Test email sending
  const testEmailMutation = useMutation({
    mutationFn: async (params: TestEmailParams) => {
      const res = await apiRequest("POST", "/api/admin/test-email", params);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "The test email was sent successfully. Please check your inbox.",
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: `Failed to send test email: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setEmailSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setEmailSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleTestEmailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setTestEmail(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(emailSettings);
  };

  const handleTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    testEmailMutation.mutate(testEmail);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-muted-foreground">Configure and test email notifications for the ComplyArk platform</p>
        </div>

        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">SMTP Settings</TabsTrigger>
            <TabsTrigger value="test">Test Email</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Email Server Configuration</CardTitle>
                <CardDescription>
                  Configure your SMTP server settings for sending email notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSettings}>
                  <div className="space-y-6">
                    {/* Email Enabled Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailEnabled" className="text-base font-medium">
                          Enable Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Turn on or off all email notifications in the system
                        </p>
                      </div>
                      <Switch
                        id="emailEnabled"
                        name="emailEnabled"
                        checked={emailSettings.emailEnabled}
                        onCheckedChange={(checked) => handleSwitchChange("emailEnabled", checked)}
                      />
                    </div>

                    {/* Test Mode Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailTestMode" className="text-base font-medium">
                          Test Mode
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          When enabled, emails will be logged but not actually sent
                        </p>
                      </div>
                      <Switch
                        id="emailTestMode"
                        name="emailTestMode"
                        checked={emailSettings.emailTestMode}
                        onCheckedChange={(checked) => handleSwitchChange("emailTestMode", checked)}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* SMTP Host */}
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          name="smtpHost"
                          placeholder="smtp.example.com"
                          value={emailSettings.smtpHost}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* SMTP Port */}
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          name="smtpPort"
                          type="number"
                          placeholder="587"
                          value={emailSettings.smtpPort}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* SMTP Username */}
                      <div className="space-y-2">
                        <Label htmlFor="smtpUser">SMTP Username</Label>
                        <Input
                          id="smtpUser"
                          name="smtpUser"
                          placeholder="your-username"
                          value={emailSettings.smtpUser}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* SMTP Password */}
                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">SMTP Password</Label>
                        <Input
                          id="smtpPassword"
                          name="smtpPassword"
                          type="password"
                          placeholder="••••••••"
                          value={emailSettings.smtpPassword}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Default From Email */}
                      <div className="space-y-2">
                        <Label htmlFor="defaultFromEmail">Default From Email</Label>
                        <Input
                          id="defaultFromEmail"
                          name="defaultFromEmail"
                          placeholder="noreply@complyark.com"
                          value={emailSettings.defaultFromEmail}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Default From Name */}
                      <div className="space-y-2">
                        <Label htmlFor="defaultFromName">Default From Name</Label>
                        <Input
                          id="defaultFromName"
                          name="defaultFromName"
                          placeholder="ComplyArk Notifications"
                          value={emailSettings.defaultFromName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <CardFooter className="px-0 pt-6">
                    <Button 
                      type="submit" 
                      disabled={updateSettingsMutation.isPending}
                      className="ml-auto"
                    >
                      {updateSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Test Email Delivery</CardTitle>
                <CardDescription>
                  Send a test email to verify your SMTP configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTestEmail}>
                  <div className="space-y-6">
                    {/* Recipient Email */}
                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient Email</Label>
                      <Input
                        id="recipient"
                        name="recipient"
                        type="email"
                        placeholder="test@example.com"
                        value={testEmail.recipient}
                        onChange={handleTestEmailChange}
                        required
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="ComplyArk Test Email"
                        value={testEmail.subject}
                        onChange={handleTestEmailChange}
                        required
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter your test message here..."
                        value={testEmail.message}
                        onChange={handleTestEmailChange}
                        required
                      />
                    </div>
                  </div>

                  <CardFooter className="px-0 pt-6">
                    <div className="ml-auto flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={testEmailMutation.isPending || !testEmail.recipient}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {testEmailMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <SendHorizontal className="mr-2 h-4 w-4" />
                            Send Test Email
                          </>
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}