import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  BarChart2,
  FileText,
  Settings,
  Users,
  Clipboard,
  MessageSquare,
  Mail,
  LogOut,
  ChevronDown,
  Bell
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <BarChart2 className="w-5 h-5 mr-2" /> },
    { name: "DPR", path: "/dpr", icon: <Clipboard className="w-5 h-5 mr-2" /> },
    { name: "Grievances", path: "/grievances", icon: <MessageSquare className="w-5 h-5 mr-2" /> },
    { name: "Notices", path: "/notices", icon: <FileText className="w-5 h-5 mr-2" /> },
    { name: "Documents", path: "/documents", icon: <FileText className="w-5 h-5 mr-2" /> },
  ];
  
  // Admin-only nav items
  const adminNavItems = [
    { name: "Organizations", path: "/admin/organizations", icon: <Users className="w-5 h-5 mr-2" /> },
    { name: "Users", path: "/admin/users", icon: <Users className="w-5 h-5 mr-2" /> },
    { name: "Email Settings", path: "/admin/email-settings", icon: <Mail className="w-5 h-5 mr-2" /> },
    { name: "Settings", path: "/admin/settings", icon: <Settings className="w-5 h-5 mr-2" /> },
  ];
  
  const handleLogout = async () => {
    await logout();
    setLocation("/auth");
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/dashboard">
              <a className="flex items-center mr-10">
                <span className="font-bold text-2xl">
                  <span className="text-foreground dark:text-white">Comply</span>
                  <span className="text-[#2E77AE]">Ark</span>
                </span>
              </a>
            </Link>
            
            {/* Main Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      location === item.path
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </a>
                </Link>
              ))}
              
              {/* Admin Menu Dropdown */}
              {user?.role === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                        location.startsWith("/admin")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Admin
                      <ChevronDown className="ml-1 w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Admin Controls</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {adminNavItems.map((item) => (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link href={item.path}>
                          <a className="flex items-center w-full">
                            {item.icon}
                            {item.name}
                          </a>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
          </div>
          
          {/* Right Side - User Menu */}
          <div className="flex items-center space-x-4">
            <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-sm font-medium text-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <span className="ml-2 hidden md:block">{user?.firstName} {user?.lastName}</span>
                  <ChevronDown className="ml-1 w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="font-normal text-sm text-muted-foreground">Signed in as</div>
                  <div className="font-medium">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="flex w-full cursor-pointer">My Profile</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow bg-muted/30">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="py-4 px-4 border-t bg-background">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ComplyArk - Simplifying Data Protection Compliance
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;