import type { ComponentType } from 'react';
import { AlertSpecimen } from './alert-specimen';
import { ButtonSpecimen } from './button-specimen';
import { GlassSpecimen } from './glass-specimen';
import { ItineraryLabelsSpecimen } from './itinerary-labels-specimen';
import { KeyValueListSpecimen } from './key-value-list-specimen';
import { NumberInputSpecimen } from './number-input-specimen';
import { SegmentedControlSpecimen } from './segmented-control-specimen';
import { SpinnerSpecimen } from './spinner-specimen';
import { ThemeSpecimen } from './theme-specimen';

/** What a five-look frame can draw, by `specimen` key. Part tickets add theirs here. */
export const LOOK_SPECIMENS: Record<string, ComponentType> = {
  alert: AlertSpecimen,
  button: ButtonSpecimen,
  glass: GlassSpecimen,
  'itinerary-labels': ItineraryLabelsSpecimen,
  'key-value-list': KeyValueListSpecimen,
  'number-input': NumberInputSpecimen,
  'segmented-control': SegmentedControlSpecimen,
  spinner: SpinnerSpecimen,
  theme: ThemeSpecimen,
};
