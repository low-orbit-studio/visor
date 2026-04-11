export interface PropDef {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

export const propsData: Record<string, PropDef[]> = {
  button: [
    {
      name: 'variant',
      type: "'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'",
      default: "'default'",
      description: 'Visual style variant of the button.',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Size of the button, affecting height and padding.',
    },
    {
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description:
        'Merge props onto the immediate child element instead of rendering a <button>.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the button and applies reduced-opacity styling.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
    {
      name: 'onClick',
      type: 'React.MouseEventHandler<HTMLButtonElement>',
      description: 'Click event handler.',
    },
    {
      name: '...props',
      type: 'React.ButtonHTMLAttributes<HTMLButtonElement>',
      description: 'All standard HTML button attributes are forwarded.',
    },
  ],

  popover: [
    {
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state of the popover.',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Callback when the open state changes.',
    },
    {
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Default open state for uncontrolled usage.',
    },
    {
      name: 'side',
      type: "'top' | 'right' | 'bottom' | 'left'",
      default: "'bottom'",
      description: 'Side of the trigger the popover appears on (on PopoverContent).',
    },
    {
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'center'",
      description: 'Alignment of the popover content relative to the trigger (on PopoverContent).',
    },
    {
      name: 'sideOffset',
      type: 'number',
      default: '4',
      description: 'Distance in pixels between the trigger and the popover (on PopoverContent).',
    },
    {
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'On PopoverTrigger — merges props onto the immediate child element instead of rendering a <button>.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto PopoverContent.',
    },
  ],

  'context-menu': [
    {
      name: 'variant',
      type: "'default' | 'destructive'",
      default: "'default'",
      description: 'Visual style of ContextMenuItem — use "destructive" for dangerous actions.',
    },
    {
      name: 'inset',
      type: 'boolean',
      default: 'false',
      description: 'Adds left padding to ContextMenuItem, ContextMenuLabel, or ContextMenuSubTrigger to align with items that have icons.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the menu item, making it non-interactive and visually muted.',
    },
    {
      name: 'checked',
      type: 'boolean | "indeterminate"',
      description: 'Controlled checked state for ContextMenuCheckboxItem.',
    },
    {
      name: 'onCheckedChange',
      type: '(checked: boolean) => void',
      description: 'Callback when the checked state of a ContextMenuCheckboxItem changes.',
    },
    {
      name: 'value',
      type: 'string',
      description: 'Value for ContextMenuRadioItem. The selected value is managed by ContextMenuRadioGroup.',
    },
    {
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Callback on ContextMenuRadioGroup when the selected radio value changes.',
    },
    {
      name: 'onSelect',
      type: '(event: Event) => void',
      description: 'Callback when a ContextMenuItem is selected. Call event.preventDefault() to keep the menu open.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'fullscreen-overlay': [
    {
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state of the overlay.',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Callback when the open state changes.',
    },
    {
      name: 'fullbleed',
      type: 'boolean',
      default: 'false',
      description: 'Removes all inner padding on FullscreenOverlayContent, allowing content to fill the entire viewport edge-to-edge.',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Content to render inside FullscreenOverlayContent.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto FullscreenOverlayContent.',
    },
    {
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'On FullscreenOverlayTrigger — merges props onto the immediate child element instead of rendering a <button>.',
    },
  ],

  'hover-card': [
    {
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state of the hover card.',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Callback when the open state changes.',
    },
    {
      name: 'openDelay',
      type: 'number',
      default: '700',
      description: 'Milliseconds to wait before opening on hover.',
    },
    {
      name: 'closeDelay',
      type: 'number',
      default: '300',
      description: 'Milliseconds to wait before closing after hover ends.',
    },
    {
      name: 'side',
      type: "'top' | 'right' | 'bottom' | 'left'",
      default: "'bottom'",
      description: 'Side of the trigger the card appears on (on HoverCardContent).',
    },
    {
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'center'",
      description: 'Alignment of the card relative to the trigger (on HoverCardContent).',
    },
    {
      name: 'sideOffset',
      type: 'number',
      default: '4',
      description: 'Distance in pixels between the trigger and the card (on HoverCardContent).',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto HoverCardContent.',
    },
  ],

  toast: [
    {
      name: 'position',
      type: "'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
      default: "'bottom-right'",
      description: 'Where toasts appear on screen.',
    },
    {
      name: 'duration',
      type: 'number',
      default: '4000',
      description: 'Default duration in milliseconds before a toast auto-dismisses.',
    },
    {
      name: 'richColors',
      type: 'boolean',
      default: 'false',
      description: 'Enables colored backgrounds for different toast types.',
    },
  ],

  banner: [
    {
      name: 'intent',
      type: "'info' | 'warning' | 'error' | 'success'",
      default: "'info'",
      description: 'Semantic intent that controls the banner color scheme.',
    },
    {
      name: 'position',
      type: "'inline' | 'sticky'",
      default: "'inline'",
      description: 'Whether the banner flows inline or sticks to the viewport.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'radio-group': [
    {
      name: 'value',
      type: 'string',
      description: 'Controlled value of the selected radio item.',
    },
    {
      name: 'defaultValue',
      type: 'string',
      description: 'Default selected value for uncontrolled usage.',
    },
    {
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Callback when the selected value changes.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables all radio items in the group.',
    },
  ],

  slider: [
    {
      name: 'value',
      type: 'number[]',
      description: 'Controlled value(s). Use an array for range sliders.',
    },
    {
      name: 'defaultValue',
      type: 'number[]',
      description: 'Default value(s) for uncontrolled usage.',
    },
    {
      name: 'min',
      type: 'number',
      default: '0',
      description: 'Minimum value.',
    },
    {
      name: 'max',
      type: 'number',
      default: '100',
      description: 'Maximum value.',
    },
    {
      name: 'step',
      type: 'number',
      default: '1',
      description: 'Step increment between values.',
    },
    {
      name: 'onValueChange',
      type: '(value: number[]) => void',
      description: 'Callback when the value changes.',
    },
  ],

  'toggle-group': [
    {
      name: 'type',
      type: "'single' | 'multiple'",
      required: true,
      description: 'Whether one or multiple items can be active at once.',
    },
    {
      name: 'variant',
      type: "'default' | 'outline'",
      default: "'default'",
      description: 'Visual style variant of the toggle group.',
    },
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Size of the toggle items.',
    },
    {
      name: 'value',
      type: 'string | string[]',
      description: 'Controlled active value(s).',
    },
    {
      name: 'onValueChange',
      type: '(value: string | string[]) => void',
      description: 'Callback when the active value changes.',
    },
  ],

  combobox: [
    {
      name: 'inputValue',
      type: 'string',
      description: 'Controlled value of the search input.',
    },
    {
      name: 'onInputChange',
      type: '(value: string) => void',
      description: 'Callback when the input value changes.',
    },
    {
      name: 'value',
      type: 'string',
      description: 'Controlled selected value.',
    },
    {
      name: 'onSelect',
      type: '(value: string) => void',
      description: 'Callback when an item is selected.',
    },
    {
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state of the dropdown.',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Callback when the open state changes.',
    },
  ],

  table: [
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names for the table element.',
    },
    {
      name: 'scope',
      type: "'col' | 'row'",
      default: "'col'",
      description: 'Scope attribute for TableHead cells.',
    },
  ],

  accordion: [
    {
      name: 'type',
      type: "'single' | 'multiple'",
      required: true,
      description: 'Whether one or multiple items can be expanded at once.',
    },
    {
      name: 'collapsible',
      type: 'boolean',
      default: 'false',
      description: 'When type is "single", allows closing the open item.',
    },
    {
      name: 'value',
      type: 'string | string[]',
      description: 'Controlled expanded item value(s).',
    },
    {
      name: 'defaultValue',
      type: 'string | string[]',
      description: 'Default expanded item value(s) for uncontrolled usage.',
    },
  ],

  collapsible: [
    {
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state.',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Callback when the open state changes.',
    },
    {
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Default open state for uncontrolled usage.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Prevents opening or closing.',
    },
  ],

  navbar: [
    {
      name: 'variant',
      type: "'default' | 'transparent' | 'bordered'",
      default: "'default'",
      description: 'Visual style variant of the navbar.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
    {
      name: '...props (NavbarContent)',
      type: 'align?: "start" | "center" | "end"',
      default: "'start'",
      description: 'Alignment of NavbarContent children. Pass as prop on NavbarContent.',
    },
    {
      name: '...props (NavbarLink)',
      type: 'isActive?: boolean',
      default: 'false',
      description: 'Marks a NavbarLink as the current page. Sets aria-current="page".',
    },
  ],

  pagination: [
    {
      name: 'isActive',
      type: 'boolean',
      default: 'false',
      description: 'Marks a PaginationLink as the current page. Sets aria-current="page".',
    },
    {
      name: 'size',
      type: "'default' | 'sm' | 'lg'",
      default: "'default'",
      description: 'Size of PaginationLink buttons.',
    },
    {
      name: 'href',
      type: 'string',
      required: true,
      description: 'URL for the pagination anchor link.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  command: [
    {
      name: 'value',
      type: 'string',
      description: 'Controlled selected value.',
    },
    {
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Callback when the selected value changes.',
    },
    {
      name: 'filter',
      type: '(value: string, search: string) => number',
      description: 'Custom filter function. Return 1 for a match, 0 for no match.',
    },
    {
      name: 'shouldFilter',
      type: 'boolean',
      default: 'true',
      description: 'Whether cmdk should filter items internally. Set to false for async/server-side filtering.',
    },
    {
      name: 'loop',
      type: 'boolean',
      default: 'false',
      description: 'When true, keyboard navigation wraps from the last item back to the first.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'code-block': [
    {
      name: 'code',
      type: 'string',
      required: true,
      description: 'The raw code string to display.',
    },
    {
      name: 'language',
      type: 'string',
      description: 'Language label displayed as a badge in the header.',
    },
    {
      name: 'showLineNumbers',
      type: 'boolean',
      default: 'false',
      description: 'Show line numbers alongside the code.',
    },
    {
      name: 'showCopyButton',
      type: 'boolean',
      default: 'true',
      description: 'Show a copy-to-clipboard button in the header.',
    },
    {
      name: 'title',
      type: 'string',
      description: 'Optional title (e.g., filename) displayed in the header.',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Pre-highlighted content to render instead of raw code lines.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  heading: [
    {
      name: 'level',
      type: '1 | 2 | 3 | 4 | 5 | 6',
      default: '2',
      description: 'Semantic heading level, controls which HTML element is rendered (h1–h6).',
    },
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'",
      description: 'Visual size override. Auto-mapped from level if not set.',
    },
    {
      name: 'weight',
      type: "'normal' | 'medium' | 'semibold' | 'bold'",
      default: "'semibold'",
      description: 'Font weight of the heading.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  stepper: [
    {
      name: 'activeStep',
      type: 'number',
      default: '0',
      description: 'Zero-based index of the currently active step. All steps before this index are considered complete.',
    },
    {
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Layout direction of the stepper. "vertical" stacks steps top-to-bottom.',
    },
    {
      name: 'step',
      type: 'number',
      required: true,
      description: 'Zero-based step index passed to StepperItem and StepperTrigger. Used to auto-derive status.',
    },
    {
      name: 'status',
      type: "'complete' | 'active' | 'upcoming'",
      description: 'Explicit status override for StepperItem or StepperTrigger. Auto-derived from activeStep if omitted.',
    },
    {
      name: 'complete',
      type: 'boolean',
      default: 'false',
      description: 'Whether the StepperSeparator line renders in its completed style.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  text: [
    {
      name: 'as',
      type: "'p' | 'span' | 'div' | 'label'",
      default: "'p'",
      description: 'HTML element to render.',
    },
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: 'Font size of the text.',
    },
    {
      name: 'weight',
      type: "'normal' | 'medium' | 'semibold' | 'bold'",
      default: "'normal'",
      description: 'Font weight of the text.',
    },
    {
      name: 'color',
      type: "'primary' | 'secondary' | 'tertiary' | 'inherit'",
      default: "'primary'",
      description: 'Text color mapped to semantic color tokens.',
    },
    {
      name: 'leading',
      type: "'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'",
      default: "'normal'",
      description: 'Line height of the text.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  timeline: [
    {
      name: 'status',
      type: "'complete' | 'active' | 'upcoming'",
      default: "'upcoming'",
      description: 'Status of a TimelineItem, controls dot and connector styling.',
    },
    {
      name: 'dateTime',
      type: 'string',
      description: 'Machine-readable date for TimelineTimestamp (HTML time element).',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  menubar: [
    {
      name: 'variant',
      type: "'default' | 'destructive'",
      default: "'default'",
      description: 'Visual style of MenubarItem. Use "destructive" for dangerous actions like delete.',
    },
    {
      name: 'inset',
      type: 'boolean',
      default: 'false',
      description: 'Adds left padding to align items that have no icon with items that do.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the menu item, preventing selection and applying reduced-opacity styling.',
    },
    {
      name: 'onSelect',
      type: '(event: Event) => void',
      description: 'Callback when the item is selected. Called on click or Enter key.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  carousel: [
    {
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Scroll direction of the carousel.',
    },
    {
      name: 'opts',
      type: 'EmblaOptionsType',
      description: 'Embla Carousel options for fine-grained control.',
    },
    {
      name: 'plugins',
      type: 'EmblaPluginType[]',
      description: 'Embla Carousel plugins (e.g., autoplay, auto-scroll).',
    },
    {
      name: 'setApi',
      type: '(api: CarouselApi) => void',
      description: 'Callback to receive the Embla API instance.',
    },
  ],

  image: [
    {
      name: 'aspectRatio',
      type: "'square' | 'video' | 'portrait' | 'auto'",
      default: "'auto'",
      description: 'Preset aspect ratio for the image container.',
    },
    {
      name: 'fallback',
      type: 'ReactNode',
      description: 'Content shown when the image fails to load.',
    },
    {
      name: 'objectFit',
      type: "'cover' | 'contain' | 'fill' | 'none'",
      default: "'cover'",
      description: 'How the image fits within its container.',
    },
    {
      name: 'loading',
      type: "'eager' | 'lazy'",
      default: "'lazy'",
      description: 'Native browser loading strategy.',
    },
  ],

  calendar: [
    {
      name: 'mode',
      type: "'single' | 'multiple' | 'range'",
      description: 'Selection mode for the calendar.',
    },
    {
      name: 'selected',
      type: 'Date | Date[] | DateRange',
      description: 'Currently selected date(s).',
    },
    {
      name: 'onSelect',
      type: '(date: Date | undefined) => void',
      description: 'Callback when a date is selected.',
    },
    {
      name: 'disabled',
      type: 'Matcher | Matcher[]',
      description: 'Dates to disable (date objects, ranges, or matchers).',
    },
  ],

  'date-picker': [
    {
      name: 'value',
      type: 'Date',
      description: 'The selected date.',
    },
    {
      name: 'onChange',
      type: '(date: Date | undefined) => void',
      description: 'Callback when the date changes.',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'Pick a date'",
      description: 'Text shown when no date is selected.',
    },
    {
      name: 'dateFormat',
      type: 'string',
      default: "'PPP'",
      description: 'Date format string (date-fns format).',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the date picker.',
    },
  ],

  'file-upload': [
    {
      name: 'accept',
      type: 'string',
      description: "Accepted file types (e.g., 'image/*', '.pdf,.doc').",
    },
    {
      name: 'maxSize',
      type: 'number',
      default: '10',
      description: 'Maximum file size in MB.',
    },
    {
      name: 'maxFiles',
      type: 'number',
      default: '1',
      description: 'Maximum number of files allowed.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the drop zone.',
    },
    {
      name: 'onFilesChange',
      type: '(files: File[]) => void',
      description: 'Callback when valid files are selected or dropped.',
    },
  ],

  lightbox: [
    {
      name: 'images',
      type: 'LightboxImage[]',
      required: true,
      description: 'Array of images to display. Each image requires a src URL and descriptive alt text.',
    },
    {
      name: 'initialIndex',
      type: 'number',
      default: '0',
      description: 'Zero-based index of the image to show when the lightbox first opens.',
    },
    {
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state. Use with onOpenChange for fully controlled usage.',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Callback when the open state changes (user closes or Escape is pressed).',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Accepts LightboxTrigger and LightboxContent as children.',
    },
  ],

  checkbox: [
    {
      name: 'checked',
      type: 'boolean | "indeterminate"',
      description: 'Controlled checked state.',
    },
    {
      name: 'defaultChecked',
      type: 'boolean',
      description: 'Default checked state for uncontrolled usage.',
    },
    {
      name: 'onCheckedChange',
      type: '(checked: boolean | "indeterminate") => void',
      description: 'Callback when the checked state changes.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the checkbox.',
    },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: 'Marks the checkbox as required for form validation.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  input: [
    {
      name: 'type',
      type: 'string',
      default: "'text'",
      description: 'HTML input type (text, email, password, number, file, etc.).',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Controls height, padding, font-size, and border-radius.',
    },
    {
      name: 'placeholder',
      type: 'string',
      description: 'Placeholder text shown when the input is empty.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the input.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
    {
      name: '...props',
      type: 'React.InputHTMLAttributes<HTMLInputElement>',
      description: 'All standard HTML input attributes are forwarded.',
    },
  ],

  label: [
    {
      name: 'htmlFor',
      type: 'string',
      description: 'The ID of the form element this label is associated with.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
    {
      name: '...props',
      type: 'React.LabelHTMLAttributes<HTMLLabelElement>',
      description: 'All standard HTML label attributes are forwarded.',
    },
  ],

  select: [
    {
      name: 'value',
      type: 'string',
      description: 'Controlled value of the selected item.',
    },
    {
      name: 'defaultValue',
      type: 'string',
      description: 'Default selected value for uncontrolled usage.',
    },
    {
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Callback when the selected value changes.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the select.',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Size of the select trigger (on SelectTrigger).',
    },
    {
      name: 'position',
      type: "'popper' | 'item-aligned'",
      default: "'popper'",
      description: 'Positioning mode of the dropdown content (on SelectContent).',
    },
  ],

  switch: [
    {
      name: 'checked',
      type: 'boolean',
      description: 'Controlled checked state.',
    },
    {
      name: 'defaultChecked',
      type: 'boolean',
      description: 'Default checked state for uncontrolled usage.',
    },
    {
      name: 'onCheckedChange',
      type: '(checked: boolean) => void',
      description: 'Callback when the checked state changes.',
    },
    {
      name: 'size',
      type: "'default' | 'sm'",
      default: "'default'",
      description: 'Size of the switch.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the switch.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  textarea: [
    {
      name: 'placeholder',
      type: 'string',
      description: 'Placeholder text shown when the textarea is empty.',
    },
    {
      name: 'rows',
      type: 'number',
      description: 'Number of visible text rows.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the textarea.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
    {
      name: '...props',
      type: 'React.TextareaHTMLAttributes<HTMLTextAreaElement>',
      description: 'All standard HTML textarea attributes are forwarded.',
    },
  ],

  field: [
    {
      name: 'orientation',
      type: "'vertical' | 'horizontal'",
      default: "'vertical'",
      description: 'Layout direction of the field group.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'field-error': [
    {
      name: 'errors',
      type: 'Array<{ message?: string } | undefined>',
      description: 'Array of error objects to display. Duplicates are deduplicated by message.',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Custom error content. Takes precedence over the errors prop.',
    },
  ],

  fieldset: [
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables all form controls within the fieldset.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
    {
      name: '...props',
      type: 'React.FieldsetHTMLAttributes<HTMLFieldSetElement>',
      description: 'All standard HTML fieldset attributes are forwarded.',
    },
  ],

  'search-input': [
    {
      name: 'onClear',
      type: '() => void',
      description: 'Callback when the clear button is clicked.',
    },
    {
      name: 'placeholder',
      type: 'string',
      description: 'Placeholder text for the search field.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the search input.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the wrapper.',
    },
    {
      name: '...props',
      type: 'React.InputHTMLAttributes<HTMLInputElement>',
      description: 'All standard HTML input attributes are forwarded.',
    },
  ],

  'password-input': [
    {
      name: 'showStrength',
      type: 'boolean',
      default: 'false',
      description: 'Show a password strength meter below the input.',
    },
    {
      name: 'placeholder',
      type: 'string',
      description: 'Placeholder text for the password field.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the password input.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the wrapper.',
    },
    {
      name: '...props',
      type: 'React.InputHTMLAttributes<HTMLInputElement>',
      description: 'All standard HTML input attributes are forwarded.',
    },
  ],

  'number-input': [
    {
      name: 'value',
      type: 'number',
      description: 'Controlled numeric value.',
    },
    {
      name: 'defaultValue',
      type: 'number',
      description: 'Default value for uncontrolled usage.',
    },
    {
      name: 'onChange',
      type: '(value: number | undefined) => void',
      description: 'Callback when the value changes.',
    },
    {
      name: 'min',
      type: 'number',
      description: 'Minimum allowed value.',
    },
    {
      name: 'max',
      type: 'number',
      description: 'Maximum allowed value.',
    },
    {
      name: 'step',
      type: 'number',
      default: '1',
      description: 'Increment/decrement step size.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the number input and buttons.',
    },
  ],

  'phone-input': [
    {
      name: 'id',
      type: 'string',
      description: 'HTML id attribute for the input element.',
    },
    {
      name: 'name',
      type: 'string',
      description: 'HTML name attribute for the input element.',
    },
    {
      name: 'value',
      type: 'string',
      description: 'Initial phone number value (e.g. "+14155551234").',
    },
    {
      name: 'placeholder',
      type: 'string',
      description: 'Placeholder text for the input.',
    },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: 'Whether the field is required.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Whether the field is disabled.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS classes applied to the wrapper.',
    },
    {
      name: 'onChange',
      type: '(value: string, isValid: boolean) => void',
      description: 'Called with the full international number and validation status on every change.',
    },
    {
      name: 'onBlur',
      type: '() => void',
      description: 'Called when the input loses focus.',
    },
  ],

  'otp-input': [
    {
      name: 'length',
      type: 'number',
      default: '6',
      description: 'Number of digit cells.',
    },
    {
      name: 'value',
      type: 'string',
      description: 'Controlled value (digits only).',
    },
    {
      name: 'onChange',
      type: '(value: string) => void',
      description: 'Callback when the code changes.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables all digit cells.',
    },
    {
      name: 'autoFocus',
      type: 'boolean',
      default: 'false',
      description: 'Auto-focus the first cell on mount.',
    },
  ],

  'tag-input': [
    {
      name: 'value',
      type: 'string[]',
      description: 'Controlled array of tag strings.',
    },
    {
      name: 'defaultValue',
      type: 'string[]',
      description: 'Default tags for uncontrolled usage.',
    },
    {
      name: 'onChange',
      type: '(tags: string[]) => void',
      description: 'Callback when the tag list changes.',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'Add tag...'",
      description: 'Placeholder text when no tags are entered.',
    },
    {
      name: 'max',
      type: 'number',
      description: 'Maximum number of tags allowed.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the tag input.',
    },
  ],

  'accessibility-specimen': [
    {
      name: 'fgToken',
      type: 'string',
      required: true,
      description: 'CSS custom property for the foreground/text color (e.g. "--text-primary").',
    },
    {
      name: 'bgToken',
      type: 'string',
      required: true,
      description: 'CSS custom property for the background color (e.g. "--surface-page").',
    },
    {
      name: 'fgLabel',
      type: 'string',
      required: true,
      description: 'Human-readable label for the foreground color.',
    },
    {
      name: 'bgLabel',
      type: 'string',
      required: true,
      description: 'Human-readable label for the background color.',
    },
    {
      name: 'ratio',
      type: 'number',
      required: true,
      description: 'Contrast ratio (e.g. 4.5).',
    },
    {
      name: 'wcagAA',
      type: 'boolean',
      required: true,
      description: 'Whether the color pair passes WCAG AA (4.5:1 for normal text).',
    },
    {
      name: 'wcagAAA',
      type: 'boolean',
      required: true,
      description: 'Whether the color pair passes WCAG AAA (7:1 for normal text).',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'color-swatch': [
    {
      name: 'token',
      type: 'string',
      required: true,
      description: 'CSS custom property token name (e.g. "--color-blue-500").',
    },
    {
      name: 'hex',
      type: 'string',
      required: true,
      description: 'Hex value for fallback and display.',
    },
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Label shown beneath the swatch.',
    },
    {
      name: 'lightText',
      type: 'boolean',
      default: 'false',
      description: 'When true, hex text renders white instead of dark.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'color-swatch-grid': [
    {
      name: 'label',
      type: 'string',
      required: true,
      description: 'Scale name shown above the grid.',
    },
    {
      name: 'swatches',
      type: 'ColorSwatchProps[]',
      required: true,
      description: 'Array of swatch data to render.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'elevation-card': [
    {
      name: 'token',
      type: 'string',
      required: true,
      description: 'CSS custom property for the shadow (e.g. "--shadow-md").',
    },
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Display name for the shadow level (e.g. "md").',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'icon-grid': [
    {
      name: 'icons',
      type: 'IconGridItemProps[]',
      required: true,
      description: 'Array of icon items with name, usage, and rendered icon element.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'motion-specimen': [
    {
      name: 'durations',
      type: 'MotionDurationItemProps[]',
      required: true,
      description: 'Array of duration items with token, name, and ms values. (MotionDuration component)',
    },
    {
      name: 'easings',
      type: 'MotionEasingItemProps[]',
      required: true,
      description: 'Array of easing items with token, name, and CSS value. (MotionEasing component)',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'opacity-bar': [
    {
      name: 'levels',
      type: 'OpacityBarItemProps[]',
      required: true,
      description: 'Array of opacity levels with token, name, and value (0–1).',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'radius-scale': [
    {
      name: 'steps',
      type: 'RadiusScaleItemProps[]',
      required: true,
      description: 'Array of radius steps with token, name, and px values.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'spacing-scale': [
    {
      name: 'steps',
      type: 'SpacingScaleItemProps[]',
      required: true,
      description: 'Array of spacing steps with token, name, px, and rem values.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'surface-row': [
    {
      name: 'token',
      type: 'string',
      required: true,
      description: 'CSS custom property for the surface background (e.g. "--surface-card").',
    },
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Display name for the surface.',
    },
    {
      name: 'lightText',
      type: 'boolean',
      default: 'false',
      description: 'When true, text renders in light/inverse colors for dark surfaces.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  'type-specimen': [
    {
      name: 'token',
      type: 'string',
      required: true,
      description: 'CSS custom property for font size (e.g. "--font-size-xl").',
    },
    {
      name: 'label',
      type: 'string',
      required: true,
      description: 'Label for this type step (e.g. "xl", "base").',
    },
    {
      name: 'sizePx',
      type: 'number',
      required: true,
      description: 'Font size in pixels for fallback display.',
    },
    {
      name: 'sampleText',
      type: 'string',
      required: true,
      description: 'Sample text to render at this size.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the element.',
    },
  ],

  sphere: [
    {
      name: 'mode',
      type: "'sphere' | 'curl' | 'turing' | 'lorenz' | 'tendrils'",
      default: "'sphere'",
      description: 'Geometry mode for particle distribution.',
    },
    {
      name: 'colorScheme',
      type: "'solar' | 'aqua' | 'ember' | 'aurora' | 'ghost'",
      default: "'solar'",
      description: 'Named color scheme. Overridden by colors if both are provided.',
    },
    {
      name: 'colors',
      type: 'GradientColors',
      description: 'Custom 5-stop gradient colors (RGB 0-1 range). Overrides colorScheme.',
    },
    {
      name: 'particleCount',
      type: 'number',
      default: '256000',
      description: 'Number of particles rendered.',
    },
    {
      name: 'radius',
      type: 'number',
      default: '1.2',
      description: 'Sphere radius.',
    },
    {
      name: 'scale',
      type: 'number',
      default: '1.0',
      description: 'Overall scale multiplier.',
    },
    {
      name: 'speed',
      type: 'number',
      default: '1.0',
      description: 'Animation speed multiplier.',
    },
    {
      name: 'waves',
      type: 'number',
      default: '1.0',
      description: 'Noise displacement multiplier (wave amplitude).',
    },
    {
      name: 'dotSize',
      type: 'number',
      default: '1.0',
      description: 'Particle size multiplier.',
    },
    {
      name: 'blur',
      type: 'number',
      default: '0.5',
      description: 'Particle softness (0 = hard dots, 1 = full glow).',
    },
    {
      name: 'saturation',
      type: 'number',
      default: '1.0',
      description: 'Color saturation multiplier.',
    },
    {
      name: 'lightness',
      type: 'number',
      default: '1.0',
      description: 'Color lightness multiplier.',
    },
    {
      name: 'thinkIntensity',
      type: 'number',
      default: '0',
      description: 'Think-mode intensity (0–1). Controls layered animation effects.',
    },
    {
      name: 'thinkEffects',
      type: 'SphereThinkEffects',
      description: 'Which think-mode effects are enabled (pulses, ramp, scatter). All enabled by default.',
    },
    {
      name: 'orbitControls',
      type: 'boolean',
      default: 'true',
      description: 'Enable drag-to-rotate orbit controls.',
    },
    {
      name: 'autoRotate',
      type: 'boolean',
      default: 'true',
      description: 'Enable automatic rotation.',
    },
    {
      name: 'autoRotateSpeed',
      type: 'number',
      default: '0.5',
      description: 'Auto-rotation speed.',
    },
    {
      name: 'maxPixelRatio',
      type: 'number',
      default: '2',
      description: 'Max device pixel ratio (clamped for performance).',
    },
    {
      name: 'backgroundColor',
      type: 'number',
      default: '0x000000',
      description: 'Background color as a hex number.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class for the container div.',
    },
    {
      name: 'style',
      type: 'React.CSSProperties',
      description: 'Inline style for the container div.',
    },
  ],

  'activity-feed': [
    {
      name: 'variant',
      type: "'default' | 'compact' | 'timeline'",
      default: "'default'",
      description:
        'Display mode. Default is padded rows with borders, compact is denser with smaller text, timeline adds a connecting rail between leading indicators.',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'ActivityFeedItem children.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the root <ol>.',
    },
    {
      name: '...props',
      type: 'React.HTMLAttributes<HTMLOListElement>',
      description: 'All standard HTML attributes are forwarded to the root <ol>.',
    },
  ],

  'activity-feed-item': [
    {
      name: 'title',
      type: 'React.ReactNode',
      required: true,
      description: 'Primary event description.',
    },
    {
      name: 'timestamp',
      type: 'React.ReactNode',
      required: true,
      description:
        'Pre-formatted timestamp. Pass a string, or pass your own <time> element for full control over dateTime semantics.',
    },
    {
      name: 'leading',
      type: 'React.ReactNode',
      description: 'Leading visual — icon, avatar, or colored dot.',
    },
    {
      name: 'description',
      type: 'React.ReactNode',
      description: 'Optional secondary detail beneath the title.',
    },
    {
      name: 'actor',
      type: 'React.ReactNode',
      description:
        'Who performed the event — a name string, or an avatar + name cluster.',
    },
    {
      name: 'trailing',
      type: 'React.ReactNode',
      description: 'Right-aligned meta slot — status badge, link, etc.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the <li>.',
    },
    {
      name: '...props',
      type: 'React.LiHTMLAttributes<HTMLLIElement>',
      description: 'All standard HTML attributes are forwarded to the <li>.',
    },
  ],

  'bulk-action-bar': [
    {
      name: 'count',
      type: 'number',
      required: true,
      description:
        'Number of selected items. The bar returns null when count is 0 or less.',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      required: true,
      description:
        'Action buttons cluster — typically one or more Button instances.',
    },
    {
      name: 'inline',
      type: 'boolean',
      default: 'false',
      description:
        'Render inline (non-sticky) instead of fixed to the viewport bottom.',
    },
    {
      name: 'label',
      type: '(count: number) => React.ReactNode',
      default: '(n) => `${n} selected`',
      description:
        'Renderer for the selection count label. Wrapped in aria-live="polite" so changes are announced.',
    },
    {
      name: 'clearLabel',
      type: 'React.ReactNode',
      default: "'Clear selection'",
      description:
        'Aria-label for the dismiss button. Used verbatim when it is a string.',
    },
    {
      name: 'onClear',
      type: '() => void',
      description:
        'Fired by the Escape key and the dismiss button. The Escape handler is only attached when this is provided.',
    },
    {
      name: 'dismissible',
      type: 'boolean',
      default: 'true',
      description:
        'Show the dismiss (X) button. Requires onClear to render the button.',
    },
    {
      name: 'autoFocus',
      type: 'boolean',
      default: 'true',
      description:
        'Auto-focus the first enabled action button on mount. Only runs on mount, not on count changes.',
    },
  ],

  'confirm-dialog': [
    {
      name: 'title',
      type: 'React.ReactNode',
      required: true,
      description:
        'Dialog title. Rendered next to the severity icon inside DialogTitle.',
    },
    {
      name: 'description',
      type: 'React.ReactNode',
      description:
        'Short body above the action row. Used as DialogDescription for aria-describedby.',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Richer body slot. Overrides description when both are provided.',
    },
    {
      name: 'severity',
      type: "'info' | 'warning' | 'danger'",
      default: "'warning'",
      description:
        'Drives icon, icon color, and confirm button variant. Danger uses the destructive button variant and focuses the cancel button on open.',
    },
    {
      name: 'trigger',
      type: 'React.ReactNode',
      description:
        'Optional trigger wrapped in DialogTrigger. Omit for fully-controlled usage with `open`/`onOpenChange`.',
    },
    {
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state.',
    },
    {
      name: 'defaultOpen',
      type: 'boolean',
      description: 'Uncontrolled initial open state.',
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the dialog open state changes.',
    },
    {
      name: 'confirmLabel',
      type: 'React.ReactNode',
      description:
        'Confirm button label. Defaults to "Delete" when severity is "danger", otherwise "Confirm".',
    },
    {
      name: 'cancelLabel',
      type: 'React.ReactNode',
      default: "'Cancel'",
      description: 'Cancel button label.',
    },
    {
      name: 'confirmText',
      type: 'string',
      description:
        'If set, the user must type this exact (case-sensitive) string to enable the confirm button.',
    },
    {
      name: 'confirmTextLabel',
      type: 'React.ReactNode',
      description:
        'Label for the confirm-text input. Defaults to "Type {confirmText} to confirm".',
    },
    {
      name: 'onConfirm',
      type: '() => void | Promise<void>',
      description:
        'Confirm handler. Returning a Promise enables pending state and keeps the dialog open until resolved. On rejection the dialog stays open and the error is re-thrown so the consumer can observe it.',
    },
    {
      name: 'onCancel',
      type: '() => void',
      description: 'Cancel handler. Called before the dialog closes.',
    },
    {
      name: 'busy',
      type: 'boolean',
      description:
        'Externally-controlled busy state. Overrides internal async pending detection and disables both buttons.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names merged onto DialogContent.',
    },
  ],

  'data-table': [
    {
      name: 'columns',
      type: 'ColumnDef<TData, TValue>[]',
      required: true,
      description:
        'Tanstack column definitions. Each entry drives the header, cell renderer, sort behavior, and column id.',
    },
    {
      name: 'data',
      type: 'TData[]',
      required: true,
      description: 'Array of row records to render.',
    },
    {
      name: 'sorting',
      type: 'SortingState',
      description: 'Controlled sorting state. Omit for uncontrolled usage.',
    },
    {
      name: 'onSortingChange',
      type: 'OnChangeFn<SortingState>',
      description: 'Called when sorting state changes.',
    },
    {
      name: 'defaultSorting',
      type: 'SortingState',
      description: 'Uncontrolled initial sorting state.',
    },
    {
      name: 'pagination',
      type: 'PaginationState',
      description: 'Controlled pagination state.',
    },
    {
      name: 'onPaginationChange',
      type: 'OnChangeFn<PaginationState>',
      description: 'Called when pagination state changes.',
    },
    {
      name: 'pageSize',
      type: 'number',
      default: '10',
      description: 'Initial page size when pagination is uncontrolled.',
    },
    {
      name: 'pageSizeOptions',
      type: 'number[]',
      default: '[10, 25, 50, 100]',
      description: 'Options for the rows-per-page select.',
    },
    {
      name: 'enableRowSelection',
      type: 'boolean',
      default: 'false',
      description:
        'When true, injects a checkbox column at position 0 with select-all and per-row checkboxes.',
    },
    {
      name: 'rowSelection',
      type: 'RowSelectionState',
      description: 'Controlled row selection state.',
    },
    {
      name: 'onRowSelectionChange',
      type: 'OnChangeFn<RowSelectionState>',
      description: 'Called when row selection state changes.',
    },
    {
      name: 'getRowId',
      type: '(row: TData, index: number) => string',
      description:
        'Custom stable row id getter. Defaults to index-based ids when omitted.',
    },
    {
      name: 'globalFilter',
      type: 'string',
      description: 'Controlled global filter value.',
    },
    {
      name: 'onGlobalFilterChange',
      type: '(value: string) => void',
      description: 'Called when the global filter value changes.',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description:
        'When true, renders skeleton rows in place of data rows.',
    },
    {
      name: 'emptyState',
      type: 'React.ReactNode',
      description:
        'Override for the default EmptyState slot rendered when data is empty.',
    },
    {
      name: 'stickyHeader',
      type: 'boolean',
      default: 'false',
      description:
        'When true, the thead is positioned sticky at the top of the scroll container.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names merged onto the root div.',
    },
  ],

  'empty-state': [
    {
      name: 'heading',
      type: 'React.ReactNode',
      required: true,
      description:
        'Short direct statement of the empty condition. Rendered in the element given by headingAs.',
    },
    {
      name: 'icon',
      type: 'React.ReactNode',
      description:
        'Leading visual, typically a Phosphor icon. Marked aria-hidden since the heading text carries the meaning.',
    },
    {
      name: 'description',
      type: 'React.ReactNode',
      description: '1-2 sentence explanation or guidance beneath the heading.',
    },
    {
      name: 'action',
      type: 'React.ReactNode',
      description: 'Primary CTA slot. Typically a Button.',
    },
    {
      name: 'secondaryAction',
      type: 'React.ReactNode',
      description: 'De-emphasized fallback action. Typically a Button.',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description:
        'Controls padding, icon size, heading size, and overall vertical rhythm.',
    },
    {
      name: 'tone',
      type: "'default' | 'subtle'",
      default: "'default'",
      description:
        'Default uses a dashed border on a muted surface. Subtle is borderless.',
    },
    {
      name: 'headingAs',
      type: "'h2' | 'h3' | 'h4'",
      default: "'h3'",
      description: 'Heading element used for the heading slot.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the root element.',
    },
    {
      name: '...props',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'All standard HTML attributes are forwarded to the root div.',
    },
  ],

  'filter-bar': [
    {
      name: 'searchValue',
      type: 'string',
      description: 'Controlled value for the search input.',
    },
    {
      name: 'onSearchChange',
      type: '(value: string) => void',
      description:
        'Handler for search input changes. When omitted, the search input is not rendered.',
    },
    {
      name: 'searchPlaceholder',
      type: 'string',
      default: "'Search...'",
      description: 'Placeholder text for the search input.',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Filter control slot — typically Select or Combobox instances rendered horizontally after the search.',
    },
    {
      name: 'activeFilters',
      type: 'FilterBarChip[]',
      description:
        'Active filters rendered as removable Badge chips on a secondary row. Each chip has { id, label, onRemove }.',
    },
    {
      name: 'onClearAll',
      type: '() => void',
      description:
        'Handler for the clear-all button. The button only renders when this is provided AND at least one filter is active or a search value is present.',
    },
    {
      name: 'clearLabel',
      type: 'React.ReactNode',
      default: "'Clear all'",
      description: 'Label for the clear-all button.',
    },
    {
      name: 'resultsCount',
      type: 'React.ReactNode',
      description:
        'Meta text rendered on the far right, e.g. "42 results". Wrapped in aria-live="polite" so filter changes are announced.',
    },
    {
      name: 'dense',
      type: 'boolean',
      default: 'false',
      description: 'Tighter padding for dense admin layouts.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the root element.',
    },
    {
      name: '...props',
      type: 'React.HTMLAttributes<HTMLDivElement>',
      description: 'All standard HTML attributes are forwarded to the root div.',
    },
  ],

  'kbd': [
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Single-key content rendered inside the <kbd>. Ignored when `keys` is provided.',
    },
    {
      name: 'keys',
      type: 'string[]',
      description:
        'If provided, renders each key as its own <kbd> joined by `separator`. Mutually exclusive with `children` — `keys` wins if both are passed.',
    },
    {
      name: 'separator',
      type: 'React.ReactNode',
      default: "'+'",
      description:
        'Separator rendered between keys in a multi-key sequence. Wrapped in an aria-hidden span so screen readers read each <kbd> on its own.',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Controls padding and font-size of each key cap.',
    },
    {
      name: 'variant',
      type: "'default' | 'outline'",
      default: "'default'",
      description:
        'Default uses a filled muted surface; outline is transparent with a border only.',
    },
    {
      name: 'className',
      type: 'string',
      description:
        'Additional CSS class names merged onto the root element (the single <kbd> or, in multi-key mode, the wrapper <span>).',
    },
    {
      name: '...props',
      type: 'React.HTMLAttributes<HTMLElement>',
      description:
        'All standard HTML attributes are forwarded to the root element.',
    },
  ],

  'page-header': [
    {
      name: 'title',
      type: 'React.ReactNode',
      required: true,
      description:
        'Page heading content. Rendered in the element given by titleAs.',
    },
    {
      name: 'eyebrow',
      type: 'React.ReactNode',
      description: 'Small uppercase label rendered above the title.',
    },
    {
      name: 'description',
      type: 'React.ReactNode',
      description: 'Supporting copy rendered below the title.',
    },
    {
      name: 'breadcrumb',
      type: 'React.ReactNode',
      description:
        'ReactNode rendered above the title row, typically a Breadcrumb component.',
    },
    {
      name: 'actions',
      type: 'React.ReactNode',
      description:
        'ReactNode rendered on the right side of the title row, typically a cluster of buttons.',
    },
    {
      name: 'as',
      type: "'header' | 'section' | 'div'",
      default: "'header'",
      description: 'Root element tag.',
    },
    {
      name: 'titleAs',
      type: "'h1' | 'h2' | 'h3'",
      default: "'h1'",
      description: 'Heading element used for the title.',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Controls vertical rhythm and title size.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the root element.',
    },
    {
      name: '...props',
      type: 'React.HTMLAttributes<HTMLElement>',
      description: 'All standard HTML attributes are forwarded to the root.',
    },
  ],

  'stat-card': [
    {
      name: 'label',
      type: 'React.ReactNode',
      required: true,
      description: 'Small uppercase label describing the metric.',
    },
    {
      name: 'value',
      type: 'React.ReactNode',
      required: true,
      description: 'Prominent metric value rendered in a large display size.',
    },
    {
      name: 'delta',
      type: 'StatCardDelta',
      description:
        'Change indicator with value, direction ("up" | "down" | "flat"), and optional context label. Direction is announced to screen readers.',
    },
    {
      name: 'trend',
      type: 'React.ReactNode',
      description:
        'Slot for a sparkline, chart, or icon rendered next to the label. Marked aria-hidden by default.',
    },
    {
      name: 'footer',
      type: 'React.ReactNode',
      description: 'Sublabel or link rendered beneath the value.',
    },
    {
      name: 'variant',
      type: "'default' | 'highlight'",
      default: "'default'",
      description:
        'Visual emphasis. Highlight adds an accent-tinted surface, border, and glow.',
    },
    {
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description:
        'Dimensional density. Use sm for dense rows of compact cards; md is the default dashboard size.',
    },
    {
      name: 'as',
      type: "'article' | 'section' | 'div'",
      default: "'article'",
      description: 'Root element tag. Defaults to article for landmark semantics.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the root element.',
    },
    {
      name: '...props',
      type: 'React.HTMLAttributes<HTMLElement>',
      description: 'All standard HTML attributes are forwarded to the root.',
    },
  ],

  'status-badge': [
    {
      name: 'status',
      type: "'healthy' | 'degraded' | 'down' | 'failed' | 'running' | 'pending' | 'queued' | 'idle' | 'complete'",
      required: true,
      description:
        'Semantic admin status. Drives the underlying Badge variant, the indicator dot color, and the default label.',
    },
    {
      name: 'label',
      type: 'React.ReactNode',
      description:
        'Visible text. Defaults to the capitalized status key (e.g. "Healthy", "Running").',
    },
    {
      name: 'tone',
      type: "'subtle' | 'filled'",
      default: "'subtle'",
      description:
        'Which Badge variant family to use. Filled uses saturated backgrounds; subtle uses tinted surfaces.',
    },
    {
      name: 'indicator',
      type: 'boolean',
      default: 'true',
      description: 'Render the leading colored indicator dot.',
    },
    {
      name: 'pulse',
      type: 'boolean',
      default: 'false',
      description:
        'Animate the indicator dot with a soft pulse. Respects prefers-reduced-motion.',
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS class names to merge onto the root element.',
    },
    {
      name: '...props',
      type: 'Omit<React.HTMLAttributes<HTMLSpanElement>, "children">',
      description:
        'All standard HTML attributes (except children) are forwarded to the underlying Badge element.',
    },
  ],
};
