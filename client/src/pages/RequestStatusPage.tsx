import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent } from '@/components/ui/card';

// Define validation schema
const requestStatusSchema = z.object({
  statusName: z.string().min(1, "Status name is required"),
  slaDays: z.coerce.number().min(0, "SLA days must be 0 or greater"),
  isActive: z.boolean().default(true),
});

type RequestStatus = {
  statusId: number;
  statusName: string;
  slaDays: number;
  isActive: boolean;
};

export default function RequestStatusPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<RequestStatus | null>(null);

  // Form for adding/editing status
  const form = useForm<z.infer<typeof requestStatusSchema>>({
    resolver: zodResolver(requestStatusSchema),
    defaultValues: {
      statusName: "",
      slaDays: 0,
      isActive: true,
    },
  });

  // Fetch request statuses
  const { data: statuses, isLoading } = useQuery({
    queryKey: ['/api/request-statuses'],
    queryFn: async () => {
      const response = await apiRequest('/api/request-statuses');
      return response.data as RequestStatus[];
    },
  });

  // Create request status
  const createStatusMutation = useMutation({
    mutationFn: async (data: z.infer<typeof requestStatusSchema>) => {
      const response = await apiRequest('/api/request-statuses', {
        method: 'POST',
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/request-statuses'] });
      toast({
        title: "Status Created",
        description: "The request status has been successfully created.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create request status.",
        variant: "destructive",
      });
    },
  });

  // Update request status
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: z.infer<typeof requestStatusSchema> }) => {
      const response = await apiRequest(`/api/request-statuses/${data.id}`, {
        method: 'PUT',
        data: data.status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/request-statuses'] });
      toast({
        title: "Status Updated",
        description: "The request status has been successfully updated.",
      });
      setEditingStatus(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update request status.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof requestStatusSchema>) => {
    if (editingStatus) {
      updateStatusMutation.mutate({ id: editingStatus.statusId, status: data });
    } else {
      createStatusMutation.mutate(data);
    }
  };

  // Set form values when editing
  const handleEdit = (status: RequestStatus) => {
    setEditingStatus(status);
    form.reset({
      statusName: status.statusName,
      slaDays: status.slaDays,
      isActive: status.isActive,
    });
  };

  // Reset form when closing dialog
  const handleCloseDialog = () => {
    setEditingStatus(null);
    setIsAddDialogOpen(false);
    form.reset();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <PageTitle>Request Status Management</PageTitle>
        <Dialog open={isAddDialogOpen || !!editingStatus} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStatus ? "Edit Status" : "Add New Status"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="statusName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter status name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slaDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SLA Days</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="Enter SLA days" {...field} />
                      </FormControl>
                      <FormDescription>
                        Number of days to complete a request with this status
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Whether this status is active and can be assigned
                        </FormDescription>
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
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={createStatusMutation.isPending || updateStatusMutation.isPending}>
                    {(createStatusMutation.isPending || updateStatusMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingStatus ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status Name</TableHead>
                  <TableHead>SLA Days</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses && statuses.length > 0 ? (
                  statuses.map((status) => (
                    <TableRow key={status.statusId}>
                      <TableCell>{status.statusId}</TableCell>
                      <TableCell>{status.statusName}</TableCell>
                      <TableCell>{status.slaDays}</TableCell>
                      <TableCell>
                        <div className={`w-3 h-3 rounded-full ${status.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(status)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No request statuses found. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}