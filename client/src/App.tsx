import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import EmailSettingsPage from "./pages/admin/email-settings-simple";
import LoginPage from "./pages/login/index";
import { useState, useEffect } from "react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // For demo purposes, we'll check if the user has visited the login page
  useEffect(() => {
    const hasVisitedLogin = localStorage.getItem("hasVisitedLogin");
    if (hasVisitedLogin) {
      setIsAuthenticated(true);
    }
  }, []);

  // This would normally be handled by the auth provider
  const handleLogin = () => {
    localStorage.setItem("hasVisitedLogin", "true");
    setIsAuthenticated(true);
  };

  // Set authentication when login completes
  useEffect(() => {
    const handleLoginSuccess = () => {
      setIsAuthenticated(true);
    };
    
    // Listen for custom login event
    window.addEventListener('login-success', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('login-success', handleLoginSuccess);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <Switch>
          <Route path="/login">
            <LoginPage />
          </Route>
          
          <Route path="/admin/email-settings">
            {isAuthenticated ? <EmailSettingsPage /> : <Redirect to="/login" />}
          </Route>
          
          <Route path="/dashboard">
            {isAuthenticated ? (
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">
                  <span className="text-black dark:text-white">Comply</span>
                  <span className="text-blue-600">Ark</span> Dashboard
                </h1>
                <p className="mb-4">Email notification system has been integrated.</p>
                <a href="/admin/email-settings" className="text-blue-600 hover:underline">
                  Go to Email Settings
                </a>
              </div>
            ) : <Redirect to="/login" />}
          </Route>
          
          <Route path="/">
            <Redirect to="/login" />
          </Route>
        </Switch>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;