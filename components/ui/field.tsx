// Small form primitives sharing one visual language across checkout/auth/admin.

export function RequiredMark() {
  return (
    <span className="ml-0.5 font-semibold text-burgundy" aria-hidden="true">
      *
    </span>
  );
}

export function Label({
  required,
  children,
  className = "",
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      {...props}
      className={`block text-sm font-medium text-ink/90 ${className}`}
    >
      {children}
      {required ? <RequiredMark /> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`control-field ${className}`} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`control-field ${className}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select {...rest} className={`control-field ${className}`}>
      {children}
    </select>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-burgundy">
      {message}
    </p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-ink/50">{children}</p>;
}
