import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface GoogleLoginButtonProps {
  onSuccess: (email: string) => void;
  organizationId: number;
}

export default function GoogleLoginButton({ onSuccess, organizationId }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Since we don't have the actual Google OAuth integration yet, 
  // this is a simulated version that maintains the same API contract
  // This would be replaced with actual Google authentication in production
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      // Simulate a delay to mimic network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For development/demo purposes, we'll use a static email
      // In production, this would be the email returned from Google
      const email = 'google-user@example.com';
      
      // Simulate API call to verify the Google login on the server
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          provider: 'google',
          organizationId
        })
      });
      
      if (!response.ok) {
        throw new Error('Google authentication failed');
      }
      
      // Store authenticated status in session storage
      sessionStorage.setItem('otp_verified', 'true');
      sessionStorage.setItem('otp_email', email);
      
      // Call the success callback with the email
      onSuccess(email);
      
      toast({
        title: 'Login Successful',
        description: `Authenticated with Google as ${email}`,
      });
    } catch (error) {
      console.error('Error during Google login:', error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Failed to authenticate with Google',
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
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-gray-300"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
      )}
      <span>{isLoading ? 'Authenticating...' : 'Continue with Google'}</span>
    </Button>
  );
}