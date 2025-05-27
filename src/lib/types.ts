// lib/types.ts
// src/lib/types.ts

/**  
 * A single “cut-out” region in your template.  
 * frame: path to the mask/placeholder PNG under /public  
 * x/y: where that cut-out sits on the full canvas  
 * width/height: size of that region  
 * fit: how to resize user art into the region  
 * position: optional Sharp gravity (e.g. "center", "north", etc.)  
 */
export interface Placeholder {
  frame: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fit?: "cover" | "contain";
  position?: "center" | "north" | "south" | "east" | "west";
}

/**  
 * Full canvas dims for this mockup/template.  
 */
export interface CanvasSize {
  width: number;
  height: number;
}

/**  
 * Describes one templated product:  
 *  - an ID & human-friendly name  
 *  - the overall canvas dimensions  
 *  - one or more placeholder frames to fill with user art  
 *  - a final “cover” PNG to overlay on top (e.g. the tumbler’s clear plastic)  
 */
export interface Template {
  id: string;
  name: string;
  canvas: CanvasSize;
  placeholders: Placeholder[];
  coverFrame: string;
}



