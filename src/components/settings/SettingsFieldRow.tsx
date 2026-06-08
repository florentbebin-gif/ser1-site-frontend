import React, { useId } from 'react';
import { numberOrEmpty } from './settingsHelpers';

type SettingsFieldValue = string | number | null | undefined;

interface SettingsFieldRowProps {
  label: string;
  path: string | string[];
  value: SettingsFieldValue;
  onChange: (path: string[], value: string | number | null) => void;
  type?: 'number' | 'text';
  step?: string;
  unit?: string;
  disabled?: boolean;
}

export default function SettingsFieldRow({
  label,
  path,
  value,
  onChange,
  type = 'number',
  step,
  unit,
  disabled = false,
}: SettingsFieldRowProps): React.ReactElement {
  const pathArray = Array.isArray(path) ? path : [path];
  const inputId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value;
    const parsed = raw === '' ? null : type === 'number' ? Number(raw) : raw;
    onChange(pathArray, parsed);
  };

  const displayValue =
    type === 'number' ? numberOrEmpty(typeof value === 'number' ? value : null) : (value ?? '');

  return (
    <div className={`settings-field-row${type === 'text' ? ' settings-field-row--text' : ''}`}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type={type}
        step={step}
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
      />
      {unit && <span>{unit}</span>}
    </div>
  );
}
