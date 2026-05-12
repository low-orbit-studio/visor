'use client';

import { DesignSystemSpecimen as RawDesignSystemSpecimen } from '../../../../blocks/design-system-specimen/design-system-specimen';
import type { DesignSystemSpecimenThemeEntry } from '../../../../blocks/design-system-specimen/design-system-specimen';
import { PRIVATE_THEMES } from '@/lib/private-themes';

/**
 * Docs-site wrapper for the Design System Specimen block. Injects the docs
 * site's PRIVATE_THEMES manifest so the Font Families specimen renders the
 * active theme's actual loaded weights (VI-356). The raw block is still
 * exported below for tests and external consumers.
 */
export function DesignSystemSpecimen(
  props: Omit<Parameters<typeof RawDesignSystemSpecimen>[0], 'themeManifest'> & {
    themeManifest?: DesignSystemSpecimenThemeEntry[];
  },
) {
  return (
    <RawDesignSystemSpecimen
      themeManifest={props.themeManifest ?? PRIVATE_THEMES}
      {...props}
    />
  );
}
