import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => {
    return location === path || (path !== "/" && location.startsWith(path));
  };

  return (
    <aside 
      className={cn(
        "sidebar w-64 bg-background dark:bg-background shadow-md flex-shrink-0 h-full z-20 fixed lg:relative transition-all lg:translate-x-0 custom-scrollbar",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo Area */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="font-bold text-xl">
              <span className="text-foreground">Comply</span>
              <span className="text-[#2E77AE]">Ark</span>
            </span>
          </div>
        </div>
        <button 
          className="lg:hidden text-neutral-500 hover:text-neutral-800" 
          onClick={onClose}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#2E77AE]/20 flex items-center justify-center">
              <span className="text-[#2E77AE] font-semibold">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-neutral-500">{user.role === 'admin' ? 'Admin' : 'User'}</p>
            </div>
          </div>
          <div className="mt-2 p-2 rounded bg-neutral-50 text-sm">
            <p className="text-xs text-neutral-500">Organization:</p>
            <p className="font-medium truncate">{user.organizationName}</p>
          </div>
        </div>
      )}
      
      {/* Navigation Links */}
      <nav className="p-2">
        <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase">Main</p>
        
        <Link href="/dashboard" className={cn(
            "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
            isActive("/dashboard") || isActive("/") 
              ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
              : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
          )}>
            <span className="material-icons mr-3">dashboard</span>
            <span>Dashboard</span>
        </Link>
        
        <Link href="/notice" className={cn(
            "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
            isActive("/notice") 
              ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
              : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
          )}>
            <span className="material-icons mr-3">description</span>
            <span>Notice Module</span>
        </Link>
        
        <Link href="/dpr" className={cn(
            "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
            isActive("/dpr") 
              ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
              : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
          )}>
            <span className="material-icons mr-3">assignment</span>
            <span>DPR Requests</span>
        </Link>

        <Link href="/grievances" className={cn(
            "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
            isActive("/grievances") 
              ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
              : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
          )}>
            <span className="material-icons mr-3">report_problem</span>
            <span>Grievances</span>
        </Link>
        
        <Link href="/compliance-documents" className={cn(
            "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
            isActive("/compliance-documents") 
              ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
              : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
          )}>
            <span className="material-icons mr-3">folder</span>
            <span>Compliance Docs</span>
        </Link>
        
        {/* Organization Admin section - only visible to organization admins */}
        {user?.role === 'admin' && (
          <>
            <p className="px-4 py-2 mt-6 text-xs font-semibold text-neutral-500 uppercase">Organization Admin</p>
            
            <Link href="/admin/users" className={cn(
                "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
                isActive("/admin/users") 
                  ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
                  : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
              )}>
                <span className="material-icons mr-3">people</span>
                <span>Users</span>
            </Link>
          </>
        )}
        
        {/* SuperAdmin section - only visible to complyarkadmin */}
        {user?.username === 'complyarkadmin' && (
          <>
            <p className="px-4 py-2 mt-6 text-xs font-semibold text-neutral-500 uppercase">SuperAdmin</p>
            
            <Link href="/admin" className={cn(
                "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
                (isActive("/admin") && !isActive("/admin/users") && !isActive("/admin/organizations") 
                 && !isActive("/admin/industries") && !isActive("/admin/templates"))
                  ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
                  : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
              )}>
                <span className="material-icons mr-3">admin_panel_settings</span>
                <span>Admin Dashboard</span>
            </Link>

            <Link href="/admin/organizations" className={cn(
                "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
                isActive("/admin/organizations")
                  ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
                  : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
              )}>
                <span className="material-icons mr-3">business</span>
                <span>Organizations</span>
            </Link>

            <Link href="/admin/users" className={cn(
                "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
                isActive("/admin/users")
                  ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
                  : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
              )}>
                <span className="material-icons mr-3">people</span>
                <span>Users</span>
            </Link>

            <Link href="/admin/industries" className={cn(
                "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
                isActive("/admin/industries")
                  ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
                  : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
              )}>
                <span className="material-icons mr-3">category</span>
                <span>Industries</span>
            </Link>

            <Link href="/admin/templates" className={cn(
                "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
                isActive("/admin/templates")
                  ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
                  : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
              )}>
                <span className="material-icons mr-3">file_copy</span>
                <span>Templates</span>
            </Link>

            <Link href="/admin/request-statuses" className={cn(
                "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
                isActive("/admin/request-statuses")
                  ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
                  : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
              )}>
                <span className="material-icons mr-3">list_alt</span>
                <span>Request Statuses</span>
            </Link>

            <Link href="/admin/exception-logs" className={cn(
                "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
                isActive("/admin/exception-logs")
                  ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
                  : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
              )}>
                <span className="material-icons mr-3">bug_report</span>
                <span>Exception Logs</span>
            </Link>
          </>
        )}
        
        <p className="px-4 py-2 mt-6 text-xs font-semibold text-neutral-500 uppercase">Account</p>
        
        <Link href="/settings" className={cn(
            "sidebar-item flex items-center px-4 py-3 rounded-md cursor-pointer",
            isActive("/settings") 
              ? "active text-[#2E77AE] bg-[#2E77AE]/10" 
              : "text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
          )}>
            <span className="material-icons mr-3">settings</span>
            <span>Settings</span>
        </Link>
        
        <button 
          onClick={() => logout()}
          className="sidebar-item w-full text-left flex items-center px-4 py-3 rounded-md cursor-pointer text-neutral-600 hover:text-[#2E77AE] hover:bg-[#2E77AE]/5"
        >
          <span className="material-icons mr-3">logout</span>
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
