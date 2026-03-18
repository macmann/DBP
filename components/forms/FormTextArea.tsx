import type { ChangeEvent } from "react";
import { TextArea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

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
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
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
  helperText,
  required,
  disabled,
}: FormTextAreaProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <TextArea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={cn(error ? "border-danger/60 focus-visible:ring-danger/20" : undefined)}
      />
      {helperText ? (
        <p id={helperId} className="text-xs text-muted">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
