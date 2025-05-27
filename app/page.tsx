// src/app/page.tsx
"use client";

import MockupGenerator from "../components/MockupGenerator"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg text-text p-8">
      <MockupGenerator />
    </main>
  );
}
