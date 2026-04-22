'use client';

import { MagnifyingGlass } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export function EmptyStateDemo() {
  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: 'var(--spacing-12) var(--spacing-6)',
        maxWidth: 560,
        width: '100%',
      }}
    >
      <div style={{ marginBottom: 'var(--spacing-4)', opacity: 0.5 }}>
        <MagnifyingGlass size={48} />
      </div>

      <Heading level={3} size="md">No results found</Heading>

      <Text
        size="sm"
        color="secondary"
        style={{ maxWidth: 400, marginTop: 'var(--spacing-2)' }}
      >
        Try adjusting your search or filters to find what you are looking for.
      </Text>

      <div
        style={{
          marginTop: 'var(--spacing-6)',
          display: 'flex',
          gap: 'var(--spacing-3)',
        }}
      >
        <Button variant="outline">Clear filters</Button>
        <Button>Create new</Button>
      </div>
    </Card>
  );
}
