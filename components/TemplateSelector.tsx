"use client";

import { useState, useEffect } from "react";
import type { Template } from "../src/lib/types";

interface Props {
  onSelect: (template: Template | null) => void;
}

export default function TemplateSelector({ onSelect }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/templates.json")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : data.templates ?? []);
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
        setTemplates([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSelect = (tpl: Template) => {
    setSelected(tpl);
    onSelect(tpl);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-brand-text">
          Product Template
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-brand-text">
        Product Template *
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {templates.map((tpl) => (
  <button
  key={tpl.id}
  onClick={() => handleSelect(tpl)}
  className={`rounded-lg border-2 overflow-hidden transition-all ${
    selected?.id === tpl.id
      ? "border-primary shadow-md"
      : "border-gray-200 hover:border-gray-400"
  }`}
>
  <div className="w-full aspect-square bg-white relative">
    <img
      src={`/${tpl.coverFrame}`}
      alt={tpl.name}
      className="absolute inset-0 w-full h-full object-cover"
    />
  </div>
  <div className="text-sm font-medium text-brand-text text-center truncate p-2">
    {tpl.name}
  </div>
</button>

        ))}
      </div>
    </div>
  );
}
