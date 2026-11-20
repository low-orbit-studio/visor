import type { ComponentType } from 'react';
import { GlassSpecimen } from './glass-specimen';
import { SpinnerSpecimen } from './spinner-specimen';
import { ThemeSpecimen } from './theme-specimen';

/** What a five-look frame can draw, by `specimen` key. Part tickets add theirs here. */
export const LOOK_SPECIMENS: Record<string, ComponentType> = {
  glass: GlassSpecimen,
  spinner: SpinnerSpecimen,
  theme: ThemeSpecimen,
};
