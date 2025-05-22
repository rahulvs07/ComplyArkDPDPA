import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="h-16 w-16 rounded-lg bg-primary-500 flex items-center justify-center mx-auto">
            <span className="text-white font-display font-bold text-3xl">C</span>
          </div>
          
          <h1 className="text-3xl font-semibold mt-6">Welcome to ComplyArk</h1>
          <p className="text-neutral-600 mt-3 mb-8">
            Your complete DPDPA compliance management solution
          </p>
          
          <div className="space-y-4">
            <Link href="/login">
              <Button className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md">
                Sign in to your account
              </Button>
            </Link>
            
            <Link href="/login-test">
              <Button variant="outline" className="w-full py-2 px-4 font-medium rounded-md">
                Testing Login Page
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-neutral-500">
            <p>Demo Credentials:</p>
            <p>Admin: complyarkadmin / complyarkadmin</p>
            <p>User: hospital_user / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}