import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { isLoading } = useAuth();
  
  // Determine current page title based on location
  const getPageTitle = () => {
    if (location === "/" || location === "/dashboard") return "Dashboard";
    if (location === "/notice") return "Notice Module";
    if (location === "/dpr") return "DPR Requests";
    if (location.startsWith("/admin")) return "Admin Panel";
    if (location === "/settings") return "Settings";
    return "ComplyArk";
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <TopNav 
          title={getPageTitle()}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
