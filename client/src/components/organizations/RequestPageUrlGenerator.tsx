import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, RefreshCw, Check, Link, ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface RequestPageUrlGeneratorProps {
  organizationId: number;
  organizationName: string;
  currentUrl: string | null;
}

export default function RequestPageUrlGenerator({ 
  organizationId, 
  organizationName,
  currentUrl 
}: RequestPageUrlGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [requestPageUrl, setRequestPageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize with current URL if provided
  useEffect(() => {
    if (currentUrl) {
      setRequestPageUrl(currentUrl);
    }
  }, [currentUrl]);

  // Generate or regenerate request page URL
  const generateRequestPageUrl = async () => {
    setIsGenerating(true);
    
    try {
      console.log(`Generating request page URL for organization ${organizationId}...`);
      
      const response = await fetch(`/api/organizations/${organizationId}/request-page-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate request page URL');
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.requestPageUrl) {
        setRequestPageUrl(data.requestPageUrl);
        
        toast({
          title: 'URL Generated',
          description: 'Request page URL has been generated successfully.',
        });
        
        // Invalidate organization queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId] });
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      console.error('Error generating request page URL:', error);
      
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to generate request page URL',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Copy URL to clipboard
  const copyToClipboard = async () => {
    if (!requestPageUrl) return;
    
    try {
      await navigator.clipboard.writeText(requestPageUrl);
      setIsCopied(true);
      
      toast({
        title: 'Copied',
        description: 'URL copied to clipboard',
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to copy URL to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Open URL in new tab
  const openUrl = () => {
    if (!requestPageUrl) return;
    window.open(requestPageUrl, '_blank');
  };
  
  return (
    <Card className="border-primary-100">
      <CardHeader className="bg-primary-50 border-b border-primary-100">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-primary-600" />
          <CardTitle className="text-xl">Request Page URL</CardTitle>
        </div>
        <CardDescription>
          Generate a unique URL for {organizationName} where external users can submit data protection
          requests and grievances.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {requestPageUrl && (
          <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              If you regenerate this URL, the previous URL will no longer work. Users will need the new URL to access the request page.
            </AlertDescription>
          </Alert>
        )}
      
        {requestPageUrl ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                value={requestPageUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                disabled={!requestPageUrl}
                className="flex-shrink-0"
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={openUrl}
                disabled={!requestPageUrl}
                className="flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this URL with individuals who need to submit data protection requests or
              grievances to this organization. Users will need to verify their email with an OTP.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 flex flex-col items-center justify-center">
            <div className="text-center">
              <Link className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">No Request Page URL</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate a URL to allow external users to submit requests.
              </p>
              <Button
                onClick={generateRequestPageUrl}
                disabled={isGenerating}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Generate URL</>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {requestPageUrl && (
        <CardFooter className="bg-gray-50 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={generateRequestPageUrl}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate URL
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}