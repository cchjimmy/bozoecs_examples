import { entityT, World } from "bozoecs";
import { Transform } from "../../ecs/components.ts";
import ctx from "../resizingCanvas/api.ts";

const data: { gameWorld: World | undefined } = {
  gameWorld: undefined,
};

export function setGameWorld(world: World): void {
  data.gameWorld = world;
}

export function getGameWorld(): World | undefined {
  return data.gameWorld;
}

// credit: https://www.30secondsofcode.org/js/s/detect-device-type/
export function detectDeviceType(): string {
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? "Mobile"
    : "Desktop";
}

export const Graph: {
  y: number[];
  x: number[];
  yMax: number;
  yMin: number;
  xMin: number;
  xMax: number;
} = {
  y: [],
  x: [],
  yMin: 0,
  yMax: 100,
  xMin: 0,
  xMax: 100,
};

function clamp(value: number, min: number, max: number): number {
  return value > max ? max : value < min ? min : value;
}

export function drawGraph(world: World) {
  for (const e of world.query({ and: [Graph, Transform] })) {
    const t = world.getComponent(e, Transform);
    const g = world.getComponent(e, Graph);
    const c = Math.cos(t.rad);
    const s = Math.sin(t.rad);
    ctx.transform(
      c * t.scaleX,
      s * t.scaleX,
      -s * t.scaleY,
      c * t.scaleY,
      t.x,
      t.y,
    );
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1, 1);
    const dy = g.yMax - g.yMin;
    const dx = g.xMax - g.xMin;
    const zeroRatio = clamp((0 - g.yMin) / dy, 0, 1);
    const barWidth = 1 / g.x.length;
    for (let i = 0, l = g.y.length; i < l; i++) {
      const yRatio = clamp((g.y[i] - g.yMin) / dy, 0, 1);
      const xRatio = (g.x[i] - g.xMin) / dx;
      if (xRatio > 1 || xRatio < 0) continue; // because not visible, y is clamped x is not
      // draw graph within a square area
      ctx.fillStyle = `rgb(${255 * (1 - yRatio)},${255 * yRatio},0)`;
      ctx.fillRect(xRatio, 1 - yRatio, barWidth, yRatio - zeroRatio);
    }
    ctx.transform(
      c / t.scaleX,
      -s / t.scaleX,
      s / t.scaleY,
      c / t.scaleY,
      (c / t.scaleX) * -t.x - (s / t.scaleY) * -t.y,
      (s / t.scaleX) * -t.x + (c / t.scaleY) * -t.y,
    );
  }
}

export function addGraph(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
): entityT {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y, scaleX: w, scaleY: h });
  world.addComponent(e, Graph);
  return e;
}
