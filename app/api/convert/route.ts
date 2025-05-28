import { NextRequest, NextResponse } from "next/server";
import { compositeImageFromUrl } from "@/lib/image-processor";
import { getTemplates } from "@/lib/templates";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  const { imageUrl, templateId } = await req.json();

  if (!imageUrl || !templateId) {
    return NextResponse.json({ error: "Missing imageUrl or templateId" }, { status: 400 });
  }

  const templates = getTemplates();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tpl = templates.find((t: { id: any; }) => t.id === templateId);
  if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  try {
    const { mockupPng, placeholderPng } = await compositeImageFromUrl(imageUrl, tpl);

    const zip = new JSZip();
    zip.file("mockup.png", mockupPng);
    zip.file("placeholder.png", placeholderPng);

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="mockups.zip"'
      }
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
