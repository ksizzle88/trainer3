import { useState } from 'react';
import { A2UIForm as A2UIFormType, A2UIField } from '@trainer3/shared';

interface A2UIFormProps {
  component: A2UIFormType;
  onAction?: (action: any) => void;
}

export function A2UIForm({ component, onAction }: A2UIFormProps) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    component.fields.forEach((field) => {
      if ('defaultValue' in field && field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      }
    });
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAction?.({
      kind: 'form.submit',
      form_id: component.id,
      values,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {component.fields.map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={(value) => setValues({ ...values, [field.name]: value })}
        />
      ))}
      <button
        type="submit"
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {component.submit.label}
      </button>
    </form>
  );
}

interface FormFieldProps {
  field: A2UIField;
  value: any;
  onChange: (value: any) => void;
}

function FormField({ field, value, onChange }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.type === 'field.text' && (
        <input
          type="text"
          required={field.required}
          placeholder={field.placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      )}

      {field.type === 'field.number' && (
        <input
          type="number"
          required={field.required}
          placeholder={field.placeholder}
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={field.min}
          max={field.max}
          step={field.step}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      )}

      {field.type === 'field.datetime' && (
        <input
          type="datetime-local"
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      )}

      {field.type === 'field.select' && (
        <select
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
