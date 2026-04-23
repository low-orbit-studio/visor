'use client';

import { Bell } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Notification {
  id: string;
  initials: string;
  title: string;
  timestamp: string;
  isNew?: boolean;
}

const ALL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    initials: 'JL',
    title: 'Jordan left a comment on your post',
    timestamp: '2 min ago',
    isNew: true,
  },
  {
    id: '2',
    initials: 'SM',
    title: 'Sam mentioned you in a thread',
    timestamp: '18 min ago',
    isNew: true,
  },
  {
    id: '3',
    initials: 'AK',
    title: 'Alex invited you to join a project',
    timestamp: '1 hr ago',
    isNew: true,
  },
  {
    id: '4',
    initials: 'RC',
    title: 'Riley completed the onboarding checklist',
    timestamp: 'Yesterday',
    isNew: false,
  },
];

const UNREAD_NOTIFICATIONS = ALL_NOTIFICATIONS.filter((n) => n.isNew);

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-3) var(--spacing-4)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <Avatar size="sm">
        <AvatarFallback>{notification.initials}</AvatarFallback>
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 'var(--line-height-snug)',
          }}
        >
          {notification.title}
        </p>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-tertiary)',
            margin: 'var(--spacing-1) 0 0',
          }}
        >
          {notification.timestamp}
        </p>
      </div>
      {notification.isNew && (
        <Badge variant="info" style={{ flexShrink: 0 }}>
          New
        </Badge>
      )}
    </div>
  );
}

export function NotificationCenterDemo() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: 'var(--spacing-6)',
      }}
    >
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="md"
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            <Badge
              variant="destructive"
              style={{
                position: 'absolute',
                top: 'var(--spacing-1)',
                right: 'var(--spacing-1)',
                fontSize: 'var(--font-size-xs)',
                padding: '0 var(--spacing-1)',
                minWidth: '1.1rem',
                lineHeight: '1.1rem',
                textAlign: 'center',
              }}
            >
              3
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          style={{ width: 360, padding: 0 }}
          align="end"
          sideOffset={8}
        >
          <div
            style={{
              padding: 'var(--spacing-3) var(--spacing-4)',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Notifications
            </p>
          </div>

          <Tabs defaultValue="all">
            <TabsList
              style={{
                width: '100%',
                borderRadius: 0,
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <TabsTrigger value="all" style={{ flex: 1 }}>
                All
              </TabsTrigger>
              <TabsTrigger value="unread" style={{ flex: 1 }}>
                Unread
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" style={{ margin: 0 }}>
              {ALL_NOTIFICATIONS.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </TabsContent>

            <TabsContent value="unread" style={{ margin: 0 }}>
              {UNREAD_NOTIFICATIONS.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </TabsContent>
          </Tabs>

          <div
            style={{
              padding: 'var(--spacing-3) var(--spacing-4)',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-link)',
                padding: 0,
              }}
            >
              Mark all read
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
