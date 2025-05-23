import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  LockIcon,
  BadgeCheckIcon,
  LayoutDashboardIcon,
} from "lucide-react";
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
        setLocation("/dashboard");
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
            <div className="mb-4">
              <div className="flex items-center">
                <span className="font-bold text-3xl">
                  <span className="text-foreground dark:text-white">Comply</span>
                  <span className="text-[#2E77AE]">Ark</span>
                </span>
              </div>
            </div>
            <p className="text-sm text-foreground dark:text-gray-300">
              DPDPA Compliance Management System
            </p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2E77AE] focus:border-[#2E77AE]"
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
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="text-blue-500 hover:text-blue-600"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoadingLogin}
                className="w-full bg-[#2E77AE] hover:bg-[#0F3460] text-white py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#2E77AE] focus:ring-offset-2"
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
            <a
              href="#"
              className="text-blue-500 hover:text-blue-600"
              onClick={(e) => e.preventDefault()}
            >
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

      {/* Right side - Geometric Abstract Image */}
      <div className="hidden lg:block lg:w-1/2 bg-[#050b23] relative overflow-hidden">
        {/* Background image with animation */}
        <div className="absolute inset-0 bg-center bg-no-repeat bg-cover flex flex-col items-center justify-center" 
             style={{ 
               backgroundImage: "url('/hero-compliance-abstract.png')",
               animation: "pulse 8s ease-in-out infinite alternate"
             }}>
          <div className="absolute inset-0" 
               style={{
                 background: "radial-gradient(circle at center, transparent 30%, #050b23 90%)"
               }}>
          </div>
        </div>
        
        {/* Tagline with animation */}
        <div className="absolute inset-0 flex flex-col justify-end items-center pb-20 z-10">
          <div className="text-center px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4"
                style={{ 
                  textShadow: "0 0 15px rgba(46, 119, 174, 0.5), 0 0 30px rgba(46, 119, 174, 0.3)",
                  animation: "fadeIn 2s ease-out"
                }}>
              Simplifying Data Protection
            </h2>
            <h2 className="text-4xl md:text-5xl font-bold text-white"
                style={{ 
                  textShadow: "0 0 15px rgba(46, 119, 174, 0.5), 0 0 30px rgba(46, 119, 174, 0.3)",
                  animation: "fadeIn 2s ease-out 0.5s both"
                }}>
              Compliance
            </h2>
          </div>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
