import { useState } from 'react';
import { A2UITableEditor as A2UITableEditorType } from '@trainer3/shared';

interface A2UITableEditorProps {
  component: A2UITableEditorType;
  onAction?: (action: any) => void;
}

export function A2UITableEditor({ component, onAction }: A2UITableEditorProps) {
  const [rows, setRows] = useState(component.rows);

  const handleCellEdit = (rowIndex: number, columnKey: string, value: any) => {
    const updated = [...rows];
    updated[rowIndex] = { ...updated[rowIndex], [columnKey]: value };
    setRows(updated);
  };

  const handleSave = () => {
    onAction?.({
      kind: 'table.save',
      table_id: component.id,
      rows,
    });
  };

  const handleAddRow = () => {
    const newRow: Record<string, any> = { row_id: `row_${Date.now()}` };
    component.columns.forEach((col) => {
      newRow[col.key] = '';
    });
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (rowId: string) => {
    setRows(rows.filter((row) => row.row_id !== rowId));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {component.columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {col.label}
                {col.required && <span className="text-red-500 ml-1">*</span>}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((row, rowIndex) => (
            <tr key={row.row_id}>
              {component.columns.map((col) => (
                <td key={col.key} className="px-4 py-2">
                  <input
                    type={col.type === 'number' ? 'number' : col.type === 'datetime' ? 'datetime-local' : 'text'}
                    value={row[col.key] || ''}
                    onChange={(e) =>
                      handleCellEdit(
                        rowIndex,
                        col.key,
                        col.type === 'number' ? parseFloat(e.target.value) : e.target.value
                      )
                    }
                    required={col.required}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  />
                </td>
              ))}
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => handleDeleteRow(row.row_id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex gap-2">
        {component.actions.map((action) => (
          <button
            key={action.kind}
            type="button"
            onClick={() => {
              if (action.kind === 'table.save') handleSave();
              else if (action.kind === 'table.add_row') handleAddRow();
            }}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
