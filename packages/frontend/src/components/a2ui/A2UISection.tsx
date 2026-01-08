import { A2UISection as A2UISectionType } from '@trainer3/shared';
import { A2UIComponentRenderer } from './A2UIRenderer';

interface A2UISectionProps {
  component: A2UISectionType;
  onAction?: (action: any) => void;
}

export function A2UISection({ component, onAction }: A2UISectionProps) {
  return (
    <div className="border-l-4 border-primary-500 pl-4 py-2">
      {component.title && (
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          {component.title}
        </h3>
      )}
      <div className="space-y-3">
        {component.children.map((child, index) => (
          <A2UIComponentRenderer key={index} component={child} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}
