'use client';

import { SpherePlayground, type SpherePlaygroundProps } from '../../../../blocks/sphere-playground/sphere-playground';
import { useBlockCode } from '../block-code-context';

/**
 * Docs-only wrapper that bridges SpherePlayground's onCodeChange
 * to BlockPreview's live code context.
 */
export function SpherePlaygroundLive(props: SpherePlaygroundProps) {
  const blockCode = useBlockCode();
  return <SpherePlayground {...props} onCodeChange={blockCode?.setCode} />;
}
