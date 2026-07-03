import { World, entityT } from "bozoecs";
import {
  Camera,
  Button,
  Velocity,
  Stats,
  IsPlayer,
  Text,
  Graphic,
  Rect,
  ParticleEmitter,
  Callback,
  Transform,
  Color,
  Circle,
  Health,
  QtCircle,
  QtRect,
} from "./components.ts";
import { default as config } from "../../src/config.json" with { type: "json" };

export function addCircle(
  world: World,
  x: number = 0,
  y: number = 0,
  radius: number = 1,
) {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Color);
  world.addComponent(e, Circle, { radius });
  world.addComponent(e, QtCircle);
  return e;
}
export function addMinion(world: World, x: number, y: number): entityT {
  const e = addCircle(world);
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Health, {
    current: config.entities.minion.healthPoint,
    max: config.entities.minion.healthPoint,
  });
  world.addComponent(e, Stats, config.entities.minion);
  world.addComponent(e, Velocity);
  return e;
}
export function addSpawner(
  world: World,
  x: number,
  y: number,
  spawnEntity: entityT,
  spawnRate: number = 1,
): entityT {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, ParticleEmitter, {
    particleLifetimeSeconds: 10,
    particleEntity: spawnEntity,
    emitRate: spawnRate,
    enabled: true,
  });
  return e;
}
export function addFountain(world: World, x: number, y: number) {
  const e = addCircle(world, x, y, 5);
  world.addComponent(e, Health, {
    current: config.entities.fountain.healthPoint,
    max: config.entities.fountain.healthPoint,
  });
  world.addComponent(e, Stats, config.entities.fountain);
  return e;
}
export function addGraphic(
  world: World,
  src: string,
  x = 0,
  y = 0,
  w = 1,
  h = 1,
) {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  const img = new Image();
  img.src = src;
  world.addComponent(e, Graphic, { image: img });
  world.addComponent(e, Rect, { width: w, height: h });
  return e;
}
export function addRect(
  world: World,
  x = 0,
  y = 0,
  w = 1,
  h = 1,
  offsetX = -w / 2,
  offsetY = -h / 2,
) {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Rect, { width: w, height: h, x: offsetX, y: offsetY });
  world.addComponent(e, Color);
  world.addComponent(e, QtRect);
  return e;
}
export function addText(world: World, x: number, y: number, str: string = "") {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Text, { content: str, fontSize: 20 });
  return e;
}
export function addButton(
  world: World,
  x = 0,
  y = 0,
  w = 10,
  h = 10,
  cb = (e: entityT) => {
    const b = world.getComponent(e, Button);
    const c = world.getComponent(e, Color);
    c.fill = "grey";
    if (b.hovered) {
      c.fill = "lightgrey";
    }
    if (b.pressed) {
      c.fill = "red";
    }
    if (b.clicked) {
      c.fill = "green";
    }
  },
) {
  const e = addRect(world, x, y, w, h);
  world.addComponent(e, Button);
  world.addComponent(e, Color);
  world.addComponent(e, Callback, { fn: cb });
  world.addComponent(e, Text, {
    content: "Button",
    backgroundColor: "transparent",
    color: "white",
  });
  return e;
}
export function addPlayer(world: World, x = 0, y = 0) {
  const player = addCircle(world, x, y, 1);
  world.addComponent(player, Velocity);
  world.addComponent(player, Stats, config.entities.player);
  world.addComponent(player, Health, {
    max: config.entities.player.healthPoint,
    current: config.entities.player.healthPoint,
  });
  world.addComponent(player, IsPlayer);
  return player;
}
export function addTurrent(world: World, x: number, y: number) {
  const width = 3;
  const height = 8;
  const turrent = addRect(
    world,
    x,
    y,
    width,
    height,
    -width / 2,
    -height + width / 2,
  );
  world.addComponent(turrent, Stats, config.entities.turrent);
  world.addComponent(turrent, Health, {
    max: config.entities.turrent.healthPoint,
    current: config.entities.turrent.healthPoint,
  });
  return turrent;
}
export function addCamera(world: World, x: number, y: number) {
  const cam = world.addEntity();
  world.addComponent(cam, Camera);
  world.addComponent(cam, Transform, { x, y });
  return cam;
}
