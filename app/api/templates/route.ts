// app/api/templates/route.ts
import { NextResponse } from "next/server";
import { getTemplates } from "@/lib/templates";

export async function GET() {
  const templates = getTemplates();
  return NextResponse.json({ templates });
}
