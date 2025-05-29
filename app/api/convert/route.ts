import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import sharp from "sharp";
import JSZip from "jszip";
import { compositeImageFromUrl } from "@/lib/image-processor";
import { uploadToS3 } from "@/lib/s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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

        const resizedBuffer = await sharp(buffer, { density: 300 }) // High-DPI output
          .resize(targetW, targetH, { fit: "cover" })
          .png({ compressionLevel: 9, quality: 100, adaptiveFiltering: true })
          .toBuffer();

        const s3Url = await uploadToS3(resizedBuffer, `${originalName}.png`);
        const { mockupPng, placeholderPng } = await compositeImageFromUrl(s3Url, template);

        return {
          folder: originalName,
          coverName: "cover0.jpg",
          placeholderName: `${originalName}.png`,
          coverBuffer: await sharp(mockupPng).jpeg({ quality: 90 }).toBuffer(),
          placeholderBuffer: placeholderPng,
        };
      })
    );

    for (const result of results) {
      const folder = zip.folder(result.folder);
      if (!folder) continue;
      folder.file(result.coverName, result.coverBuffer);
      folder.file(result.placeholderName, result.placeholderBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipKey = `mockups/mockups-${Date.now()}.zip`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: zipKey,
        Body: zipBuffer,
        ContentType: "application/zip",
      })
    );

    const signedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: zipKey,
      }),
      { expiresIn: 3600 } // 1 hour
    );

    return NextResponse.json({ url: signedUrl }, { status: 200 });
  } catch (error) {
    console.error("Mockup generation failed:", error);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
