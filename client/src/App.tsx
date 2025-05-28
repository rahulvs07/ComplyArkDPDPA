import { Route, Switch } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard/index";
import NoticeModule from "@/pages/notice";
import DPRModule from "@/pages/dpr";
import DPRDetailPage from "@/pages/dpr/DetailPage";
import GrievancesPage from "@/pages/GrievancesPage";
import GrievanceDetailPage from "@/pages/grievances/DetailPage";
import ComplianceDocumentsPage from "@/pages/compliance-documents";
import AdminPanel from "@/pages/admin";
import AdminOrganizations from "@/pages/admin/organizations";
import AdminUsers from "@/pages/admin/users";
import AdminIndustries from "@/pages/admin/industries";
import AdminTemplates from "@/pages/admin/templates";
import EmailSettings from "@/pages/admin/email-settings";
import OtpTestingPage from "@/pages/admin/otp-testing";
import ExceptionLogs from "@/pages/admin/exception-logs";
import UserSettings from "@/pages/user/settings";
import WelcomePage from "@/pages/welcome";
import RequestPage from "@/pages/RequestPage";
import RequestPageNew from "@/pages/request-page/index";
import RequestStatusPage from "@/pages/RequestStatusPage";
import OTPAuthPage from "@/pages/OTPAuthPage";
import OTPVerificationPage from "@/pages/otp-verification-simple";
import OtpTestPage from "@/pages/otp-test";
// React is already imported by JSX
import { AuthProvider, useAuth } from "@/lib/auth";
import AppLayout from "./components/layout/AppLayout";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { registerGlobalErrorHandler } from "@/lib/exceptionLogger";

// Protected route component that redirects to login if not authenticated
function ProtectedRoute({ component: Component, adminOnly = false, superAdminOnly = false, ...rest }: { 
  component: React.ComponentType<any>;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  [key: string]: any;
}) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }
  
  // Check for superadmin access - only complyarkadmin can access these routes
  if (superAdminOnly && user?.username !== 'complyarkadmin') {
    console.log('Access denied: SuperAdmin access required');
    return <NotFound />;
  }
  
  // Check for admin access - organization admins can access these routes
  if (adminOnly && user?.role && user.role !== 'admin' && user.role !== 'superadmin') {
    console.log('Access denied: Admin access required');
    return <NotFound />;
  }
  
  return <Component {...rest} />;
}

// App router to handle navigation
function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/dashboard">
        <AppLayout>
          <ProtectedRoute component={Dashboard} />
        </AppLayout>
      </Route>
      
      <Route path="/" component={Login} />
      
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

      <Route path="/grievances/:id">
        <AppLayout>
          <ProtectedRoute component={GrievanceDetailPage} />
        </AppLayout>
      </Route>
      
      <Route path="/compliance-documents">
        <AppLayout>
          <ProtectedRoute component={ComplianceDocumentsPage} />
        </AppLayout>
      </Route>
      
      <Route path="/admin">
        <AppLayout>
          <ProtectedRoute component={AdminPanel} superAdminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/organizations">
        <AppLayout>
          <ProtectedRoute component={AdminOrganizations} superAdminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/users">
        <AppLayout>
          <ProtectedRoute component={AdminUsers} adminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/industries">
        <AppLayout>
          <ProtectedRoute component={AdminIndustries} superAdminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/templates">
        <AppLayout>
          <ProtectedRoute component={AdminTemplates} superAdminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/email-settings">
        <AppLayout>
          <ProtectedRoute component={EmailSettings} adminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/otp-testing">
        <AppLayout>
          <ProtectedRoute component={OtpTestingPage} adminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/exception-logs">
        <AppLayout>
          <ProtectedRoute component={ExceptionLogs} superAdminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/admin/request-statuses">
        <AppLayout>
          <ProtectedRoute component={RequestStatusPage} superAdminOnly={true} />
        </AppLayout>
      </Route>
      
      <Route path="/settings">
        <AppLayout>
          <ProtectedRoute component={UserSettings} />
        </AppLayout>
      </Route>
      
      {/* Public routes for external request submissions */}
      <Route path="/auth/otp/:orgId/:token?" component={OTPAuthPage} />
      <Route path="/request/:orgId/:type?" component={RequestPage} />
      <Route path="/otp-verification/:token" component={OTPVerificationPage} />
      <Route path="/request-page/:token" component={OTPVerificationPage} />
      <Route path="/request-form/:token" component={RequestPageNew} />
      <Route path="/request-status" component={RequestStatusPage} />
      <Route path="/otp-test" component={OtpTestPage} />
      
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
