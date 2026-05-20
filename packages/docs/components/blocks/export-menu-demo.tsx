'use client';

import * as React from 'react';
import {
  FileCsvIcon,
  FileTextIcon,
  FilePdfIcon,
} from '@phosphor-icons/react';
import {
  ExportMenu,
  defaultExportFormats,
  type ExportFormat,
  type ExportScope,
} from '../../../../blocks/export-menu/export-menu';

interface ExportMenuDemoProps {
  variant?: 'default' | 'custom-formats' | 'with-scopes' | 'loading' | 'disabled-format';
}

const CUSTOM_FORMATS: ExportFormat[] = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values',
    icon: <FileCsvIcon size={16} weight="regular" />,
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'For developer tooling',
    icon: <FileTextIcon size={16} weight="regular" />,
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Printable document',
    icon: <FilePdfIcon size={16} weight="regular" />,
  },
];

const SCOPES: ExportScope[] = [
  {
    key: 'archived',
    label: 'Include archived organizations',
    description: 'Adds orgs whose status is "Archived" to the export.',
  },
  {
    key: 'suspended',
    label: 'Include suspended organizations',
    defaultChecked: true,
  },
];

const DISABLED_FORMATS: ExportFormat[] = [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
  { value: 'json', label: 'JSON', description: 'For developer tooling' },
  {
    value: 'xlsx',
    label: 'XLSX',
    description: 'Microsoft Excel workbook',
    disabled: true,
    disabledReason: 'Upgrade to the Pro plan to enable XLSX export.',
  },
];

export function ExportMenuDemo({ variant = 'default' }: ExportMenuDemoProps) {
  const handleExport = React.useCallback(
    (format: string, scopes: Record<string, boolean>) => {
      // Demo: consumer logs the request — actual file generation is consumer-side.
      // eslint-disable-next-line no-console
      console.log('export-menu →', { format, scopes });
    },
    []
  );

  const handleSlowExport = React.useCallback(
    (format: string, scopes: Record<string, boolean>) =>
      new Promise<void>((resolve) => {
        // eslint-disable-next-line no-console
        console.log('export-menu (slow) →', { format, scopes });
        setTimeout(resolve, 1500);
      }),
    []
  );

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 'var(--spacing-4, 1rem)',
        background: 'var(--surface-card, #ffffff)',
        border: '1px solid var(--border-default, #e5e7eb)',
        borderRadius: 'var(--radius-md, 0.375rem)',
        minWidth: '24rem',
      }}
    >
      {variant === 'default' && (
        <ExportMenu formats={defaultExportFormats()} onExport={handleExport} />
      )}

      {variant === 'custom-formats' && (
        <ExportMenu
          label="Download report"
          formats={CUSTOM_FORMATS}
          onExport={handleExport}
        />
      )}

      {variant === 'with-scopes' && (
        <ExportMenu
          formats={defaultExportFormats()}
          scopes={SCOPES}
          onExport={handleExport}
          heading="Export 24 organizations"
        />
      )}

      {variant === 'loading' && (
        <ExportMenu
          formats={defaultExportFormats()}
          onExport={handleSlowExport}
        />
      )}

      {variant === 'disabled-format' && (
        <ExportMenu formats={DISABLED_FORMATS} onExport={handleExport} />
      )}
    </div>
  );
}
