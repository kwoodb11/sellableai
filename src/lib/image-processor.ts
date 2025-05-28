/* eslint-disable @typescript-eslint/no-explicit-any */
import Sharp from "sharp";

export async function compositeImage(input: Buffer, tpl: any) {
  const ph = tpl.placeholders[0];

  const artResized = await Sharp(input)
    .resize(ph.width, undefined, {
      fit: ph.fit ?? "cover",
      position: "centre",
    })
    .toBuffer();

  const { height: realH } = await Sharp(artResized).metadata();
  const topCrop = Math.max(0, Math.round((realH! - ph.height) / 2));

  const artCropped = await Sharp(artResized)
    .extract({ left: 0, top: topCrop, width: ph.width, height: ph.height })
    .toBuffer();

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://sellableai-git-main-sellable-ai.vercel.app"
      : "http://localhost:3000";

  async function loadPublicImage(filePath: string): Promise<Buffer> {
    const url = `${baseUrl}/${filePath}`;
    console.log("🔍 Fetching:", url); // LOG WHICH FILE

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`❌ Failed to fetch ${filePath}:`, res.status, res.statusText);
      throw new Error(`Failed to fetch ${filePath}: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`✅ Fetched ${filePath}, size: ${buffer.length} bytes`);
    return buffer;
  }

  const comps: Sharp.OverlayOptions[] = [
    {
      input: artCropped,
      left: ph.x,
      top: ph.y,
    },
    {
      input: await loadPublicImage(ph.frame),
      left: ph.x,
      top: ph.y,
    },
  ];

  if (tpl.coverFrame) {
    try {
      comps.push({
        input: await loadPublicImage(tpl.coverFrame),
        left: 0,
        top: 0,
        blend: "over",
      });
    } catch (err) {
      console.error("⚠️ Could not load cover frame:", tpl.coverFrame, err);
    }
  }

  const img = Sharp({
    create: {
      width: tpl.canvas.width,
      height: tpl.canvas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(comps);

  const mockupPng = await img.png().toBuffer();

  const placeholderPng = await Sharp({
    create: {
      width: tpl.canvas.width,
      height: tpl.canvas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(comps.slice(0, 2))
    .png()
    .toBuffer();

  return { placeholderPng, mockupPng };
}
