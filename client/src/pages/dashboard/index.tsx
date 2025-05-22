import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardNew } from '@/components/dashboard/DashboardNew';

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardNew />
    </AppLayout>
  );
}