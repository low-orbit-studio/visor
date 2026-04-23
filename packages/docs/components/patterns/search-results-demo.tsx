'use client';

import { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
}

const ALL_RESULTS: SearchResult[] = [
  {
    id: '1',
    title: 'Getting Started with Visor',
    url: '/docs/getting-started',
    snippet:
      'Learn how to install and configure Visor in your Next.js project in under five minutes.',
  },
  {
    id: '2',
    title: 'Button Component',
    url: '/docs/components/button',
    snippet:
      'The Button component supports multiple variants including primary, outline, ghost, and destructive.',
  },
  {
    id: '3',
    title: 'Theme Architecture',
    url: '/docs/tokens/themes',
    snippet:
      "Visor's three-tier token architecture separates primitives, semantic tokens, and adaptive theme values.",
  },
  {
    id: '4',
    title: 'Design Token Rules',
    url: '/docs/tokens/rules',
    snippet:
      'Token rules enforce consistent spacing, shadow, motion, and color usage across all components.',
  },
];

export function SearchResultsDemo() {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? ALL_RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.snippet.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_RESULTS;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
        width: '100%',
        maxWidth: '36rem',
        margin: '0 auto',
        padding: 'var(--spacing-4)',
      }}
    >
      <Input
        leadingIcon={<MagnifyingGlass weight="bold" />}
        placeholder="Search documentation..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search documentation"
      />

      {filtered.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-3)',
          }}
        >
          {filtered.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <CardTitle>{result.title}</CardTitle>
                <CardDescription>{result.url}</CardDescription>
              </CardHeader>
              <CardContent>
                <p style={{ margin: 0 }}>{result.snippet}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: 'var(--spacing-10) var(--spacing-6)',
          }}
        >
          <div
            style={{
              marginBottom: 'var(--spacing-4)',
              opacity: 0.4,
              color: 'var(--text-secondary)',
            }}
          >
            <MagnifyingGlass size={40} />
          </div>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            No results found
          </p>
          <p
            style={{
              margin: 'var(--spacing-1) 0 var(--spacing-5)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            No documentation matches &ldquo;{query}&rdquo;. Try a different
            search term.
          </p>
          <Button variant="ghost" onClick={() => setQuery('')}>
            Clear search
          </Button>
        </Card>
      )}
    </div>
  );
}
