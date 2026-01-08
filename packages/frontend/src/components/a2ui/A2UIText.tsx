import { A2UIText as A2UITextType } from '@trainer3/shared';

interface A2UITextProps {
  component: A2UITextType;
}

export function A2UIText({ component }: A2UITextProps) {
  const variantClasses = {
    heading: 'text-2xl font-bold text-gray-900 dark:text-white',
    subheading: 'text-xl font-semibold text-gray-800 dark:text-gray-100',
    body: 'text-base text-gray-700 dark:text-gray-300',
    caption: 'text-sm text-gray-600 dark:text-gray-400',
  };

  const className = component.variant
    ? variantClasses[component.variant]
    : variantClasses.body;

  return <p className={className}>{component.content}</p>;
}
