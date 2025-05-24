import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailSettings {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  enableNotifications: boolean;
}

interface TestEmailParams {
  recipient: string;
  subject: string;
  message: string;
}

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState<TestEmailParams>({
    recipient: "",
    subject: "ComplyArk Test Email",
    message: "This is a test email from ComplyArk."
  });

  const [formData, setFormData] = useState<EmailSettings>({
    host: "",
    port: 587,
    secure: false,
    auth: {
      user: "",
      pass: "",
    },
    from: "",
    enableNotifications: true
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/email/settings"]
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data: EmailSettings) => {
      return apiRequest("POST", "/api/email/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Email settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: (data: TestEmailParams) => {
      return apiRequest("POST", "/api/email/test", data);
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "Check your inbox for the test email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'auth') {
        setFormData({
          ...formData,
          auth: {
            ...formData.auth,
            [child]: value
          }
        });
      }
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleTestEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTestEmail({
      ...testEmail,
      [name]: value
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(formData);
  };

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    testEmailMutation.mutate(testEmail);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading email settings...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Email Settings</h1>
      
      <Tabs defaultValue="configuration">
        <TabsList className="mb-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="test">Test Email</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Configure the email server settings for sending notifications.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveSettings}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">SMTP Host</Label>
                    <Input 
                      id="host" 
                      name="host" 
                      value={formData.host} 
                      onChange={handleInputChange} 
                      placeholder="smtp.example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="port">SMTP Port</Label>
                    <Input 
                      id="port" 
                      name="port" 
                      type="number" 
                      value={formData.port} 
                      onChange={handleInputChange} 
                      placeholder="587"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="secure" 
                    name="secure" 
                    checked={formData.secure} 
                    onCheckedChange={(checked) => handleSwitchChange('secure', checked)} 
                  />
                  <Label htmlFor="secure">Use Secure Connection (SSL/TLS)</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auth.user">Username</Label>
                  <Input 
                    id="auth.user" 
                    name="auth.user" 
                    value={formData.auth.user} 
                    onChange={handleInputChange} 
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auth.pass">Password</Label>
                  <Input 
                    id="auth.pass" 
                    name="auth.pass" 
                    type="password" 
                    value={formData.auth.pass} 
                    onChange={handleInputChange} 
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="from">From Email Address</Label>
                  <Input 
                    id="from" 
                    name="from" 
                    value={formData.from} 
                    onChange={handleInputChange} 
                    placeholder="noreply@complyark.com"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enableNotifications" 
                    name="enableNotifications" 
                    checked={formData.enableNotifications} 
                    onCheckedChange={(checked) => handleSwitchChange('enableNotifications', checked)} 
                  />
                  <Label htmlFor="enableNotifications">Enable Email Notifications</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Verify your email configuration by sending a test email.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSendTestEmail}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Email</Label>
                  <Input 
                    id="recipient" 
                    name="recipient" 
                    value={testEmail.recipient} 
                    onChange={handleTestEmailChange} 
                    placeholder="recipient@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject" 
                    name="subject" 
                    value={testEmail.subject} 
                    onChange={handleTestEmailChange} 
                    placeholder="Test Email from ComplyArk"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Input 
                    id="message" 
                    name="message" 
                    value={testEmail.message} 
                    onChange={handleTestEmailChange} 
                    placeholder="This is a test email from ComplyArk."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={testEmailMutation.isPending || !formData.enableNotifications}
                >
                  {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Customize the email templates for different notification types.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Email template customization will be available in a future update. Currently, the system uses pre-defined templates for all notifications.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}