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
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'center'",
      description: 'Alignment of the popover content relative to the trigger.',
    },
    {
      name: 'sideOffset',
      type: 'number',
      default: '4',
      description: 'Distance in pixels between the trigger and the popover.',
    },
  ],

  'context-menu': [
    {
      name: 'variant',
      type: "'default' | 'destructive'",
      default: "'default'",
      description: 'Visual style of menu items.',
    },
    {
      name: 'inset',
      type: 'boolean',
      default: 'false',
      description: 'Adds left padding to align with items that have icons.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the menu item.',
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
      name: 'sideOffset',
      type: 'number',
      default: '4',
      description: 'Distance in pixels between the trigger and the card.',
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
      type: "'sm' | 'md' | 'lg'",
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
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'start'",
      description: 'Alignment of NavbarContent children.',
    },
    {
      name: 'isActive',
      type: 'boolean',
      default: 'false',
      description: 'Marks a NavbarLink as the current page.',
    },
  ],

  pagination: [
    {
      name: 'isActive',
      type: 'boolean',
      default: 'false',
      description: 'Marks a PaginationLink as the current page.',
    },
    {
      name: 'size',
      type: "'default' | 'sm' | 'lg'",
      default: "'default'",
      description: 'Size of pagination link buttons.',
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
      description: 'Custom filter function. Return 1 for match, 0 for no match.',
    },
    {
      name: 'placeholder',
      type: 'string',
      description: 'Placeholder text for the CommandInput search field.',
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
      description: 'Zero-based index of the currently active step.',
    },
    {
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Layout direction of the stepper.',
    },
    {
      name: 'step',
      type: 'number',
      required: true,
      description: 'Zero-based step index (on StepperItem and StepperTrigger).',
    },
    {
      name: 'status',
      type: "'complete' | 'active' | 'upcoming'",
      description: 'Explicit status override. Auto-derived from activeStep if not set.',
    },
    {
      name: 'complete',
      type: 'boolean',
      default: 'false',
      description: 'Whether the separator line shows as complete (on StepperSeparator).',
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
      description: 'Visual style of menu items.',
    },
    {
      name: 'inset',
      type: 'boolean',
      default: 'false',
      description: 'Adds left padding to align with items that have icons.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the menu item.',
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
      description: 'Array of images with src and alt properties.',
    },
    {
      name: 'initialIndex',
      type: 'number',
      default: '0',
      description: 'Index of the initially displayed image.',
    },
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
  ],
};
