import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clearday - Air Quality & Winter Smog Assistant",
  description:
    "Grounded guidance, daily routines, and indoor air hacks for families navigating winter smog.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-teal-500/20 selection:text-teal-900 dark:selection:text-teal-100">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-emerald-700 focus:text-white focus:rounded-lg focus:shadow-lg focus:z-50 focus:outline-2"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
