import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, RefreshCw } from 'lucide-react';

interface RequestPageUrlGeneratorProps {
  organizationId: number;
  currentUrl: string | null;
}

export default function RequestPageUrlGenerator({ 
  organizationId, 
  currentUrl 
}: RequestPageUrlGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState<string>(currentUrl || '');

  // Generate URL mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/request-page-url`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate Request Page URL');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUrl(data.url);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      toast({
        title: 'URL Generated',
        description: 'Request Page URL has been generated successfully.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate Request Page URL.',
        variant: 'destructive',
      });
    }
  });

  // Copy URL to clipboard
  const copyToClipboard = () => {
    if (!url) return;
    
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: 'URL Copied',
        description: 'The URL has been copied to your clipboard.'
      });
    }).catch(() => {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy URL to clipboard.',
        variant: 'destructive',
      });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Request Page URL</label>
        <div className="flex gap-2">
          <Input 
            value={url} 
            readOnly 
            placeholder="Generate a URL first" 
            className="flex-1"
          />
          {url && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => generateMutation.mutate()} 
            disabled={generateMutation.isPending}
            title="Generate new URL"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          This URL will allow external users to submit data protection requests and grievances for this organization.
        </p>
      </div>
    </div>
  );
}