import { isRect, isCircle, isLine } from "quadtree/shapes";
import { QtreeShapes, Quadtree } from "quadtree";
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
import time from "../time/api.ts";

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
    const c = Math.cos(t.rad);
    const s = Math.sin(t.rad);
    qr.x = t.x + r.x * c * t.scaleX + r.y * -s * t.scaleY;
    qr.y = t.y + r.x * s * t.scaleY + r.y * c * t.scaleY;
    qr.width = r.width * t.scaleX;
    qr.height = r.height * t.scaleY;
    qr.rad = t.rad;
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
      if (isCircle(o)) {
        const c = qr.rad ? Math.cos(qr.rad) : 1;
        const s = qr.rad ? Math.sin(qr.rad) : 0;
        const dx = (o.x - qr.x) * c + (o.y - qr.y) * s - qr.width / 2;
        const dy = (o.x - qr.x) * -s + (o.y - qr.y) * c - qr.height / 2;
        let tdx = 0;
        let tdy = 0;
        if (
          o.radius + qr.width / 2 - Math.abs(dx) <
          o.radius + qr.height / 2 - Math.abs(dy)
        ) {
          tdx = (dx / Math.abs(dx)) * (o.radius + qr.width / 2 - Math.abs(dx));
        } else {
          tdy = (dy / Math.abs(dy)) * (o.radius + qr.height / 2 - Math.abs(dy));
        }
        t.x -= tdx * c + tdy * -s;
        t.y -= tdx * s + tdy * c;
      } else if (isRect(o)) {
        // const dx = qr.x + qr.width / 2 - (o.x + o.width / 2);
        // const dy = qr.y + qr.height / 2 - (o.y + o.height / 2);
        // if (
        //   (qr.width + o.width) / 2 - Math.abs(dx) <
        //   (qr.height + o.height) / 2 - Math.abs(dy)
        // ) {
        //   t.x += (dx / Math.abs(dx)) * (qr.width + o.width - Math.abs(dx));
        // } else {
        //   t.y +=
        //     (dy / Math.abs(dy)) * ((qr.height + o.height) / 2 - Math.abs(dy));
        // }
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
        const c = o.rad ? Math.cos(o.rad) : 1;
        const s = o.rad ? Math.sin(o.rad) : 0;
        const dx = (qc.x - o.x) * c + (qc.y - o.y) * s - o.width / 2;
        const dy = (qc.x - o.x) * -s + (qc.y - o.y) * c - o.height / 2;
        let tdx = 0;
        let tdy = 0;
        if (
          qc.radius + o.width / 2 - Math.abs(dx) <
          qc.radius + o.height / 2 - Math.abs(dy)
        ) {
          tdx = (dx / Math.abs(dx)) * (qc.radius + o.width / 2 - Math.abs(dx));
        } else {
          tdy = (dy / Math.abs(dy)) * (qc.radius + o.height / 2 - Math.abs(dy));
        }
        t.x += tdx * c + tdy * -s;
        t.y += tdx * s + tdy * c;
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
