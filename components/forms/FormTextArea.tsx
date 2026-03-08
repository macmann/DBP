import type { ChangeEvent } from "react";

type FormTextAreaProps = {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  defaultValue?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
};

export function FormTextArea({
  id,
  name,
  label,
  placeholder,
  rows = 5,
  defaultValue,
  value,
  onChange,
  error,
}: FormTextAreaProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-neutral-900">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
