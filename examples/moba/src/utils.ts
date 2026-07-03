import { default as config } from "../src/config.json" with { type: "json" };

type vec2 = { x: number; y: number };
export function screenToWorld(
  pointerPos: vec2,
  cameraPos: vec2,
  cameraTilt: number,
  cameraZoom: number,
): vec2 {
  const cos = Math.cos(cameraTilt);
  const sin = Math.sin(cameraTilt);
  const res = { x: 0, y: 0 };
  const x = pointerPos.x - config.viewport.width / 2;
  const y = pointerPos.y - config.viewport.height / 2;
  res.x = cos * x + sin * y;
  res.y = -sin * x + cos * y;
  res.x /= cameraZoom;
  res.y /= cameraZoom;
  res.x += cameraPos.x;
  res.y += cameraPos.y;
  return res;
}
export function worldToScreen(
  pos: vec2,
  cameraPos: vec2,
  cameraTilt: number,
  cameraZoom: number,
): vec2 {
  const c = Math.cos(cameraTilt);
  const s = Math.sin(cameraTilt);
  const res = { x: 0, y: 0 };
  let x = pos.x - cameraPos.x;
  let y = pos.y - cameraPos.y;
  x *= cameraZoom;
  y *= cameraZoom;
  res.x = c * x - s * y;
  res.y = s * x + c * y;
  res.x += config.viewport.width * 0.5;
  res.y += config.viewport.height * 0.5;
  return res;
}
export function pointerToScreen(
  pointer: vec2,
  canvas: HTMLCanvasElement,
): vec2 {
  const out = pointer;
  const rect = canvas.getBoundingClientRect();
  out.x = pointer.x - rect.left;
  out.y = pointer.y - rect.top;
  if (innerWidth / innerHeight < canvas.width / canvas.height) {
    out.x *= canvas.width / innerWidth;
    out.y *= canvas.width / innerWidth;
  } else {
    out.x *= canvas.height / innerHeight;
    out.y *= canvas.height / innerHeight;
  }
  return out;
}

/**
 * returns squared distance
 */
export function distanceSq(a: vec2, b: vec2): number {
  return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}
