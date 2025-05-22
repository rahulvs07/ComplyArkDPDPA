import { Route, Switch } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import LoginTest from "@/pages/login-test";
import Dashboard from "@/pages/dashboard";
import NoticeModule from "@/pages/notice";
import DPRModule from "@/pages/dpr";
import DPRDetailPage from "@/pages/dpr/DetailPage";
import GrievancesPage from "@/pages/GrievancesPage";
import ComplianceDocumentsPage from "@/pages/ComplianceDocumentsPage";
import AdminPanel from "@/pages/admin";
import AdminOrganizations from "@/pages/admin/organizations";
import AdminUsers from "@/pages/admin/users";
import AdminIndustries from "@/pages/admin/industries";
import AdminTemplates from "@/pages/admin/templates";
import UserSettings from "@/pages/user/settings";
import WelcomePage from "@/pages/welcome";
import RequestPage from "@/pages/RequestPage";
import RequestStatusPage from "@/pages/RequestStatusPage";
// React is already imported by JSX
import { AuthProvider, useAuth } from "@/lib/auth";
import AppLayout from "./components/layout/AppLayout";
import { ThemeProvider } from "@/components/providers/theme-provider";

// Protected route component that redirects to login if not authenticated
function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: { 
  component: React.ComponentType<any>;
  adminOnly?: boolean;
  [key: string]: any;
}) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <NotFound />;
  }
  
  return <Component {...rest} />;
}

// App router to handle navigation
function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/login-test" component={LoginTest} />
      
      <Route path="/dashboard">
        <AppLayout>
          <ProtectedRoute component={Dashboard} />
        </AppLayout>
      </Route>
      
      <Route path="/" component={WelcomePage} />
      
      <Route path="/notice">
        <AppLayout>
          <ProtectedRoute component={NoticeModule} />
        </AppLayout>
      </Route>
      
      <Route path="/dpr">
        <AppLayout>
          <ProtectedRoute component={DPRModule} />
        </AppLayout>
      </Route>
      
      <Route path="/dpr/:requestId">
        <AppLayout>
          <ProtectedRoute component={DPRDetailPage} />
        </AppLayout>
      </Route>
      
      <Route path="/grievances">
        <AppLayout>
          <ProtectedRoute component={GrievancesPage} />
        </AppLayout>
      </Route>

      {/* Temporarily disabled Grievances detail page until backend is ready */}
      <Route path="/grievances/:id">
        <AppLayout>
          <ProtectedRoute component={GrievancesPage} />
        </AppLayout>
      </Route>
      
      <Route path="/compliance-documents">
        <AppLayout>
          <ProtectedRoute component={ComplianceDocumentsPage} />
        </AppLayout>
      </Route>
      
      <Route path="/admin">
        <AppLayout>
          <ProtectedRoute component={AdminPanel} adminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/organizations">
        <AppLayout>
          <ProtectedRoute component={AdminOrganizations} adminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/users">
        <AppLayout>
          <ProtectedRoute component={AdminUsers} adminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/industries">
        <AppLayout>
          <ProtectedRoute component={AdminIndustries} adminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/templates">
        <AppLayout>
          <ProtectedRoute component={AdminTemplates} adminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/request-statuses">
        <AppLayout>
          <ProtectedRoute component={RequestStatusPage} adminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/settings">
        <AppLayout>
          <ProtectedRoute component={UserSettings} />
        </AppLayout>
      </Route>
      
      {/* Public routes for external request submissions */}
      <Route path="/request-page/:token" component={RequestPage} />
      <Route path="/request-status" component={RequestStatusPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="complyark-theme">
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
