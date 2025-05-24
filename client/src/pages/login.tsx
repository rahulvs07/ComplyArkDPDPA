import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface LoginCredentials {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: ""
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginCredentials) => {
      return apiRequest("POST", "/api/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "Welcome to ComplyArk!",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-black dark:text-white">Comply</span>
              <span className="text-blue-600">Ark</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Simplifying Data Protection Compliance
            </p>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Login to Your Account</CardTitle>
              <CardDescription>
                Enter your credentials to access the DPDPA compliance platform
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={credentials.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : "Login"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="hidden md:flex flex-col justify-center items-center bg-blue-600 rounded-lg p-8">
          <div className="text-white max-w-md">
            <h2 className="text-2xl font-bold mb-4">Streamline Your Compliance Workflow</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Manage data protection requests and grievances efficiently</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Generate privacy notices with customizable templates</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Track compliance documentation in a centralized repository</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Real-time notifications for status updates and deadlines</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}