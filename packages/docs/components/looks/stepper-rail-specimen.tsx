import { Stepper, StepperItem, StepperTrigger } from '@/components/ui/stepper';
import glass from './glass-specimen.module.css';

/** FormDeck's section rail mid-form (VI-810): one section done, one current, one upcoming, two locked. */
const SECTIONS = [
  { label: 'Welcome', status: 'complete' },
  { label: 'About You', status: 'active' },
  { label: 'Travel', status: 'upcoming' },
  { label: 'Pay', status: 'locked' },
  { label: 'Agreements', status: 'locked' },
] as const;

/** The bare rail, as the docs preview shows it. */
export function StepperRail() {
  return (
    <Stepper orientation="vertical" variant="rail" aria-label="Sections" data-demo="stepper-rail">
      {SECTIONS.map((s, i) => (
        <StepperItem key={s.label} step={i} status={s.status}>
          <StepperTrigger step={i} status={s.status}>
            {s.label}
          </StepperTrigger>
        </StepperItem>
      ))}
    </Stepper>
  );
}

/**
 * Stepper's rail variant on a form panel built from the glass recipe, as form content over a
 * photo always sits on the slide's glass card. Theme ink on a solid card on a plain page; the
 * glass ink and its shadow on the glass panel where `data-glass="on"`.
 */
export function StepperRailSpecimen() {
  return (
    <div className={glass.panel} data-slot="stepper-rail-panel">
      <span className={glass.glass} aria-hidden="true" />
      <span className={glass.edge} aria-hidden="true" />
      <div className={glass.content}>
        <StepperRail />
      </div>
    </div>
  );
}
