import { ReactNode, useState } from 'react';
import Sidebar from "../layout/Sidebar";
import TopNav from "../layout/TopNav";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = "Admin Dashboard" }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav title={title} onMenuClick={handleMenuClick} />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}