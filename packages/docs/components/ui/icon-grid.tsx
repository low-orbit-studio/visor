'use client';

import { House, Gear, MagnifyingGlass, Bell, User } from '@phosphor-icons/react';
import { IconGrid, IconSizeRow } from '../../../../components/ui/icon-grid/icon-grid';

export { IconGrid, IconSizeRow };

export function IconGridDemo() {
  return (
    <IconGrid icons={[
      { name: "House", usage: "Home / dashboard", icon: <House size={24} /> },
      { name: "Gear", usage: "Settings", icon: <Gear size={24} /> },
      { name: "MagnifyingGlass", usage: "Search", icon: <MagnifyingGlass size={24} /> },
      { name: "Bell", usage: "Notifications", icon: <Bell size={24} /> },
      { name: "User", usage: "Profile / account", icon: <User size={24} /> },
    ]} />
  );
}

export function IconSizeRowDemo() {
  return (
    <IconSizeRow sizes={[
      { size: 12, icon: <House size={12} /> },
      { size: 16, icon: <House size={16} /> },
      { size: 20, icon: <House size={20} /> },
      { size: 24, icon: <House size={24} /> },
      { size: 32, icon: <House size={32} /> },
      { size: 48, icon: <House size={48} /> },
    ]} />
  );
}
