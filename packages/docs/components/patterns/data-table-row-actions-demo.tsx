'use client';

import { useMemo } from 'react';
import { DotsThreeVertical, PencilSimple, Copy, Trash } from '@phosphor-icons/react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Status = 'active' | 'pending' | 'inactive';

interface Row {
  id: string;
  name: string;
  email: string;
  status: Status;
  role: string;
}

const statusVariant: Record<Status, 'success' | 'warning' | 'outline'> = {
  active: 'success',
  pending: 'warning',
  inactive: 'outline',
};

const SAMPLE_DATA: Row[] = [
  { id: '1', name: 'Alice Martin',  email: 'alice@example.com',   status: 'active',   role: 'Admin'  },
  { id: '2', name: 'Ben Okafor',    email: 'ben@example.com',     status: 'pending',  role: 'Editor' },
  { id: '3', name: 'Clara Novak',   email: 'clara@example.com',   status: 'active',   role: 'Viewer' },
  { id: '4', name: 'David Reyes',   email: 'david@example.com',   status: 'inactive', role: 'Editor' },
  { id: '5', name: 'Evelyn Cho',    email: 'evelyn@example.com',  status: 'pending',  role: 'Admin'  },
];

export function DataTableRowActionsDemo() {
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'role',
        header: 'Role',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue<Status>('status');
          return (
            <Badge variant={statusVariant[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: () => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Row actions"
                style={{ padding: 'var(--spacing-1)' }}
              >
                <DotsThreeVertical size={16} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <PencilSimple size={14} style={{ marginRight: 'var(--spacing-2)' }} />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy size={14} style={{ marginRight: 'var(--spacing-2)' }} />
                  Duplicate
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash size={14} style={{ marginRight: 'var(--spacing-2)' }} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  return (
    <div style={{ width: '100%' }}>
      <DataTable columns={columns} data={SAMPLE_DATA} />
    </div>
  );
}
