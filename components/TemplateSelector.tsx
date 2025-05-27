"use client";

import { useEffect, useState } from "react";
import type { Template } from "../src/lib/types";

interface Props {
  onSelect: (template: Template | null) => void;
}

export default function TemplateSelector({ onSelect }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    fetch("/templates.json")
      .then((res) => res.json())
      .then((data) => {
        const loadedTemplates = Array.isArray(data) ? data : data.templates ?? [];
        setTemplates(loadedTemplates);
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
        setTemplates([]);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = templates.find((tpl) => tpl.id === e.target.value) || null;
    setSelectedId(e.target.value);
    onSelect(selected);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="template-selector" className="block text-sm font-medium text-brand-text">
        Product Template *
      </label>
      <select
        id="template-selector"
        className="w-full p-2 border border-gray-300 rounded"
        value={selectedId}
        onChange={handleChange}
      >
        <option value="">-- Select a product template --</option>
        {templates.map((tpl) => (
          <option key={tpl.id} value={tpl.id}>
            {tpl.name}
          </option>
        ))}
      </select>
    </div>
  );
}
