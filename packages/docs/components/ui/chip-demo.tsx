'use client';

import * as React from 'react';
import { Chip, ChoiceChip, FilterChip } from '../../../../components/ui/chip/chip';
import { ChipGroup, ChipGroupItem } from '../../../../blocks/chip-group/chip-group';

/* ─── DeletableChipDemo ──────────────────────────────────────────────── */

export function DeletableChipDemo() {
  const [tags, setTags] = React.useState(['React', 'TypeScript', 'Featured']);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          onDeleted={() => setTags((prev) => prev.filter((t) => t !== tag))}
        />
      ))}
      {tags.length === 0 && (
        <button
          type="button"
          style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}
          onClick={() => setTags(['React', 'TypeScript', 'Featured'])}
        >
          Reset
        </button>
      )}
    </div>
  );
}

/* ─── ChoiceChipGroupDemo ────────────────────────────────────────────── */

export function ChoiceChipGroupDemo() {
  const [density, setDensity] = React.useState<string[]>(['compact']);

  return (
    <ChipGroup type="single" value={density} onValueChange={setDensity} aria-label="Display density">
      <ChipGroupItem value="compact"><ChoiceChip label="Compact" /></ChipGroupItem>
      <ChipGroupItem value="comfortable"><ChoiceChip label="Comfortable" /></ChipGroupItem>
      <ChipGroupItem value="spacious"><ChoiceChip label="Spacious" /></ChipGroupItem>
    </ChipGroup>
  );
}

/* ─── FilterChipGroupDemo ────────────────────────────────────────────── */

export function FilterChipGroupDemo() {
  const [filters, setFilters] = React.useState<string[]>(['events']);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <ChipGroup type="multiple" value={filters} onValueChange={setFilters} aria-label="Category filters">
        <ChipGroupItem value="events"><FilterChip label="Events" /></ChipGroupItem>
        <ChipGroupItem value="releases"><FilterChip label="Releases" /></ChipGroupItem>
        <ChipGroupItem value="updates"><FilterChip label="Updates" /></ChipGroupItem>
        <ChipGroupItem value="announcements"><FilterChip label="Announcements" /></ChipGroupItem>
      </ChipGroup>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
        Active: {filters.length > 0 ? filters.join(', ') : 'none'}
      </p>
    </div>
  );
}
