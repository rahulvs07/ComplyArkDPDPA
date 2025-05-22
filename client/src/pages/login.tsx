import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Shield, LockIcon, BadgeCheckIcon, LayoutDashboardIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setIsRedirecting(true);
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Show loading state if we're authenticating or redirecting
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">
            {isRedirecting ? "Redirecting..." : "Authenticating..."}
          </p>
        </div>
      </div>
    );
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoadingLogin(true);
    setSuccess("");
    
    try {
      await login(username, password);
      setSuccess(`Login successful! Redirecting to dashboard...`);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLogin(false);
    }
  };
  
  return (
    <div className="flex min-h-screen">
      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 lg:px-16 xl:px-28">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">ComplyArk</h1>
            <p className="text-sm text-gray-600">DPDPA Compliance Management System</p>
          </div>
          
          {/* Login form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <input 
                id="email"
                type="text"
                placeholder="Email address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <input 
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox 
                  id="remember-me" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="text-blue-500 hover:text-blue-600" onClick={(e) => e.preventDefault()}>
                  Forgot your password?
                </a>
              </div>
            </div>
            
            <div>
              <button 
                type="submit"
                disabled={isLoadingLogin}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoadingLogin ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
          
          {success && (
            <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-center w-full">
              {success}
            </div>
          )}
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <a href="#" className="text-blue-500 hover:text-blue-600" onClick={(e) => e.preventDefault()}>
              Administrator Login
            </a>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Demo Credentials:</p>
            <p>Admin: complyarkadmin / complyarkadmin</p>
            <p>User: user / password</p>
          </div>
        </div>
      </div>
      
      {/* Right side - Banner image */}
      <div className="hidden lg:block lg:w-1/2 bg-blue-600 relative">
        <div className="absolute inset-0 p-12 flex flex-col justify-center text-white">
          <h2 className="text-3xl font-bold mb-4">Streamline Your DPDPA Compliance</h2>
          <p className="mb-8">Comprehensive tools to manage data protection and privacy policies efficiently.</p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/20 p-2 rounded-full">
                <LockIcon className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold">Enhanced Security</h3>
                <p className="text-sm text-white/80">Protect sensitive data with robust compliance tools</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/20 p-2 rounded-full">
                <BadgeCheckIcon className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold">Automated Compliance</h3>
                <p className="text-sm text-white/80">Simplify compliance processes with automated workflows</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/20 p-2 rounded-full">
                <LayoutDashboardIcon className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold">Comprehensive Tools</h3>
                <p className="text-sm text-white/80">All-in-one platform for notice generation and management</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
