export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
          Clearday Air Assistant
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Deterministic air quality analysis and personalized routine optimization for urban smog.
        </p>

        {/* Element demonstrating spacing (p-6) and sizing (w-64, h-16) utilities for Phase 1 proof */}
        <div
          data-testid="tailwind-proof"
          id="tailwind-proof"
          className="mt-6 flex h-16 w-64 items-center justify-center rounded border border-emerald-500/30 bg-emerald-950/40 p-4 text-emerald-400"
        >
          <span className="text-xs font-medium">CSS Pipeline Verified</span>
        </div>
      </div>
    </div>
  );
}
