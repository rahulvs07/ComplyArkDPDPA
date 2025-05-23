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
import Logo from "@/components/Logo";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md flex flex-col items-center bg-white p-8 rounded-lg">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <Logo size="lg" />
          <p className="text-center text-gray-700 font-medium">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2E77AE] focus:border-[#2E77AE]"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2E77AE] focus:border-[#2E77AE]"
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
                className="h-4 w-4 text-[#2E77AE] focus:ring-[#2E77AE]"
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
                className="text-[#2E77AE] hover:text-[#0F3460]"
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
              className="w-full bg-[#2E77AE] hover:bg-[#0F3460] text-white py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#2E77AE] focus:ring-offset-2"
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

        <div className="mt-4 text-center text-sm">
          <a
            href="#"
            className="text-[#2E77AE] hover:text-[#0F3460]"
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
  );
}
