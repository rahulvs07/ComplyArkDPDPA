import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Email settings schema
const emailSettingsSchema = z.object({
  provider: z.enum(["smtp", "sendgrid"]),
  fromEmail: z.string().email("Invalid email format"),
  fromName: z.string().min(1, "Sender name is required"),
  
  // SMTP specific fields
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  useTLS: z.boolean().default(true),
  
  // SendGrid specific fields
  sendgridApiKey: z.string().optional(),
});

// Test email schema
const testEmailSchema = z.object({
  recipient: z.string().email("Invalid email format"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

// Template schema
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Template body is required"),
});

// OTP test schema
const otpTestSchema = z.object({
  email: z.string().email("Invalid email format"),
  organizationId: z.string().min(1, "Organization ID is required"),
});

// OTP verification schema
const otpVerificationSchema = z.object({
  otp: z.string().min(4, "OTP must be at least 4 characters"),
  token: z.string(),
});

type EmailSettings = z.infer<typeof emailSettingsSchema>;
type TestEmailParams = z.infer<typeof testEmailSchema>;
type TemplateValues = z.infer<typeof templateSchema>;
type OtpTestValues = z.infer<typeof otpTestSchema>;
type OtpVerificationValues = z.infer<typeof otpVerificationSchema>;

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("settings");
  const [otpToken, setOtpToken] = useState("");

  // Fetch email settings
  const { data: emailSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/email/settings"],
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load email settings",
        variant: "destructive",
      });
    }
  });

  // Fetch email templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["/api/email/templates"],
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    }
  });

  // Fetch organizations for dropdown
  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations"],
  });

  // Email settings form
  const emailForm = useForm<EmailSettings>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      provider: "smtp",
      fromEmail: "",
      fromName: "",
      smtpHost: "",
      smtpPort: "",
      smtpUsername: "",
      smtpPassword: "",
      useTLS: true,
      sendgridApiKey: "",
    }
  });
  
  // State to track the selected provider
  const [selectedProvider, setSelectedProvider] = useState<"smtp" | "sendgrid">("smtp");
  
  // Update the provider state when the form field changes
  const watchProvider = emailForm.watch("provider");
  useEffect(() => {
    if (watchProvider) {
      setSelectedProvider(watchProvider as "smtp" | "sendgrid");
    }
  }, [watchProvider]);

  // Populate email settings form when data is loaded
  useEffect(() => {
    if (emailSettings) {
      emailForm.reset({
        provider: emailSettings.provider || "smtp",
        fromEmail: emailSettings.fromEmail || "",
        fromName: emailSettings.fromName || "",
        smtpHost: emailSettings.smtpHost || "",
        smtpPort: emailSettings.smtpPort ? emailSettings.smtpPort.toString() : "",
        smtpUsername: emailSettings.smtpUsername || "",
        smtpPassword: emailSettings.smtpPassword || "",
        useTLS: emailSettings.useTLS !== undefined ? emailSettings.useTLS : true,
        sendgridApiKey: emailSettings.sendgridApiKey || "",
      });
      
      // Set the provider in the state
      if (emailSettings.provider) {
        setSelectedProvider(emailSettings.provider as "smtp" | "sendgrid");
      }
    }
  }, [emailSettings, emailForm]);

  // Test email form
  const testEmailForm = useForm<TestEmailParams>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      recipient: "",
      subject: "Test Email from ComplyArk",
      message: "This is a test email from the ComplyArk platform. If you received this email, the email configuration is working correctly.",
    }
  });

  // Template form
  const templateForm = useForm<TemplateValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
    }
  });

  // OTP test form
  const otpTestForm = useForm<OtpTestValues>({
    resolver: zodResolver(otpTestSchema),
    defaultValues: {
      email: "",
      organizationId: "",
    }
  });

  // OTP verification form
  const otpVerificationForm = useForm<OtpVerificationValues>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: "",
      token: "",
    }
  });

  // Update email settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: EmailSettings) => apiRequest("POST", "/api/email/settings", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save email settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: (data: TestEmailParams) => apiRequest("POST", "/api/email/test", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test email sent successfully",
      });
      testEmailForm.reset({
        recipient: "",
        subject: "Test Email from ComplyArk",
        message: "This is a test email from the ComplyArk platform. If you received this email, the email configuration is working correctly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send test email: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Create/update template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: (data: TemplateValues) => apiRequest("POST", "/api/email/templates", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email template saved successfully",
      });
      templateForm.reset({
        name: "",
        subject: "",
        body: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email/templates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save template: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: (data: OtpTestValues) => apiRequest("POST", "/api/auth/otp/send", data),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "OTP sent successfully",
      });
      // Save the token for verification
      setOtpToken(data.token);
      otpVerificationForm.setValue("token", data.token);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send OTP: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: (data: OtpVerificationValues) => apiRequest("POST", "/api/auth/otp/verify", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "OTP verified successfully",
      });
      otpVerificationForm.reset({
        otp: "",
        token: "",
      });
      setOtpToken("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to verify OTP: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle email settings form submission
  const onSubmitEmailSettings = (data: EmailSettings) => {
    updateSettingsMutation.mutate(data);
  };

  // Handle test email form submission
  const onSubmitTestEmail = (data: TestEmailParams) => {
    sendTestEmailMutation.mutate(data);
  };

  // Handle template form submission
  const onSubmitTemplate = (data: TemplateValues) => {
    saveTemplateMutation.mutate(data);
  };

  // Handle OTP test form submission
  const onSubmitOtpTest = (data: OtpTestValues) => {
    sendOtpMutation.mutate(data);
  };

  // Handle OTP verification form submission
  const onSubmitOtpVerification = (data: OtpVerificationValues) => {
    verifyOtpMutation.mutate(data);
  };

  // Select template for editing
  const editTemplate = (template: any) => {
    templateForm.reset({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
    setActiveTab("templates");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-neutral-800 dark:text-white">Email Settings</h1>
            <p className="text-neutral-600 mt-1 dark:text-gray-300">Configure email notifications, templates, and test OTP functionality.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="settings">Email Settings</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="test">Test Email</TabsTrigger>
          <TabsTrigger value="otp">OTP Testing</TabsTrigger>
        </TabsList>

        {/* Email Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure your email server settings for sending notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onSubmitEmailSettings)} className="space-y-4">
                  <div className="space-y-6">
                    {/* Provider Selection */}
                    <FormField
                      control={emailForm.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Email Provider</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="smtp" id="smtp" />
                                <Label htmlFor="smtp">SMTP Server</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sendgrid" id="sendgrid" />
                                <Label htmlFor="sendgrid">SendGrid API</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Common Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={emailForm.control}
                        name="fromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Email</FormLabel>
                            <FormControl>
                              <Input placeholder="noreply@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="fromName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Name</FormLabel>
                            <FormControl>
                              <Input placeholder="ComplyArk Notifications" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* SMTP Server Fields */}
                    {selectedProvider === "smtp" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-800">
                        <div className="md:col-span-2">
                          <h3 className="text-sm font-medium mb-2">SMTP Server Settings</h3>
                        </div>
                        
                        <FormField
                          control={emailForm.control}
                          name="smtpHost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Host</FormLabel>
                              <FormControl>
                                <Input placeholder="smtp.example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailForm.control}
                          name="smtpPort"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Port</FormLabel>
                              <FormControl>
                                <Input placeholder="587" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailForm.control}
                          name="smtpUsername"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Username</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailForm.control}
                          name="smtpPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailForm.control}
                          name="useTLS"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                              <div>
                                <FormLabel>Use TLS/SSL</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Enable secure connection (TLS/SSL)
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* SendGrid Fields */}
                    {selectedProvider === "sendgrid" && (
                      <div className="border p-4 rounded-md bg-gray-50 dark:bg-gray-800">
                        <div className="mb-4">
                          <h3 className="text-sm font-medium mb-2">SendGrid API Settings</h3>
                          <p className="text-sm text-muted-foreground">
                            Enter your SendGrid API key to enable email sending through SendGrid.
                          </p>
                        </div>
                        
                        <FormField
                          control={emailForm.control}
                          name="sendgridApiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SendGrid API Key</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="SG.xxxxxxxxxxxxxxxxxxxx" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Create and manage email templates for different notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {templates && templates.map((template: any, index: number) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => editTemplate(template)}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs truncate">{template.subject}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-4">
                  <FormField
                    control={templateForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., OTP Verification, Request Confirmation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Your OTP Verification Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Body</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="You can use {variables} for dynamic content, e.g., {otp}, {name}, {organization}"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={saveTemplateMutation.isPending}
                    >
                      {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Email Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>Test your email configuration by sending a test message.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...testEmailForm}>
                <form onSubmit={testEmailForm.handleSubmit(onSubmitTestEmail)} className="space-y-4">
                  <FormField
                    control={testEmailForm.control}
                    name="recipient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email</FormLabel>
                        <FormControl>
                          <Input placeholder="recipient@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={testEmailForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Test Email Subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={testEmailForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your test message"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={sendTestEmailMutation.isPending}
                    >
                      {sendTestEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OTP Testing Tab */}
        <TabsContent value="otp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OTP Testing Interface</CardTitle>
              <CardDescription>Test the OTP verification system by sending and verifying OTP codes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Send OTP Form */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 1: Send OTP</h3>
                  <Form {...otpTestForm}>
                    <form onSubmit={otpTestForm.handleSubmit(onSubmitOtpTest)} className="space-y-4">
                      <FormField
                        control={otpTestForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="user@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={otpTestForm.control}
                        name="organizationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization</FormLabel>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              onChange={(e) => field.onChange(e.target.value)}
                              value={field.value}
                            >
                              <option value="">Select Organization</option>
                              {organizations.map((org: any) => (
                                <option key={org.id} value={org.id}>
                                  {org.businessName}
                                </option>
                              ))}
                            </select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={sendOtpMutation.isPending}
                        className="w-full"
                      >
                        {sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
                      </Button>
                    </form>
                  </Form>
                </div>

                {/* Verify OTP Form */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 2: Verify OTP</h3>
                  
                  {otpToken ? (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>OTP Sent</AlertTitle>
                      <AlertDescription>
                        An OTP has been sent to the email address. Check your inbox and enter the code below.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Generate OTP First</AlertTitle>
                      <AlertDescription>
                        Please complete Step 1 to generate and send an OTP.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Form {...otpVerificationForm}>
                    <form onSubmit={otpVerificationForm.handleSubmit(onSubmitOtpVerification)} className="space-y-4">
                      <FormField
                        control={otpVerificationForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enter OTP</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter the OTP code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={verifyOtpMutation.isPending || !otpToken}
                        className="w-full"
                      >
                        {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}