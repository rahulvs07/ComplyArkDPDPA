import { useAuth } from "@/lib/auth";

interface TopNavProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopNav({ title, onMenuClick }: TopNavProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-2 flex items-center justify-between">
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden p-2 rounded-md text-neutral-500 hover:bg-neutral-100"
        onClick={onMenuClick}
      >
        <span className="material-icons">menu</span>
      </button>
      
      <div className="flex-1 lg:ml-4">
        <h2 className="text-lg font-display font-semibold text-neutral-800">{title}</h2>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 flex items-center justify-center">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>
        </div>
        
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 flex items-center justify-center">
            <span className="material-icons">help_outline</span>
          </button>
        </div>
        
        <div className="border-l border-neutral-200 h-8 mx-2"></div>
        
        {user && (
          <div className="relative">
            <div className="flex items-center cursor-pointer space-x-2">
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-neutral-500">{user.role === 'admin' ? 'Admin' : 'User'}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-neutral-200 flex items-center justify-center">
                <span className="material-icons text-neutral-600">person</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
