'use client';

import { AdminDashboard } from '../../../../blocks/admin-dashboard/admin-dashboard';
import type {
  AdminDashboardStat,
  AdminDashboardActivity,
} from '../../../../blocks/admin-dashboard/admin-dashboard';
import { Button } from '../../../../components/ui/button/button';

const DEMO_STATS: AdminDashboardStat[] = [
  {
    id: 'revenue',
    label: 'Total revenue',
    value: '$48,120',
    delta: { value: '+12.4%', direction: 'up', label: 'vs last month' },
    variant: 'highlight',
  },
  {
    id: 'active-users',
    label: 'Active users',
    value: '2,847',
    delta: { value: '+3.1%', direction: 'up', label: 'vs last month' },
  },
  {
    id: 'conversion',
    label: 'Conversion rate',
    value: '4.82%',
    delta: { value: '-0.4%', direction: 'down', label: 'vs last month' },
  },
  {
    id: 'churn',
    label: 'Churn',
    value: '1.2%',
    delta: { value: '0.0%', direction: 'flat', label: 'vs last month' },
  },
];

const DEMO_ACTIVITIES: AdminDashboardActivity[] = [
  {
    id: '1',
    title: 'New subscription',
    description: 'Acme Corp upgraded to the Team plan.',
    actor: 'Jane Cooper',
    timestamp: '2 minutes ago',
  },
  {
    id: '2',
    title: 'User invited',
    description: 'dev@initech.example was invited to the workspace.',
    actor: 'Wade Warren',
    timestamp: '18 minutes ago',
  },
  {
    id: '3',
    title: 'Payment received',
    description: '$1,240.00 from Stark Industries.',
    actor: 'System',
    timestamp: '1 hour ago',
  },
  {
    id: '4',
    title: 'Report exported',
    description: 'Q1 revenue report exported as CSV.',
    actor: 'Esther Howard',
    timestamp: '3 hours ago',
  },
];

export function AdminDashboardDemo() {
  return (
    <AdminDashboard
      eyebrow="Overview"
      title="Dashboard"
      description="A live snapshot of your workspace — metrics, activity, and anything else worth a glance."
      actions={
        <>
          <Button variant="outline" size="sm">
            Export
          </Button>
          <Button size="sm">New report</Button>
        </>
      }
      stats={DEMO_STATS}
      activities={DEMO_ACTIVITIES}
      activityViewAllHref="#"
    />
  );
}
