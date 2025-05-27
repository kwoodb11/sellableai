import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>SellableAI</title>
      </head>
      <body className="bg-gray-50 text-gray-900">
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SellableAI Logo" className="h-20 w-auto" />
            <span className="text-xl font-bold text-brand-text">SellableAI</span>
          </div>
          <nav className="space-x-4">
            <a href="/login" className="text-sm text-gray-700 hover:underline">Login</a>
            <a href="/register" className="text-sm text-gray-700 hover:underline">Register</a>
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
