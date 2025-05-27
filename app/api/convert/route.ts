/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import JSZip from "jszip";
import Sharp from "sharp";
import { compositeImage } from "@/lib/image-processor";

export const runtime = "nodejs"; // ✅ Ensure it runs on Vercel Node.js serverless runtime

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const templateData = form.get("template") as string;
    const files = form.getAll("files") as File[];

    if (!templateData || files.length === 0) {
      return new NextResponse("Missing template or files.", { status: 400 });
    }

    const tpl = JSON.parse(templateData);
    const zip = new JSZip();

    await Promise.all(
      files.map(async (file) => {
        const rawArray = await file.arrayBuffer();
        const imgBuf = Buffer.from(rawArray);

        // Convert to 300 DPI
        const dpiBuf = await Sharp(imgBuf)
          .withMetadata({ density: 300 })
          .toBuffer();

        const { placeholderPng, mockupPng } = await compositeImage(dpiBuf, tpl);

        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const folder = zip.folder(baseName)!;

        folder.file("placeholder.png", placeholderPng);
        folder.file(
          "cover.jpg",
          await Sharp(mockupPng).jpeg({ quality: 90 }).toBuffer()
        );
      })
    );

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="mockups-${Date.now()}.zip"`,
      },
    });
  } catch (err: any) {
    console.error("Convert error:", err);
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}
