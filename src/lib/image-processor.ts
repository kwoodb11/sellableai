/* eslint-disable @typescript-eslint/no-explicit-any */
import Sharp from "sharp";

async function loadImageFromS3(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load image from ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function compositeImageFromUrl(inputUrl: string, tpl: any) {
  const ph = tpl.placeholders[0];

  const input = await loadImageFromS3(inputUrl);

  const artResized = await Sharp(input)
    .resize(ph.width, undefined, {
      fit: ph.fit ?? "cover",
      position: "centre"
    })
    .toBuffer();

  const { height: realH } = await Sharp(artResized).metadata();
  const topCrop = Math.max(0, Math.round((realH! - ph.height) / 2));

  const artCropped = await Sharp(artResized)
    .extract({ left: 0, top: topCrop, width: ph.width, height: ph.height })
    .toBuffer();

  const comps: Sharp.OverlayOptions[] = [
    {
      input: artCropped,
      left: ph.x,
      top: ph.y,
    },
    {
      input: await loadImageFromS3(ph.frame),
      left: ph.x,
      top: ph.y,
    }
  ];

  if (tpl.coverFrame) {
    comps.push({
      input: await loadImageFromS3(tpl.coverFrame),
      left: 0,
      top: 0,
      blend: "over",
    });
  }

const canvas = {
  width: tpl.canvas.width,
  height: tpl.canvas.height,
  channels: 4 as const, // 👈 force 4 channels
  background: { r: 0, g: 0, b: 0, alpha: 0 },
};

const mockupPng = await Sharp({
  create: canvas
}).composite(comps).png().toBuffer();

const placeholderPng = await Sharp({
  create: canvas
}).composite(comps.slice(0, 2)).png().toBuffer();

  return { mockupPng, placeholderPng };
}
