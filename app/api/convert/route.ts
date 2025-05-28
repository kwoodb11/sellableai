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

    const { width: targetW, height: targetH } = template.placeholders[0];

    const results = await Promise.all(
      files.map(async (file) => {
        const originalName = path.parse(file.name).name;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Resize + optimize before S3 upload
        const resizedBuffer = await sharp(buffer, { density: 300 })
          .resize(targetW, targetH, { fit: "cover" })
          .png({ compressionLevel: 9, quality: 100, adaptiveFiltering: true })
          .toBuffer();

        const s3Url = await uploadToS3(resizedBuffer, `${originalName}.png`);

        // Composite mockup from resized S3 design
        const { mockupPng, placeholderPng } = await compositeImageFromUrl(s3Url, template);

        const coverBuffer = await sharp(mockupPng)
          .jpeg({ quality: 90 })
          .toBuffer();

        return {
          folderName: originalName,
          coverFileName: "cover0.jpg",
          designFileName: `${originalName}.png`,
          coverBuffer,
          placeholderBuffer: placeholderPng
        };
      })
    );

    // Structure into folders inside ZIP
    for (const result of results) {
      const folder = zip.folder(result.folderName);
      if (!folder) continue;
      folder.file(result.coverFileName, result.coverBuffer);
      folder.file(result.designFileName, result.placeholderBuffer);
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
    console.error("❌ Mockup generation failed:", error);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
