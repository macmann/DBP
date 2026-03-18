import type { ChangeEvent } from "react";
import { TextArea } from "@/components/ui/input";

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
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
      </label>
      <TextArea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
