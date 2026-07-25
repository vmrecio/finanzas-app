import type { ChangeEvent } from 'react';
import { Input, type InputProps } from '../atoms/Input';

export interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: InputProps['type'];
  required?: boolean;
}

/** Label + input pair. Pure presentational — owns only local controlled-input wiring. */
export function FormField({ label, name, value, onChange, type = 'text', required }: FormFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(event.target.value);
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-body-sm font-bold text-on-surface">{label}</span>
      <Input id={name} name={name} type={type} value={value} onChange={handleChange} required={required} />
    </label>
  );
}
