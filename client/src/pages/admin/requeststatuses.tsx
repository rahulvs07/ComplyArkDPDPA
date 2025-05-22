import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/shared/DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";

const createRequestStatusSchema = z.object({
  statusName: z.string().min(1, "Status name is required"),
  slaDays: z.number().min(0, "SLA days must be zero or positive"),
  isActive: z.boolean().default(true),
});

type RequestStatus = {
  statusId: number;
  statusName: string;
  slaDays: number;
  isActive: boolean;
};

const RequestStatusForm = ({ existingStatus, onSuccess, onCancel }: {
  existingStatus?: RequestStatus;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const { toast } = useToast();
  const isEditing = !!existingStatus;

  const form = useForm<z.infer<typeof createRequestStatusSchema>>({
    resolver: zodResolver(createRequestStatusSchema),
    defaultValues: existingStatus ? {
      statusName: existingStatus.statusName,
      slaDays: existingStatus.slaDays,
      isActive: existingStatus.isActive
    } : {
      statusName: "",
      slaDays: 5,
      isActive: true
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof createRequestStatusSchema>) => {
      return apiRequest("/api/request-statuses", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request status created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/request-statuses"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create request status",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof createRequestStatusSchema> & { statusId: number }) => {
      return apiRequest(`/api/request-statuses/${data.statusId}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request status updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/request-statuses"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update request status",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof createRequestStatusSchema>) => {
    if (isEditing && existingStatus) {
      updateMutation.mutate({
        ...data,
        statusId: existingStatus.statusId
      });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
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
                <Input 
                  type="number" 
                  placeholder="Enter SLA days" 
                  {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
              <div className="space-y-0">
                <FormLabel>Active Status</FormLabel>
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? "Update" : "Create"} Status
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default function RequestStatusesTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | null>(null);
  const { toast } = useToast();

  const { data: requestStatuses, isLoading } = useQuery({
    queryKey: ["/api/request-statuses"],
    retry: 1
  });

  const handleEdit = (status: RequestStatus) => {
    setSelectedStatus(status);
    setIsEditDialogOpen(true);
  };

  const columns = [
    { key: "statusId", header: "ID" },
    { key: "statusName", header: "Status Name" },
    { key: "slaDays", header: "SLA Days" },
    { 
      key: "isActive", 
      header: "Active",
      render: (value: boolean) => value ? "Yes" : "No"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Request Statuses</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <span className="material-icons text-sm mr-2">add</span>
          Add Status
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">Loading request statuses...</div>
      ) : (
        <DataTable
          columns={columns}
          data={requestStatuses || []}
          onEdit={handleEdit}
        />
      )}

      {/* Add Status Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Request Status</DialogTitle>
          </DialogHeader>
          <RequestStatusForm
            onSuccess={() => setIsAddDialogOpen(false)}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Request Status</DialogTitle>
          </DialogHeader>
          {selectedStatus && (
            <RequestStatusForm
              existingStatus={selectedStatus}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedStatus(null);
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedStatus(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}