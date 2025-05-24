import { ReactNode } from 'react';
import Sidebar from "../layout/Sidebar";
import TopNav from "../layout/TopNav";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={true} onClose={() => {}} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav title="Admin Dashboard" onMenuClick={() => {}} />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}