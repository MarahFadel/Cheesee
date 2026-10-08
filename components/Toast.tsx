export type ToastData = { id: number; message: string; tone: "success" | "error" };

export default function Toast({ toast }: { toast: ToastData | null }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      {toast && (
        <div
          key={toast.id}
          className={`animate-toast rounded-full px-5 py-2.5 text-base font-semibold text-white shadow-xl ${
            toast.tone === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
