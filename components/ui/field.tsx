// Small form primitives sharing one visual language across checkout/auth.

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
    <label {...props} className={`block text-sm font-medium ${className}`}>
      {children}
      {required ? <RequiredMark /> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5 placeholder:text-ink/40 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={`mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5 placeholder:text-ink/40 ${props.className ?? ""}`}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-burgundy">
      {message}
    </p>
  );
}
