export async function getTemplates() {
  const res = await fetch("/templates.json");
  if (!res.ok) {
    throw new Error("Failed to fetch templates");
  }
  const data = await res.json();
  return data.templates;
}
