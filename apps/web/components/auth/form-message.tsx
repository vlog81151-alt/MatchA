export function FormMessage({
  error,
  success
}: {
  error?: string;
  success?: string;
}): React.JSX.Element | null {
  if (!error && !success) {
    return null;
  }

  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm ${
        error
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
      role="status"
    >
      {error ?? success}
    </p>
  );
}
