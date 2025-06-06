import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle, Mail, InfoIcon, Save, X } from 'lucide-react';

const EmailSettings = () => {
  const { toast } = useToast();
  const [provider, setProvider] = useState<'smtp' | 'sendgrid'>('smtp');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [useTLS, setUseTLS] = useState(true);
  const [sendgridApiKey, setSendgridApiKey] = useState('');
  
  // Test email
  const [testRecipient, setTestRecipient] = useState('');
  const [testSubject, setTestSubject] = useState('ComplyArk Test Email');
  const [testMessage, setTestMessage] = useState('This is a test email from ComplyArk.');
  const [testSending, setTestSending] = useState(false);
  
  // Email templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{id: number, name: string, subject: string, body: string}>({
    id: 0,
    name: '',
    subject: '',
    body: ''
  });
  
  // Fetch email settings
  const { data: emailSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/admin/email-settings'],
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000
  });

  // Update state when settings are loaded
  useEffect(() => {
    if (emailSettings) {
      setProvider(emailSettings.provider || 'smtp');
      setFromEmail(emailSettings.fromEmail || '');
      setFromName(emailSettings.fromName || '');
      setSmtpHost(emailSettings.smtpHost || '');
      setSmtpPort(emailSettings.smtpPort?.toString() || '');
      setSmtpUsername(emailSettings.smtpUsername || '');
      // Password is not displayed for security
      setUseTLS(emailSettings.useTLS !== undefined ? emailSettings.useTLS : true);
      // API key is not displayed for security
    }
  }, [emailSettings]);
  
  // Fetch email templates
  const { data: emailTemplates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/admin/email-templates'],
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000
  });

  // Update templates state when loaded
  useEffect(() => {
    if (emailTemplates && Array.isArray(emailTemplates)) {
      console.log('Received email templates:', emailTemplates);
      setTemplates(emailTemplates);
      console.log('Email templates set to state:', emailTemplates.length, 'templates');
    } else {
      console.warn('Email templates data is not an array or is empty', emailTemplates);
    }
  }, [emailTemplates]);
  
  // Save email template
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const response = await fetch('/api/admin/email-templates', {
        method: template.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save email template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email template has been saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
      setIsEditingTemplate(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save email template',
        variant: 'destructive',
      });
    },
  });
  
  // Save email settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save email settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email settings have been saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save email settings',
        variant: 'destructive',
      });
    },
  });
  
  // Send test email
  const sendTestEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      setTestSending(true);
      const response = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send test email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Test email sent successfully to ${testRecipient}`,
      });
      setTestSending(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test email',
        variant: 'destructive',
      });
      setTestSending(false);
    },
  });
  
  const handleSaveSettings = () => {
    const settings = {
      provider,
      fromEmail,
      fromName,
      useTLS,
      ...(provider === 'smtp' && {
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
        smtpUsername,
        ...(smtpPassword && { smtpPassword }),
      }),
      ...(provider === 'sendgrid' && {
        ...(sendgridApiKey && { sendgridApiKey }),
      }),
    };
    
    saveSettingsMutation.mutate(settings);
  };
  
  const handleSendTestEmail = () => {
    if (!testRecipient) {
      toast({
        title: 'Error',
        description: 'Please enter a recipient email address',
        variant: 'destructive',
      });
      return;
    }
    
    sendTestEmailMutation.mutate({
      subject: testSubject,
      message: testMessage,
      recipient: testRecipient,
    });
  };
  
  const handleSaveTemplate = () => {
    if (!editingTemplate.name || !editingTemplate.subject || !editingTemplate.body) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }
    saveTemplateMutation.mutate(editingTemplate);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Email Settings</h1>
      
      {/* Email Template Editing Dialog */}
      <Dialog open={isEditingTemplate} onOpenChange={setIsEditingTemplate}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate.id ? 'Edit' : 'Create'} Email Template</DialogTitle>
            <DialogDescription>
              Define the content and structure of emails sent by the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                placeholder="e.g., OTP Verification, Welcome Email"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateSubject">Email Subject</Label>
              <Input
                id="templateSubject"
                placeholder="e.g., Your Verification Code"
                value={editingTemplate.subject}
                onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">
                You can use variables like {'{otp}'} or {'{userName}'} that will be replaced with actual values.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateBody">Email Body (HTML)</Label>
              <textarea
                id="templateBody"
                className="w-full min-h-[200px] px-3 py-2 text-sm rounded-md border border-input bg-transparent"
                placeholder="<h1>Hello!</h1><p>Your verification code is: {otp}</p>"
                value={editingTemplate.body}
                onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">
                You can use HTML formatting and variables like {'{otp}'}, {'{userName}'}, etc.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditingTemplate(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={saveTemplateMutation.isPending}
            >
              {saveTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="test">Test Email</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure your email provider settings for sending notifications and OTP verification emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider">Email Provider</Label>
                      <Select 
                        value={provider} 
                        onValueChange={(value) => setProvider(value as 'smtp' | 'sendgrid')}
                      >
                        <SelectTrigger id="provider">
                          <SelectValue placeholder="Select email provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smtp">SMTP Server</SelectItem>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">From Email Address</Label>
                      <Input
                        id="fromEmail"
                        placeholder="noreply@yourcompany.com"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        placeholder="ComplyArk"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {provider === 'smtp' && (
                    <div className="space-y-4">
                      <Separator />
                      <h3 className="text-lg font-medium">SMTP Configuration</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          placeholder="smtp.example.com"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          placeholder="587"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          type="number"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Common ports: 25, 465 (SSL), 587 (TLS), 2525
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtpUsername">SMTP Username</Label>
                        <Input
                          id="smtpUsername"
                          placeholder="username or email"
                          value={smtpUsername}
                          onChange={(e) => setSmtpUsername(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">SMTP Password</Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          placeholder="••••••••••••"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {emailSettings?.smtpPassword ? 
                            "Password is stored securely. Enter a new password only if you want to change it." : 
                            "Enter your SMTP password to authenticate with the server."
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="useTLS"
                          checked={useTLS}
                          onCheckedChange={setUseTLS}
                        />
                        <Label htmlFor="useTLS">Use TLS/SSL encryption</Label>
                      </div>
                    </div>
                  )}
                  
                  {provider === 'sendgrid' && (
                    <div className="space-y-4">
                      <Separator />
                      <h3 className="text-lg font-medium">SendGrid Configuration</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sendgridApiKey">API Key</Label>
                        <Input
                          id="sendgridApiKey"
                          type="password"
                          placeholder="••••••••••••"
                          value={sendgridApiKey}
                          onChange={(e) => setSendgridApiKey(e.target.value)}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {emailSettings?.sendgridApiKey ? 
                            "API key is stored securely. Enter a new key only if you want to change it." : 
                            "Enter your SendGrid API key to authorize email sending."
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
                {saveSettingsMutation.isPending ? (
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
          </Card>
        </TabsContent>
        
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Email</CardTitle>
              <CardDescription>
                Send a test email to verify your email settings are working correctly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testRecipient">Recipient Email</Label>
                  <Input
                    id="testRecipient"
                    placeholder="recipient@example.com"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="testSubject">Subject</Label>
                  <Input
                    id="testSubject"
                    placeholder="Test Email from ComplyArk"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="testMessage">Message</Label>
                  <textarea
                    id="testMessage"
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-transparent"
                    placeholder="This is a test email from ComplyArk."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  <InfoIcon className="inline-block mr-1 h-4 w-4" />
                  Make sure to save your email settings before testing.
                </p>
              </div>
              <Button 
                onClick={handleSendTestEmail} 
                disabled={testSending || !testRecipient}
              >
                {testSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  View and manage email templates used for notifications.
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingTemplate({
                    id: 0,
                    name: '',
                    subject: '',
                    body: ''
                  });
                  setIsEditingTemplate(true);
                }}
              >
                Add Template
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Subject: {template.subject}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingTemplate(template);
                            setIsEditingTemplate(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="mt-2 pt-2 border-t text-sm">
                        <p className="font-medium text-xs mb-1">Preview:</p>
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs max-h-24 overflow-y-auto">
                          {template.body.substring(0, 200)}
                          {template.body.length > 200 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No email templates found.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Make sure you're logged in as an administrator and refresh the page.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] })}
                    >
                      Refresh Templates
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditingTemplate({
                          id: 0,
                          name: '',
                          subject: '',
                          body: ''
                        });
                        setIsEditingTemplate(true);
                      }}
                    >
                      Create Template
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailSettings;