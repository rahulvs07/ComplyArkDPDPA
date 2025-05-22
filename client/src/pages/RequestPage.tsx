import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Check, Building, User, Mail, Phone } from 'lucide-react';

// Schema for DP Request form
const dpRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  requestType: z.enum(['Access', 'Correction', 'Nomination', 'Erasure']),
  requestComment: z.string().min(1, 'Please provide details about your request'),
});

// Schema for Grievance form
const grievanceSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  grievanceDetails: z.string().min(1, 'Please provide details about your grievance'),
  affectedRights: z.string().optional(),
});

export default function RequestPage() {
  const { token } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dpr');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form for Data Protection Request
  const dprForm = useForm<z.infer<typeof dpRequestSchema>>({
    resolver: zodResolver(dpRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      requestComment: '',
    },
  });

  // Form for Grievance
  const grievanceForm = useForm<z.infer<typeof grievanceSchema>>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      grievanceDetails: '',
      affectedRights: '',
    },
  });

  // Fetch organization data
  const { data: orgData, isLoading, isError } = useQuery({
    queryKey: [`/api/request-page/${token}`],
    queryFn: async () => {
      const response = await fetch(`/api/request-page/${token}`);
      if (!response.ok) {
        throw new Error('Failed to fetch organization data');
      }
      return response.json();
    },
  });

  // Create DP Request mutation
  const createDPRMutation = useMutation({
    mutationFn: async (data: z.infer<typeof dpRequestSchema>) => {
      const response = await fetch(`/api/request-page/${token}/dp-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Request Submitted',
        description: 'Your data protection request has been submitted successfully.',
      });
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create Grievance mutation
  const createGrievanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof grievanceSchema>) => {
      const response = await fetch(`/api/request-page/${token}/grievance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit grievance');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Grievance Submitted',
        description: 'Your grievance has been submitted successfully.',
      });
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle DPR form submission
  const onDPRSubmit = (data: z.infer<typeof dpRequestSchema>) => {
    createDPRMutation.mutate(data);
  };

  // Handle Grievance form submission
  const onGrievanceSubmit = (data: z.infer<typeof grievanceSchema>) => {
    createGrievanceMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (isError || !orgData) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invalid Request Page</CardTitle>
            <CardDescription className="text-center">
              This request page link is invalid or has expired. Please contact the organization for a valid link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-600">Request Submitted</CardTitle>
            <CardDescription className="text-center">
              Your request has been submitted successfully. Thank you for your submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center p-8">
            <div className="bg-green-100 p-4 rounded-full">
              <Check className="h-16 w-16 text-green-600" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.reload()}>Submit Another Request</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-6 w-6" />
            {orgData.organization?.name || 'Organization'}
          </CardTitle>
          <CardDescription>
            Data Protection and Grievance Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Contact: {orgData.organization?.contactPerson}</span>
              </div>
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Email: {orgData.organization?.contactEmail}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Phone: {orgData.organization?.contactPhone}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dpr" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dpr">Data Protection Request</TabsTrigger>
          <TabsTrigger value="grievance">Grievance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dpr" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Data Protection Request</CardTitle>
              <CardDescription>
                Use this form to request access, correction, erasure, or nomination of your personal data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...dprForm}>
                <form onSubmit={dprForm.handleSubmit(onDPRSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={dprForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={dprForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={dprForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={dprForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={dprForm.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select request type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Access">Access to my data</SelectItem>
                            <SelectItem value="Correction">Correction of my data</SelectItem>
                            <SelectItem value="Nomination">Nomination (Transfer of data to third party)</SelectItem>
                            <SelectItem value="Erasure">Erasure (Delete my data)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the type of data protection request you want to make
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={dprForm.control}
                    name="requestComment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide details about your request" 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide as much detail as possible to help us process your request efficiently
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createDPRMutation.isPending}
                  >
                    {createDPRMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Request
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="grievance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Grievance</CardTitle>
              <CardDescription>
                Use this form to report a grievance or complaint related to your data protection rights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...grievanceForm}>
                <form onSubmit={grievanceForm.handleSubmit(onGrievanceSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={grievanceForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={grievanceForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={grievanceForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={grievanceForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={grievanceForm.control}
                    name="affectedRights"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Affected Rights (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Specify the rights you believe have been affected" {...field} />
                        </FormControl>
                        <FormDescription>
                          For example: Right to access, right to erasure, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={grievanceForm.control}
                    name="grievanceDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grievance Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe your grievance in detail" 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide as much detail as possible about your grievance, including dates, specific incidents, and any previous communication
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createGrievanceMutation.isPending}
                  >
                    {createGrievanceMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Grievance
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}