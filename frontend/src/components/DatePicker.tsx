import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import './DatePicker.css';

export type DatePickerProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'id'> & {
  id: string;
  label: string;
  error?: boolean;
};

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { id, label, className, error, disabled, ...rest },
  ref
) {
  const rootClass = ['date-picker-field', className].filter(Boolean).join(' ');
  const inputClass = ['date-picker-input', error ? 'error' : ''].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <label className="date-picker-label" htmlFor={id}>
        {label}
      </label>
      <input
        {...rest}
        id={id}
        ref={ref}
        type="date"
        disabled={disabled}
        className={inputClass}
        aria-invalid={error ? true : undefined}
      />
    </div>
  );
});
