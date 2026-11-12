'use client';

import * as React from 'react';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxItem, ComboboxEmpty } from './ui/combobox';

const STATES = ['California', 'Nevada', 'New Jersey', 'New Mexico', 'New York', 'Ohio', 'Oregon', 'Texas'];

/** Combobox filters nothing itself: the consumer filters, the Combobox handles the keys. */
export function ComboboxKeyboardExample() {
  const [query, setQuery] = React.useState('');
  const matches = STATES.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
  return (
    <Combobox inputValue={query} onInputChange={setQuery}>
      <ComboboxInput placeholder="Pick a state..." aria-label="State" />
      <ComboboxContent aria-label="States">
        {matches.map((s) => (
          <ComboboxItem key={s} value={s} disabled={s === 'Oregon'}>
            {s}
          </ComboboxItem>
        ))}
        {matches.length === 0 && <ComboboxEmpty>No states found.</ComboboxEmpty>}
      </ComboboxContent>
    </Combobox>
  );
}
