import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface MicrosoftLoginButtonProps {
  onSuccess: (email: string) => void;
  organizationId: number;
}

export default function MicrosoftLoginButton({ onSuccess, organizationId }: MicrosoftLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Simulated Microsoft login
  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    
    try {
      // Simulate a delay to mimic network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For development/demo purposes, we'll use a static email
      const email = 'microsoft-user@example.com';
      
      // Simulate API call to verify the Microsoft login on the server
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          provider: 'microsoft',
          organizationId
        })
      });
      
      if (!response.ok) {
        throw new Error('Microsoft authentication failed');
      }
      
      // Store authenticated status in organization-specific session storage
      sessionStorage.setItem(`otp_verified_${organizationId}`, 'true');
      sessionStorage.setItem(`otp_email_${organizationId}`, email);
      
      // Call the success callback with the email
      onSuccess(email);
      
      toast({
        title: 'Login Successful',
        description: `Authenticated with Microsoft as ${email}`,
      });
    } catch (error) {
      console.error('Error during Microsoft login:', error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Failed to authenticate with Microsoft',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleMicrosoftLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-gray-300"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 23 23">
          <path fill="#f3f3f3" d="M0 0h23v23H0z" />
          <path fill="#f35325" d="M1 1h10v10H1z" />
          <path fill="#81bc06" d="M12 1h10v10H12z" />
          <path fill="#05a6f0" d="M1 12h10v10H1z" />
          <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
      )}
      <span>{isLoading ? 'Authenticating...' : 'Continue with Microsoft'}</span>
    </Button>
  );
}