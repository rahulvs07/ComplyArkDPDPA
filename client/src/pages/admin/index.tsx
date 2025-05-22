import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationsTab from "./organizations";
import UsersTab from "./users";
import IndustriesTab from "./industries";
import TemplatesTab from "./templates";
import RequestStatusesTab from "./requeststatuses";

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("organizations");
  
  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
          <h1 className="text-2xl font-display font-semibold text-neutral-800">Access Denied</h1>
          <p className="text-neutral-600 mt-1">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-neutral-800">Admin Panel</h1>
            <p className="text-neutral-600 mt-1">Manage organizations, users, industries, templates, and request statuses.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center">
                <span className="material-icons text-sm mr-2">arrow_back</span>
                <span>Back to Application</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full border-b border-neutral-200 h-auto rounded-none gap-0">
            <TabsTrigger 
              value="organizations" 
              className="px-6 py-3 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
            >
              Organizations
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="px-6 py-3 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="industries" 
              className="px-6 py-3 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
            >
              Industry
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="px-6 py-3 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="requeststatuses" 
              className="px-6 py-3 text-sm rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
            >
              Request Statuses
            </TabsTrigger>
          </TabsList>
          
          <CardContent className="p-6">
            <TabsContent value="organizations" className="m-0">
              <OrganizationsTab />
            </TabsContent>
            
            <TabsContent value="users" className="m-0">
              <UsersTab />
            </TabsContent>
            
            <TabsContent value="industries" className="m-0">
              <IndustriesTab />
            </TabsContent>
            
            <TabsContent value="templates" className="m-0">
              <TemplatesTab />
            </TabsContent>
            
            <TabsContent value="requeststatuses" className="m-0">
              <RequestStatusesTab />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
