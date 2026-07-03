import ctx from "../../plugins/resizingCanvas/api.ts";
import { World } from "bozoecs";
import {
  Rect,
  Graphic,
  OnScreen,
  Transform,
  Circle,
  Color,
  Health,
  Text,
  Camera,
  ParticleEmitter,
  PathFinder,
  Attack,
} from "../components.ts";

export function drawCircles(world: World) {
  for (const e of world.query({ and: [OnScreen, Transform, Circle, Color] })) {
    const t = world.getComponent(e, Transform);
    const c = world.getComponent(e, Circle);
    const color = world.getComponent(e, Color);
    ctx.beginPath();
    ctx.fillStyle = color.stroke;
    ctx.arc(t.x + c.x, t.y + c.y, c.radius * t.scaleX, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = color.fill;
    ctx.arc(t.x + c.x, t.y + c.y, (c.radius - 0.5) * t.scaleX, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawImg(world: World) {
  world.query({ and: [Graphic, Transform] }).forEach((e) => {
    const g = world.getComponent(e, Graphic);
    const p = world.getComponent(e, Transform);
    const img = g.image;
    let imgWidth = img.width;
    let imgHeight = img.height;
    let offsetX = 0;
    let offsetY = 0;
    if (world.hasComponent(e, Rect)) {
      const r = world.getComponent(e, Rect);
      imgWidth = r.width;
      imgHeight = r.height;
      offsetX = r.x;
      offsetY = r.y;
    }
    const scaleX = imgWidth / img.width;
    const scaleY = imgHeight / img.height;
    const c = Math.cos(p.rad);
    const s = Math.sin(p.rad);
    ctx.transform(c * scaleX, s * scaleX, -s * scaleY, c * scaleY, p.x, p.y);
    ctx.drawImage(img, offsetX, offsetY);
    ctx.transform(
      c / scaleX,
      -s / scaleX,
      s / scaleY,
      c / scaleY,
      (c * -p.x + s * -p.y) / scaleY,
      (-s * -p.x + c * -p.y) / scaleY,
    );
  });
}

export function drawRects(world: World) {
  const rects = world.query({ and: [Transform, Rect, Color, OnScreen] });
  for (const e of rects) {
    const p = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    const c = world.getComponent(e, Color);
    const cos = Math.cos(p.rad);
    const sin = Math.sin(p.rad);
    ctx.transform(cos, sin, -sin, cos, p.x, p.y);
    ctx.fillStyle = c.stroke;
    ctx.fillRect(
      r.x * p.scaleX,
      r.y * p.scaleY,
      r.width * p.scaleX,
      r.height * p.scaleY,
    );
    ctx.fillStyle = c.fill;
    ctx.fillRect(
      r.x * p.scaleX + 0.5,
      r.y * p.scaleY + 0.5,
      r.width * p.scaleX - 1,
      r.height * p.scaleY - 1,
    );
    ctx.transform(
      cos,
      -sin,
      sin,
      cos,
      cos * -p.x + sin * -p.y,
      -sin * -p.x + cos * -p.y,
    );
  }
}

export function drawHealthBars(world: World) {
  const widthMult = 1.5;
  const barHeight = 0.3;
  const margin = 0.2;
  const relativeBarY = -barHeight / 2 - 1;

  for (const e of world.query({ and: [OnScreen, Health, Transform, Rect] })) {
    const t = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    const h = world.getComponent(e, Health);
    const cos = Math.cos(t.rad);
    const sin = Math.sin(t.rad);
    const x = -(r.width * widthMult) / 2;
    const y = relativeBarY + r.y;
    ctx.fillStyle = "black";
    ctx.fillRect(
      t.x - margin / 2 + cos * x - sin * y,
      t.y - margin / 2 + sin * x + cos * y,
      r.width * widthMult + margin,
      barHeight + margin,
    );
    ctx.fillStyle = "green";
    ctx.fillRect(
      t.x + cos * x - sin * y,
      t.y + sin * x + cos * y,
      r.width * widthMult * (h.current / h.max),
      barHeight,
    );
  }
  for (const e of world.query({ and: [OnScreen, Health, Transform, Circle] })) {
    const t = world.getComponent(e, Transform);
    const c = world.getComponent(e, Circle);
    const h = world.getComponent(e, Health);
    const cos = Math.cos(t.rad);
    const sin = Math.sin(t.rad);
    const x = -(c.radius * widthMult);
    const y = relativeBarY - c.radius;
    ctx.fillStyle = "black";
    ctx.fillRect(
      t.x - margin / 2 + cos * x - sin * y,
      t.y - margin / 2 + sin * x + cos * y,
      c.radius * 2 * widthMult + margin,
      barHeight + margin,
    );
    ctx.fillStyle = "green";
    ctx.fillRect(
      t.x + cos * x - sin * y,
      t.y + sin * x + cos * y,
      c.radius * 2 * widthMult * (h.current / h.max),
      barHeight,
    );
  }
}

export function drawTexts(world: World) {
  world.query({ and: [Text, Transform] }).forEach((e) => {
    const t = world.getComponent(e, Text);
    const p = world.getComponent(e, Transform);
    ctx.font = `${t.fontSize}px serif`;
    const lines = t.content.split("\n");
    ctx.beginPath();
    for (let i = 0, l = lines.length; i < l; i++) {
      if (lines[i].length == 0) continue;
      const txtMetric = ctx.measureText(lines[i]);
      const textHeight =
        txtMetric.actualBoundingBoxAscent + txtMetric.actualBoundingBoxDescent;
      ctx.rect(
        p.x + t.x,
        p.y + t.y + i * (2 * t.padding + textHeight),
        t.padding * 2 + txtMetric.width,
        t.padding * 2 + textHeight,
      );
    }
    ctx.fillStyle = t.backgroundColor;
    ctx.fill();
    ctx.fillStyle = t.color;
    for (let i = 0, l = lines.length; i < l; i++) {
      const txtMetric = ctx.measureText(lines[i]);
      const textHeight =
        txtMetric.actualBoundingBoxAscent + txtMetric.actualBoundingBoxDescent;
      ctx.fillText(
        lines[i],
        p.x + t.x + t.padding,
        p.y +
          t.y +
          ((i + 1) * 2 - 1) * t.padding +
          (i + 1) * textHeight +
          -txtMetric.actualBoundingBoxDescent,
      );
    }
  });
}

export function drawCameraRect(world: World) {
  const canvas = ctx.canvas;
  ctx.strokeStyle = "red";
  ctx.beginPath();
  for (const e of world.query({ and: [Transform, Camera] })) {
    const t = world.getComponent(e, Transform);
    const c = world.getComponent(e, Camera);
    ctx.rect(
      t.x - canvas.width / (c.zoom * 2),
      t.y - canvas.height / (c.zoom * 2),
      canvas.width / c.zoom,
      canvas.height / c.zoom,
    );
  }
  ctx.stroke();
}

export function drawParticleEmitters(world: World) {
  ctx.fillStyle = "green";
  ctx.beginPath();
  for (const e of world.query({ and: [ParticleEmitter, Transform] })) {
    const t = world.getComponent(e, Transform);
    ctx.moveTo(t.x, t.y);
    ctx.arc(t.x, t.y, 0.5, 0, Math.PI * 2);
  }
  ctx.fill();
}

export function drawPathFindTargets(world: World) {
  ctx.fillStyle = "blue";
  ctx.beginPath();
  const radius = 0.3;
  for (const e of world.query({ and: [PathFinder] })) {
    const pf = world.getComponent(e, PathFinder);
    ctx.moveTo(pf.targetX + radius, pf.targetY);
    ctx.arc(pf.targetX, pf.targetY, radius, 0, Math.PI * 2);
  }
  ctx.fill();
}

export function drawAttackTargets(world: World) {
  ctx.strokeStyle = "red";
  ctx.beginPath();
  for (const e of world.query({ and: [Transform, Attack] })) {
    const a = world.getComponent(e, Attack);
    const t = world.getComponent(e, Transform);
    if (!world.hasComponent(a.targetEntity, Transform)) continue;
    const targetT = world.getComponent(a.targetEntity, Transform);
    ctx.moveTo(t.x + a.range, t.y);
    ctx.arc(t.x, t.y, a.range, 0, Math.PI * 2);
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(targetT.x, targetT.y);
  }
  ctx.stroke();
}
