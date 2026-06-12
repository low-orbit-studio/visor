'use client';

import * as React from 'react';
import { Paperclip, Microphone } from '@phosphor-icons/react';
import {
  Composer,
  ComposerField,
  ComposerToolbar,
  ComposerToolButton,
  ComposerSpacer,
  ComposerSend,
} from '../../../../components/ui/composer/composer';
import { Chip } from '../../../../components/ui/chip/chip';
import { StatusDot } from '../../../../components/ui/status-dot/status-dot';

/* ─── ComposerDisabledDemo ───────────────────────────────────────────── */

export function ComposerDisabledDemo() {
  return (
    <div style={{ maxWidth: '520px', width: '100%' }}>
      <Composer disabled>
        <ComposerField placeholder="Composing disabled…" />
        <ComposerToolbar>
          <ComposerToolButton icon={<Paperclip size={16} />} aria-label="Attach file" />
          <ComposerSpacer />
          <ComposerSend />
        </ComposerToolbar>
      </Composer>
    </div>
  );
}

/* ─── ComposerFullDemo ───────────────────────────────────────────────── */

export function ComposerFullDemo() {
  return (
    <div style={{ maxWidth: '520px', width: '100%' }}>
      <Composer>
        <ComposerField placeholder="Ask anything…" />
        <ComposerToolbar>
          <ComposerToolButton icon={<Paperclip size={16} />} aria-label="Attach file" />
          <ComposerToolButton icon={<Microphone size={16} />} aria-label="Voice input" />
          <Chip size="sm" leadingIcon={<StatusDot tone="mint" />} label="Claude · key active" />
          <ComposerSpacer />
          <ComposerSend />
        </ComposerToolbar>
      </Composer>
    </div>
  );
}
