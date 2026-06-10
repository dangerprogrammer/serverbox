'use client';

export function PrintQrCodeButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="payment-screen-only inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
    >
      Imprimir QR Code
    </button>
  );
}
