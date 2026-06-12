'use client';

import * as React from 'react';
import { ListBullets } from '@phosphor-icons/react';
import {
  StructuredPrompt,
  StructuredPromptHeader,
  StructuredPromptBody,
  StructuredPromptSlot,
  StructuredPromptHint,
} from '../../../../components/ui/structured-prompt/structured-prompt';

/* ─── StructuredPromptOnlinessDemo ───────────────────────────────────── */

export function StructuredPromptOnlinessDemo() {
  return (
    <StructuredPrompt>
      <StructuredPromptHeader icon={<ListBullets size={13} />}>
        ONLINESS · THE SPEARHEAD
      </StructuredPromptHeader>
      <StructuredPromptBody>
        For <StructuredPromptSlot filled>design-led product teams</StructuredPromptSlot>,
        Visor is the only <StructuredPromptSlot filled>component system</StructuredPromptSlot>{' '}
        that <StructuredPromptSlot>derives every surface from one brand record</StructuredPromptSlot>.
      </StructuredPromptBody>
      <StructuredPromptHint>Click any slot to edit</StructuredPromptHint>
    </StructuredPrompt>
  );
}
