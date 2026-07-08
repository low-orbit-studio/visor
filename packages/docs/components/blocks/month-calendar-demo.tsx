'use client';

import * as React from 'react';
import {
  MonthCalendar,
  type MonthCalendarEvent,
} from '../../../../blocks/month-calendar/month-calendar';

// A stable demo month so the grid renders identically on every load.
const DEMO_MONTH = new Date(2026, 6, 1); // July 2026

const DEMO_EVENTS: MonthCalendarEvent[] = [
  { id: '1', date: new Date(2026, 6, 2), title: 'Design review', status: 'info', series: 1 },
  { id: '2', date: new Date(2026, 6, 6), title: 'Sprint planning', status: 'default', series: 2 },
  { id: '3', date: new Date(2026, 6, 6), title: 'Onboarding', status: 'success', series: 3 },
  { id: '4', date: new Date(2026, 6, 9), title: 'Release cut', status: 'warning', series: 1 },
  { id: '5', date: new Date(2026, 6, 14), title: 'All-hands', status: 'info', series: 4 },
  { id: '6', date: new Date(2026, 6, 14), title: 'Retro', status: 'default', series: 2 },
  { id: '7', date: new Date(2026, 6, 14), title: 'Demo day', status: 'success', series: 3 },
  { id: '8', date: new Date(2026, 6, 14), title: 'Overflow item', status: 'default' },
  { id: '9', date: new Date(2026, 6, 20), title: 'Payment due', status: 'danger', series: 5 },
  { id: '10', date: new Date(2026, 6, 24), title: 'Launch party', status: 'success', series: 1 },
  { id: '11', date: new Date(2026, 6, 28), title: 'Board sync', status: 'warning', series: 4 },
];

export function MonthCalendarDemo() {
  const [month, setMonth] = React.useState(DEMO_MONTH);
  const [view, setView] = React.useState('month');
  const [selected, setSelected] = React.useState<Date | undefined>(
    new Date(2026, 6, 14)
  );

  return (
    <div style={{ width: '100%' }}>
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        events={DEMO_EVENTS}
        today={new Date(2026, 6, 9)}
        selectedDate={selected}
        onSelectDate={setSelected}
        onEventSelect={() => {}}
        view={view}
        onViewChange={setView}
        maxChipsPerDay={3}
      />
    </div>
  );
}
