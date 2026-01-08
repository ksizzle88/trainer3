import { A2UIButton as A2UIButtonType } from '@trainer3/shared';

interface A2UIButtonProps {
  component: A2UIButtonType;
  onAction?: (action: any) => void;
}

export function A2UIButton({ component, onAction }: A2UIButtonProps) {
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const className = component.variant
    ? variantClasses[component.variant]
    : variantClasses.primary;

  return (
    <button
      onClick={() =>
        onAction?.({
          kind: 'button.click',
          button_id: component.id,
        })
      }
      className={`${className} px-4 py-2 rounded-lg font-medium transition-colors`}
    >
      {component.label}
    </button>
  );
}
