import { Link } from "wouter";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <h2 className="text-lg font-semibold">
          <span className="text-black dark:text-white">Comply</span>
          <span className="text-blue-600">Ark</span>
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className="p-4 space-y-2">
        <Link href="/admin">
          <a className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            Dashboard
          </a>
        </Link>
        <Link href="/admin/email-settings">
          <a className="flex items-center px-3 py-2 text-sm rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <Settings className="h-4 w-4 mr-2" />
            Email Settings
          </a>
        </Link>
      </nav>
    </div>
  );
}