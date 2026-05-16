'use client';

import * as React from 'react';
import {
  AdminTabbedEditor,
  type AdminTabbedEditorTab,
} from '../../../../blocks/admin-tabbed-editor/admin-tabbed-editor';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '../../../../components/ui/field/field';
import { Input } from '../../../../components/ui/input/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select/select';
import { Switch } from '../../../../components/ui/switch/switch';

/**
 * VI-394 — tier-limits editor showcase.
 *
 * Composes admin-tabbed-editor with three tabs (Free / Pro / Enterprise),
 * one form per tier built from Visor Field + Input + Select + Switch
 * primitives, and a single savebar across the whole editor.
 *
 * State model: each tier has its own draft slice; switching tabs preserves
 * the per-tier edits (block keeps panels mounted under Radix Tabs). The
 * dirty flag is the union across all tiers.
 */

type SupportTier = 'community' | 'standard' | 'priority';

interface TierLimits {
  memberLimit: string;
  eventLimit: string;
  storageLimitGb: string;
  supportTier: SupportTier;
  customBranding: boolean;
}

type TierKey = 'free' | 'pro' | 'enterprise';

type TierState = Record<TierKey, TierLimits>;

const INITIAL_TIERS: TierState = {
  free: {
    memberLimit: '5',
    eventLimit: '3',
    storageLimitGb: '1',
    supportTier: 'community',
    customBranding: false,
  },
  pro: {
    memberLimit: '50',
    eventLimit: '25',
    storageLimitGb: '50',
    supportTier: 'standard',
    customBranding: true,
  },
  enterprise: {
    memberLimit: 'Unlimited',
    eventLimit: 'Unlimited',
    storageLimitGb: '500',
    supportTier: 'priority',
    customBranding: true,
  },
};

const sectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-5, 1.25rem)',
  maxWidth: '32rem',
};

const switchRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 'var(--spacing-4, 1rem)',
};

const switchTextStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-1, 0.25rem)',
  flex: 1,
};

export function AdminTabbedEditorTierLimitsDemo() {
  const [committed, setCommitted] = React.useState<TierState>(INITIAL_TIERS);
  const [draft, setDraft] = React.useState<TierState>(INITIAL_TIERS);

  const dirty = React.useMemo(() => {
    return (Object.keys(draft) as TierKey[]).some((tier) => {
      const a = draft[tier];
      const b = committed[tier];
      return (
        a.memberLimit !== b.memberLimit ||
        a.eventLimit !== b.eventLimit ||
        a.storageLimitGb !== b.storageLimitGb ||
        a.supportTier !== b.supportTier ||
        a.customBranding !== b.customBranding
      );
    });
  }, [draft, committed]);

  const setTierField = React.useCallback(
    <K extends keyof TierLimits>(tier: TierKey, field: K) =>
      (value: TierLimits[K]) => {
        setDraft((prev) => ({
          ...prev,
          [tier]: { ...prev[tier], [field]: value },
        }));
      },
    []
  );

  const handleSave = React.useCallback(async () => {
    // Simulate an async save — 600ms then commit the draft.
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    setCommitted(draft);
  }, [draft]);

  const handleCancel = React.useCallback(() => {
    setDraft(committed);
  }, [committed]);

  const renderTier = (tier: TierKey, helper: string) => {
    const values = draft[tier];
    const id = (suffix: string) => `tier-limits-${tier}-${suffix}`;
    return (
      <div style={sectionStyles}>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm, 0.875rem)',
            color: 'var(--text-secondary, #6b7280)',
          }}
        >
          {helper}
        </p>

        <Field>
          <FieldLabel htmlFor={id('member-limit')}>Member limit</FieldLabel>
          <Input
            id={id('member-limit')}
            value={values.memberLimit}
            onChange={(e) =>
              setTierField(tier, 'memberLimit')(e.target.value)
            }
          />
          <FieldDescription>
            Maximum users on this plan. Use &ldquo;Unlimited&rdquo; for no cap.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor={id('event-limit')}>
            Events per month
          </FieldLabel>
          <Input
            id={id('event-limit')}
            value={values.eventLimit}
            onChange={(e) =>
              setTierField(tier, 'eventLimit')(e.target.value)
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={id('storage-limit')}>
            Storage (GB)
          </FieldLabel>
          <Input
            id={id('storage-limit')}
            inputMode="numeric"
            value={values.storageLimitGb}
            onChange={(e) =>
              setTierField(tier, 'storageLimitGb')(e.target.value)
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={id('support-tier')}>Support tier</FieldLabel>
          <Select
            value={values.supportTier}
            onValueChange={(next) =>
              setTierField(tier, 'supportTier')(next as SupportTier)
            }
          >
            <SelectTrigger id={id('support-tier')}>
              <SelectValue placeholder="Select support tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="community">Community</SelectItem>
              <SelectItem value="standard">Standard (24h SLA)</SelectItem>
              <SelectItem value="priority">Priority (1h SLA)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <div style={switchRowStyles}>
            <div style={switchTextStyles}>
              <FieldLabel htmlFor={id('custom-branding')}>
                Custom branding
              </FieldLabel>
              <FieldDescription>
                Replace Visor branding with the org&rsquo;s logo and colors.
              </FieldDescription>
            </div>
            <Switch
              id={id('custom-branding')}
              checked={values.customBranding}
              onCheckedChange={(next) =>
                setTierField(tier, 'customBranding')(next)
              }
            />
          </div>
        </Field>
      </div>
    );
  };

  const tabs: AdminTabbedEditorTab[] = React.useMemo(
    () => [
      {
        id: 'free',
        label: 'Free',
        content: renderTier('free', 'Entry tier — generous enough to onboard.'),
      },
      {
        id: 'pro',
        label: 'Pro',
        content: renderTier('pro', 'Paid tier — the bulk of revenue.'),
      },
      {
        id: 'enterprise',
        label: 'Enterprise',
        content: renderTier(
          'enterprise',
          'Custom-contract tier — quotas negotiated per deal.'
        ),
      },
    ],
    // renderTier closes over draft via setTierField; recompute when draft changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '40rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        border: '1px solid var(--border-muted, #e5e7eb)',
        borderRadius: 'var(--radius-md, 0.5rem)',
      }}
    >
      <AdminTabbedEditor
        title="Tier limits"
        eyebrow="Monetization"
        description="Configure quotas and entitlements per pricing tier. Each tab is one tier; one save commits all three."
        tabs={tabs}
        dirty={dirty}
        onSave={handleSave}
        onCancel={handleCancel}
        saveLabel="Save tier limits"
        cancelLabel="Discard changes"
        footerStatus={dirty ? 'Unsaved changes across one or more tiers' : 'All tiers saved'}
      />
    </div>
  );
}
