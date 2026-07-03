import { isRect, isCircle, isLine } from "../../quadtree/shapes.ts";
import { QtreeShapes, Quadtree } from "../../quadtree/quadtree.ts";
import { World } from "bozoecs";
import {
  Camera,
  Circle,
  OnScreen,
  QtCircle,
  QtRect,
  Rect,
  Transform,
  Velocity,
} from "../../ecs/components.ts";
import ctx from "../resizingCanvas/api.ts";

export function isQtreeElm(elm: object): elm is QtreeShapes {
  return (
    (isRect(elm) || isCircle(elm) || isLine(elm)) && Object.hasOwn(elm, "owner")
  );
}

export function checkOnScreenEntities(world: World, qtree: Quadtree) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (camEntity == undefined) return;
  const cam = world.getComponent(camEntity, Camera);
  const camTransform = world.getComponent(camEntity, Transform);
  for (const e of world.query({ and: [OnScreen] })) {
    world.removeComponent(e, OnScreen);
  }
  for (const shape of qtree.query({
    x: camTransform.x - ctx.canvas.width / (cam.zoom * 2),
    y: camTransform.y - ctx.canvas.height / (cam.zoom * 2),
    width: ctx.canvas.width / cam.zoom,
    height: ctx.canvas.height / cam.zoom,
  })) {
    const s = shape as typeof QtRect | typeof QtCircle;
    world.addComponent(s.owner, OnScreen);
  }
}

export function handleQuadtreeElms(world: World) {
  for (const e of world.query({ and: [QtRect, Rect, Transform] })) {
    const r = world.getComponent(e, Rect);
    const qr = world.getComponent(e, QtRect);
    const t = world.getComponent(e, Transform);
    qr.x = t.x + r.x;
    qr.y = t.y + r.y;
    qr.width = r.width * t.scaleX;
    qr.height = r.height * t.scaleY;
    qr.owner = e;
  }
  for (const e of world.query({ and: [QtCircle, Circle, Transform] })) {
    const c = world.getComponent(e, Circle);
    const qc = world.getComponent(e, QtCircle);
    const t = world.getComponent(e, Transform);
    qc.x = t.x + c.x;
    qc.y = t.y + c.y;
    qc.radius = c.radius * t.scaleX;
    qc.owner = e;
  }
}

export function handleCollision(world: World, qtree: Quadtree) {
  for (const e of world.query({ and: [QtRect, Transform, Velocity] })) {
    const qr = world.getComponent(e, QtRect);
    const t = world.getComponent(e, Transform);
    for (const other of qtree.query(qr)) {
      const o = other as typeof QtCircle | typeof QtRect;
      if (o.owner == e) continue;

      // rect - circle collision is handled in circles' loop

      if (isRect(o)) {
        const dx = qr.x + qr.width / 2 - (o.x + o.width / 2);
        const dy = qr.y + qr.height / 2 - (o.y + o.height / 2);
        if (
          (qr.width + o.width) / 2 - Math.abs(dx) <
          (qr.height + o.height) / 2 - Math.abs(dy)
        ) {
          t.x += (dx / Math.abs(dx)) * (qr.width + o.width - Math.abs(dx));
        } else {
          t.y +=
            (dy / Math.abs(dy)) * ((qr.height + o.height) / 2 - Math.abs(dy));
        }
      }
    }
  }
  for (const e of world.query({ and: [QtCircle, Transform, Velocity] })) {
    const qc = world.getComponent(e, QtCircle);
    const t = world.getComponent(e, Transform);
    for (const other of qtree.query(qc)) {
      const o = other as typeof QtCircle | typeof QtRect;
      if (o.owner == e) continue;
      if (isCircle(o)) {
        const dx = qc.x - o.x;
        const dy = qc.y - o.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag == 0) continue;
        t.x += (dx / mag) * (qc.radius + o.radius - mag);
        t.y += (dy / mag) * (qc.radius + o.radius - mag);
      } else if (isRect(o)) {
        const dx = qc.x - (o.x + o.width / 2);
        const dy = qc.y - (o.y + o.height / 2);
        if (
          qc.radius + o.width / 2 - Math.abs(dx) <
          qc.radius + o.height / 2 - Math.abs(dy)
        ) {
          t.x += (dx / Math.abs(dx)) * (qc.radius + o.width / 2 - Math.abs(dx));
        } else {
          t.y +=
            (dy / Math.abs(dy)) * (qc.radius + o.height / 2 - Math.abs(dy));
        }
      }
    }
  }
}

export function drawBg(color: string = "#424242") {
  const old = ctx.fillStyle;
  ctx.resetTransform();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = old;
}
