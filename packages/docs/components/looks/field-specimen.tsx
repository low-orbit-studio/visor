import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr';
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import styles from './field-specimen.module.css';

/**
 * Field with its control box (VI-805): Input with a hint, an optional Select, an
 * optional Textarea, and an invalid Input with its error line. Solid unless an
 * ancestor sets `data-glass="on"`; the error colour is the theme's, ink under glass.
 */
export function FieldSpecimen() {
  return (
    // A theme binds these under `components.field`; here a wrapper sets them.
    <div className={styles.stack} data-slot="field-specimen">
      <Field>
        <FieldLabel htmlFor="look-name">Your name</FieldLabel>
        <FieldControl>
          <Input id="look-name" placeholder="Jane Doe" aria-describedby="look-name-hint" />
        </FieldControl>
        <FieldDescription id="look-name-hint">As it appears on your ID.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="look-arrival" optional>Arrival</FieldLabel>
        <FieldControl>
          <Select>
            <SelectTrigger id="look-arrival">
              <SelectValue placeholder="Choose one" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thu">Thursday</SelectItem>
              <SelectItem value="fri">Friday</SelectItem>
            </SelectContent>
          </Select>
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel htmlFor="look-notes" optional>Notes</FieldLabel>
        <FieldControl tall>
          <Textarea id="look-notes" rows={3} placeholder="Anything we should know" />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel htmlFor="look-email">Email</FieldLabel>
        <FieldControl>
          <Input id="look-email" aria-invalid="true" aria-describedby="look-email-error" defaultValue="jane@" />
        </FieldControl>
        <FieldError id="look-email-error" icon={<WarningCircleIcon weight="fill" />}>
          Check the email address.
        </FieldError>
      </Field>
    </div>
  );
}
