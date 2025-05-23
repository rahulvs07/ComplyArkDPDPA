import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  notificationId: number;
  userId: number;
  organizationId: number;
  module: string;
  action: string;
  actionType: string;
  timestamp: string;
  status: string;
  initiator: string;
  message: string;
  isRead: boolean;
  userName: string;
  minutesAgo: number;
  relatedItemId?: number;
  relatedItemType?: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading, refetch } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications?limit=5');
      return await res.json() as Notification[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch unread notification count
  const { data: unreadCount, isLoading: countLoading } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications/unread-count');
      const data = await res.json();
      return data.count;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Mark notifications as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds?: number[]) => {
      const res = await apiRequest('PUT', '/api/notifications/mark-as-read', { 
        body: JSON.stringify({ notificationIds })
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to mark notifications as read: ${error}`,
        variant: 'destructive'
      });
    }
  });

  // Mark all as read when the popover opens
  useEffect(() => {
    if (open && notifications && notifications.some(n => !n.isRead)) {
      markAsReadMutation.mutate(undefined);
    }
  }, [open, notifications, markAsReadMutation]);

  const formatTimeAgo = (minutes: number) => {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  // Get notification type icon based on module
  const getModuleColor = (module: string) => {
    switch (module) {
      case 'DPR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Grievance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'Notice':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Document':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'Admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {!countLoading && unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-blue-600" 
              variant="secondary"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-medium text-sm">Notifications</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs flex items-center gap-1"
            onClick={() => refetch()}
          >
            <Check className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
        <Separator />
        <div className="max-h-[300px] overflow-y-auto">
          {notificationsLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="py-1">
              {notifications.map((notification) => (
                <Card key={notification.notificationId} className="rounded-none border-0 border-b last:border-0">
                  <div className="p-3 flex gap-3">
                    <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", getModuleColor(notification.module))}>
                      <span className="text-xs font-medium">{notification.module[0]}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium line-clamp-2">{notification.message}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatTimeAgo(notification.minutesAgo)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{notification.userName}</span>
                        <span>•</span>
                        <span>{notification.actionType}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          )}
        </div>
        <Separator />
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}