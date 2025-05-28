import { NextRequest, NextResponse } from "next/server";
import { compositeImageFromUrl } from "@/lib/image-processor";
import { uploadToS3 } from "@/lib/s3";
import JSZip from "jszip";
import path from "path";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const templateJson = formData.get("template") as string;
    const files = formData.getAll("files") as File[];

    if (!templateJson || files.length === 0) {
      return NextResponse.json({ error: "Missing template or files" }, { status: 400 });
    }

    const template = JSON.parse(templateJson);
    const zip = new JSZip();

    // Pre-fetch placeholder dimensions for smart resizing
    const { width: targetW, height: targetH } = template.placeholders[0];

    const results = await Promise.all(
      files.map(async (file) => {
        const originalName = path.parse(file.name).name;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Resize to fit placeholder size before uploading (downscale only)
        const resizedBuffer = await sharp(buffer, { density: 300 }) // ensure DPI
          .resize(targetW, targetH, {
            fit: "cover",
          })
          .png({ compressionLevel: 9, quality: 100, adaptiveFiltering: true }) // High quality print-ready PNG
          .toBuffer();

        // Upload resized image to S3
        const s3Url = await uploadToS3(resizedBuffer, `${originalName}.png`);

        // Composite mockup
        const { mockupPng, placeholderPng } = await compositeImageFromUrl(s3Url, template);

        return {
          folder: originalName,
          coverName: "cover0.jpg",
          placeholderName: `${originalName}.png`,
          coverBuffer: await sharp(mockupPng).jpeg({ quality: 90 }).toBuffer(), // optimize cover
          placeholderBuffer: placeholderPng
        };
      })
    );

    // Organize results into folders in ZIP
    for (const result of results) {
      const folder = zip.folder(result.folder);
      if (!folder) continue;
      folder.file(result.coverName, result.coverBuffer);
      folder.file(result.placeholderName, result.placeholderBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="mockups.zip"`
      }
    });

  } catch (error) {
    console.error("Mockup generation failed:", error);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
