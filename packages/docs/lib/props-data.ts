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
};
