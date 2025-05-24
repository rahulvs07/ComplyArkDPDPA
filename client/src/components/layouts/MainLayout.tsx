import { Outlet } from "wouter";
import Sidebar from "../layout/Sidebar";
import TopNav from "../layout/TopNav";

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}