import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu } from "lucide-react";

interface TopNavProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopNav({ title, onMenuClick }: TopNavProps) {
  const { user } = useAuth();

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
        
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>
        </div>
        
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center">
            <span className="material-icons">help_outline</span>
          </button>
        </div>
        
        <div className="border-l border-border h-8 mx-2"></div>
        
        {user && (
          <div className="relative">
            <div className="flex items-center cursor-pointer space-x-2">
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground">{user.role === 'admin' ? 'Admin' : 'User'}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                <span className="material-icons text-sm">person</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
