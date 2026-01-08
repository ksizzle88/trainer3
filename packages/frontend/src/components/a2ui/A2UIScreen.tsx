import { A2UIScreen as A2UIScreenType } from '@trainer3/shared';
import { A2UIComponentRenderer } from './A2UIRenderer';

interface A2UIScreenProps {
  component: A2UIScreenType;
  onAction?: (action: any) => void;
}

export function A2UIScreen({ component, onAction }: A2UIScreenProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {component.title}
      </h2>
      <div className="space-y-4">
        {component.children.map((child, index) => (
          <A2UIComponentRenderer key={index} component={child} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}
