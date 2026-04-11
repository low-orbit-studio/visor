'use client';

import { useCallback, useMemo, useState } from 'react';
import { FilterBar } from '../../../../components/ui/filter-bar/filter-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select/select';

export function FilterBarSearchOnlyDemo() {
  const [search, setSearch] = useState('');
  return (
    <FilterBar
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search users"
    />
  );
}

export function FilterBarWithSelectDemo() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('');

  return (
    <FilterBar
      searchValue={search}
      onSearchChange={setSearch}
      resultsCount="42 results"
    >
      <Select value={role} onValueChange={setRole}>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
    </FilterBar>
  );
}

export function FilterBarWithChipsDemo() {
  const [search, setSearch] = useState('');
  const [roleChip, setRoleChip] = useState(true);
  const [statusChip, setStatusChip] = useState(true);

  const removeRole = useCallback(() => setRoleChip(false), []);
  const removeStatus = useCallback(() => setStatusChip(false), []);
  const clearAll = useCallback(() => {
    setSearch('');
    setRoleChip(true);
    setStatusChip(true);
  }, []);

  const activeFilters = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    if (roleChip) {
      chips.push({ id: 'role', label: 'Role: Admin', onRemove: removeRole });
    }
    if (statusChip) {
      chips.push({
        id: 'status',
        label: 'Status: Active',
        onRemove: removeStatus,
      });
    }
    return chips;
  }, [roleChip, statusChip, removeRole, removeStatus]);

  return (
    <FilterBar
      searchValue={search}
      onSearchChange={setSearch}
      activeFilters={activeFilters}
      onClearAll={clearAll}
      resultsCount="8 results"
    />
  );
}

export function FilterBarDenseDemo() {
  const [search, setSearch] = useState('');
  return (
    <FilterBar
      dense
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search"
    />
  );
}
