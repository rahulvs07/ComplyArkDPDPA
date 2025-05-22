import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
// Using fetch directly since this component needs to handle response parsing
import { Loader2, Copy, CheckCircle2, RefreshCw } from 'lucide-react';

interface RequestPageUrlGeneratorProps {
  organizationId: number;
  organizationName: string;
  currentUrl: string | null;
}

export default function RequestPageUrlGenerator({
  organizationId,
  organizationName,
  currentUrl,
}: RequestPageUrlGeneratorProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState<string>(currentUrl || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateUrl = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/request-page-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate request page URL');
      }
      
      const data = await response.json();
      setUrl(data.requestPageUrl);
      
      toast({
        title: 'URL Generated',
        description: 'Request page URL has been generated successfully.',
      });
    } catch (error) {
      console.error('Error generating URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate request page URL. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      
      toast({
        title: 'Copied!',
        description: 'URL has been copied to clipboard.',
      });
      
      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Error copying URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy URL to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="font-medium text-sm">Request Page URL for {organizationName}</div>
        <p className="text-sm text-muted-foreground">
          This URL allows external users to submit data protection requests and grievances for this organization.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={url}
            readOnly
            className="pr-10 font-mono text-sm"
            placeholder="No URL generated yet"
          />
          {url && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
              onClick={copyToClipboard}
              type="button"
            >
              {isCopied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <Button
          onClick={generateUrl}
          disabled={isGenerating}
          type="button"
          className="flex items-center gap-1 bg-primary hover:bg-primary/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : url ? (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Regenerate</span>
            </>
          ) : (
            <>
              <span>Generate URL</span>
            </>
          )}
        </Button>
      </div>

      {url && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
          <strong>Important:</strong> If you regenerate this URL, the previous URL will no longer work.
          Users will need the new URL to access the request page.
        </div>
      )}
    </div>
  );
}