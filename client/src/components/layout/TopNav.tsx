import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Menu, LogOut, HelpCircle } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/ui/notification-bell";

interface TopNavProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopNav({ title, onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      // Redirect will happen automatically via the auth context
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between shadow-sm dark:shadow-none">
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-muted"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      <div className="flex-1 lg:ml-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notification Bell */}
        <NotificationBell />
        
        {/* Help Button */}
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center">
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
        
        <div className="border-l border-border h-8 mx-2"></div>
        
        {user && (
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center cursor-pointer space-x-2">
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.role === 'admin' ? 'Admin' : 'User'}</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <span className="material-icons text-sm">person</span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/settings" className="cursor-pointer">
                    <span className="material-icons text-sm mr-2">settings</span>
                    Settings
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
