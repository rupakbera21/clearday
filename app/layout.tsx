import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clearday - Air Quality & Winter Smog Assistant",
  description:
    "Grounded guidance, daily routines, and indoor air hacks for families navigating winter smog.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-amber-500 focus:text-slate-900 focus:z-50"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-3">
            <div className="mx-auto flex max-w-5xl items-center justify-between">
              <span className="text-xl font-bold tracking-tight text-amber-400">Clearday</span>
              <span className="text-xs text-slate-400">Urban Smog & Health Assistant</span>
            </div>
          </header>
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <footer className="border-t border-slate-800 bg-slate-950 px-4 py-6 text-center text-xs text-slate-500">
            <p>Data provided by Open-Meteo under open licenses. Model estimates for informational guidance only.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
