import type { ComponentType } from 'react';
import { ButtonSpecimen } from './button-specimen';
import { GlassSpecimen } from './glass-specimen';
import { NumberInputSpecimen } from './number-input-specimen';
import { SpinnerSpecimen } from './spinner-specimen';
import { ThemeSpecimen } from './theme-specimen';

/** What a five-look frame can draw, by `specimen` key. Part tickets add theirs here. */
export const LOOK_SPECIMENS: Record<string, ComponentType> = {
  button: ButtonSpecimen,
  glass: GlassSpecimen,
  'number-input': NumberInputSpecimen,
  spinner: SpinnerSpecimen,
  theme: ThemeSpecimen,
};
