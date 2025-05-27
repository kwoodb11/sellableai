/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import JSZip from "jszip";
import Sharp from "sharp";
import { compositeImage } from "../../../src/lib/image-processor";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const tpl = JSON.parse(form.get("template") as string);
    const files = form.getAll("files") as File[];

    if (!tpl || files.length === 0) {
      return new NextResponse(
        "You must select a template and upload at least one file.",
        { status: 400 }
      );
    }

    const zip = new JSZip();

    // ✅ PARALLEL IMAGE PROCESSING
    await Promise.all(
      files.map(async (file) => {
        const rawArray = await file.arrayBuffer();
        const imgBuf = Buffer.from(rawArray);

        // Upscale to 300 DPI
        const dpiBuf = await Sharp(imgBuf)
          .withMetadata({ density: 300 })
          .toBuffer();

        // Composite mockup
        const { placeholderPng, mockupPng } = await compositeImage(dpiBuf, tpl);

        // Create folder using base name
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const folder = zip.folder(baseName)!;

        folder.file("placeholder.png", placeholderPng);
        folder.file(
          "cover.jpg",
          await Sharp(mockupPng).jpeg({ quality: 90 }).toBuffer()
        );
      })
    );

    // Generate zip and return
    const content = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="mockups-${Date.now()}.zip"`,
      },
    });
  } catch (err: any) {
    console.error("Conversion error:", err);
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}
