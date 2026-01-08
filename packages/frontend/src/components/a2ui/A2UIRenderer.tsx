import { A2UIComponent, A2UIView } from '@trainer3/shared';
import { A2UIScreen } from './A2UIScreen';
import { A2UISection } from './A2UISection';
import { A2UIText } from './A2UIText';
import { A2UIForm } from './A2UIForm';
import { A2UITableEditor } from './A2UITableEditor';
import { A2UIButton } from './A2UIButton';

interface A2UIRendererProps {
  view: A2UIView;
  onAction?: (action: any) => void;
}

export function A2UIRenderer({ view, onAction }: A2UIRendererProps) {
  return (
    <div className="a2ui-container">
      <A2UIComponentRenderer component={view.tree} onAction={onAction} />
    </div>
  );
}

interface ComponentRendererProps {
  component: A2UIComponent;
  onAction?: (action: any) => void;
}

export function A2UIComponentRenderer({ component, onAction }: ComponentRendererProps) {
  switch (component.type) {
    case 'screen':
      return <A2UIScreen component={component} onAction={onAction} />;
    case 'section':
      return <A2UISection component={component} onAction={onAction} />;
    case 'text':
      return <A2UIText component={component} />;
    case 'form':
      return <A2UIForm component={component} onAction={onAction} />;
    case 'table_editor':
      return <A2UITableEditor component={component} onAction={onAction} />;
    case 'button':
      return <A2UIButton component={component} onAction={onAction} />;
    default:
      console.warn('Unknown A2UI component type:', (component as any).type);
      return null;
  }
}
