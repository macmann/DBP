import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

type FormTextInputProps = {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
};

export function FormTextInput({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  required,
  error,
  helperText,
  disabled,
}: FormTextInputProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <Input
        id={id}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
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
