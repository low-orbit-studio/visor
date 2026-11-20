import type { ComponentType } from 'react';
import { GlassSpecimen } from './glass-specimen';

/** What a five-look frame can draw, by `specimen` key. Part tickets add theirs here. */
export const LOOK_SPECIMENS: Record<string, ComponentType> = {
  glass: GlassSpecimen,
};
