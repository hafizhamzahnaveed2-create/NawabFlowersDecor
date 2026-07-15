// Small form primitives sharing one visual language across checkout/auth.

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`block text-sm font-medium ${props.className ?? ""}`}
    />
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
