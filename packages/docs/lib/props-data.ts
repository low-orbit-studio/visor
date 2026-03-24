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
};
