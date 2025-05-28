// app/api/s3/upload-url/route.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function POST(req: Request) {
  const { filename, filetype, folder } = await req.json();
  const Bucket = process.env.S3_BUCKET_NAME!;
  const Key = `${folder}/${filename}`;

  const command = new PutObjectCommand({
    Bucket,
    Key,
    ContentType: filetype
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 });

  return NextResponse.json({
    uploadUrl: url,
    fileUrl: `https://${Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`
  });
}
