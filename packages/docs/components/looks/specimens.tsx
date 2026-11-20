import type { ComponentType } from 'react';
import { AlertSpecimen } from './alert-specimen';
import { AnimatedTitleSpecimen } from './animated-title-specimen';
import { ButtonSpecimen } from './button-specimen';
import { CardSpecimen } from './card-specimen';
import { FieldSpecimen } from './field-specimen';
import { GlassSpecimen } from './glass-specimen';
import { ItineraryLabelsSpecimen } from './itinerary-labels-specimen';
import { KeyValueListSpecimen } from './key-value-list-specimen';
import type { LookSpecimenProps } from './looks';
import { NumberInputSpecimen } from './number-input-specimen';
import { PhotoBackdropSpecimen } from './photo-backdrop-specimen';
import { PhotoDropSpecimen } from './photo-drop-specimen';
import { PhotoPickerSpecimen } from './photo-picker-specimen';
import { PopoverSpecimen } from './popover-specimen';
import { ProfileMenuSpecimen } from './profile-menu-specimen';
import { RichTextSpecimen } from './rich-text-specimen';
import { ScrollHintSpecimen } from './scroll-hint-specimen';
import { SegmentedControlSpecimen } from './segmented-control-specimen';
import { SegmentedProgressSpecimen } from './segmented-progress-specimen';
import { SpinnerSpecimen } from './spinner-specimen';
import { StepperRailSpecimen } from './stepper-rail-specimen';
import { ThemeSpecimen } from './theme-specimen';
import { ThemeToggleSpecimen } from './theme-toggle-specimen';
import { ToggleGroupSpecimen } from './toggle-group-specimen';

/**
 * What a five-look frame can draw, by `specimen` key. Part tickets add theirs here. A specimen's
 * form controls sit on `FormPanel` (or a glass card of their own), never straight on the photo (VI-829).
 */
export const LOOK_SPECIMENS: Record<string, ComponentType<LookSpecimenProps>> = {
  alert: AlertSpecimen,
  'animated-title': AnimatedTitleSpecimen,
  button: ButtonSpecimen,
  card: CardSpecimen,
  field: FieldSpecimen,
  glass: GlassSpecimen,
  'itinerary-labels': ItineraryLabelsSpecimen,
  'key-value-list': KeyValueListSpecimen,
  'number-input': NumberInputSpecimen,
  'photo-backdrop': PhotoBackdropSpecimen,
  'photo-drop': PhotoDropSpecimen,
  'photo-picker': PhotoPickerSpecimen,
  popover: PopoverSpecimen,
  'profile-menu': ProfileMenuSpecimen,
  'rich-text': RichTextSpecimen,
  'scroll-hint': ScrollHintSpecimen,
  'segmented-control': SegmentedControlSpecimen,
  'segmented-progress': SegmentedProgressSpecimen,
  spinner: SpinnerSpecimen,
  'stepper-rail': StepperRailSpecimen,
  theme: ThemeSpecimen,
  'theme-toggle': ThemeToggleSpecimen,
  'toggle-group': ToggleGroupSpecimen,
};
