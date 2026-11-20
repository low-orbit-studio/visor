import { Stepper, StepperItem, StepperTrigger } from '@/components/ui/stepper';

/** FormDeck's section rail mid-form (VI-810): one section done, one current, one upcoming, two locked. */
const SECTIONS = [
  { label: 'Welcome', status: 'complete' },
  { label: 'About You', status: 'active' },
  { label: 'Travel', status: 'upcoming' },
  { label: 'Pay', status: 'locked' },
  { label: 'Agreements', status: 'locked' },
] as const;

/** Stepper's rail variant. Theme ink on a plain page; the glass ink and its shadow where `data-glass="on"`. */
export function StepperRailSpecimen() {
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
