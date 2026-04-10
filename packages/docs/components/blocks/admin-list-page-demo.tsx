'use client';

import * as React from 'react';
import { AdminListPage } from '../../../../blocks/admin-list-page/admin-list-page';
import { Button } from '../../../../components/ui/button/button';
import { Badge } from '../../../../components/ui/badge/badge';
import type { ColumnDef } from '../../../../components/ui/data-table/data-table';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Invited' | 'Suspended';
}

const DEMO_USERS: DemoUser[] = [
  { id: '1', name: 'Jane Cooper', email: 'jane@acme.test', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Wade Warren', email: 'wade@initech.test', role: 'Editor', status: 'Active' },
  { id: '3', name: 'Esther Howard', email: 'esther@stark.test', role: 'Editor', status: 'Invited' },
  { id: '4', name: 'Cameron Williamson', email: 'cam@umbrella.test', role: 'Viewer', status: 'Active' },
  { id: '5', name: 'Brooklyn Simmons', email: 'brooklyn@wayne.test', role: 'Admin', status: 'Suspended' },
  { id: '6', name: 'Leslie Alexander', email: 'leslie@globex.test', role: 'Editor', status: 'Active' },
  { id: '7', name: 'Jenny Wilson', email: 'jenny@massive.test', role: 'Viewer', status: 'Invited' },
  { id: '8', name: 'Guy Hawkins', email: 'guy@hooli.test', role: 'Viewer', status: 'Active' },
  { id: '9', name: 'Robert Fox', email: 'robert@pied.test', role: 'Editor', status: 'Active' },
  { id: '10', name: 'Jacob Jones', email: 'jacob@soylent.test', role: 'Admin', status: 'Active' },
];

function statusVariant(
  status: DemoUser['status']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Active') return 'default';
  if (status === 'Invited') return 'secondary';
  return 'destructive';
}

export function AdminListPageDemo() {
  const [search, setSearch] = React.useState('');

  const columns = React.useMemo<ColumnDef<DemoUser, unknown>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'role', header: 'Role' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    []
  );

  const filteredData = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return DEMO_USERS;
    return DEMO_USERS.filter(
      (user) =>
        user.name.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle)
    );
  }, [search]);

  return (
    <AdminListPage<DemoUser>
      eyebrow="Team"
      title="Users"
      description="Manage everyone with access to this workspace."
      actions={<Button size="sm">New user</Button>}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search users..."
      resultsCount={`${filteredData.length} ${filteredData.length === 1 ? 'result' : 'results'}`}
      columns={columns}
      data={filteredData}
      getRowId={(row) => row.id}
      enableRowSelection
      bulkActions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log('Archive selected users')}
          >
            Archive
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => console.log('Delete selected users')}
          >
            Delete
          </Button>
        </>
      }
      bulkActionBarInline
    />
  );
}
