/* eslint-disable @typescript-eslint/no-explicit-any */
import Sharp from "sharp";
import path  from "path";


export async function compositeImage(input: Buffer, tpl: any) {
  // pick the first placeholder (you could loop, but we're only doing one here)
  const ph = tpl.placeholders[0];

  //
  // 1) Resize & center‐crop the user art to exactly ph.width × ph.height
  //
  const artResized = await Sharp(input)
    .resize(ph.width, undefined, {
      fit:   ph.fit ?? "cover",
      position: "centre"
    })
    .toBuffer();

  // find its real height, figure out how much we need to trim off top & bottom
  const { height: realH } = await Sharp(artResized).metadata();
  const topCrop = Math.max(0, Math.round((realH! - ph.height) / 2));

  const artCropped = await Sharp(artResized)
    .extract({ left: 0, top: topCrop, width: ph.width, height: ph.height })
    .toBuffer();

  //
  // 2) Build up a transparent “canvas” at your full tpl.canvas size
  //
  let img = Sharp({
    create: {
      width:  tpl.canvas.width,
      height: tpl.canvas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  //
  // 3) Compose in order: art → placeholder frame → cover frame
  //
  const comps: Sharp.OverlayOptions[] = [
    { 
      input:  artCropped, 
      left:   ph.x, 
      top:    ph.y 
    },
    { 
      input:  path.join(process.cwd(), "public", ph.frame), 
      left:   ph.x, 
      top:    ph.y 
    }
  ];

  if (tpl.coverFrame) {
    comps.push({
      input: path.join(process.cwd(), "public", tpl.coverFrame),
      left:  0,
      top:   0,
      blend: "over"
    });
  }

  img = img.composite(comps);

  //
  // 4) Output both buffers: one with just art+placeholder, one with art+placeholder+cover
  //
  //    (we do the full stack first, then strip off the coverFrame overlay)
  //
  const mockupPng     = await img.png().toBuffer();

  // remove the last overlay (the cover) to get just art+placeholder
  const placeholderPng = await Sharp({
    create: {
      width:  tpl.canvas.width,
      height: tpl.canvas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(comps.slice(0, 2))
    .png()
    .toBuffer();

  return { placeholderPng, mockupPng };
}
