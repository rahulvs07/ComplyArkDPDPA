import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import EmailSettingsPage from "./pages/admin/email-settings";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <Switch>
          <Route path="/admin/email-settings" component={EmailSettingsPage} />
          <Route path="/">
            <h1>ComplyArk Dashboard</h1>
            <p>Email notification system has been integrated.</p>
            <a href="/admin/email-settings" className="text-blue-600 hover:underline">
              Go to Email Settings
            </a>
          </Route>
        </Switch>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;