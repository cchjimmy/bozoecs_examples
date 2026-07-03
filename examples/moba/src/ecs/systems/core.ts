import ctx from "../../plugins/resizingCanvas/api.ts";
import time from "../../plugins/time/api.ts";
import { World } from "bozoecs";
import {
  Timer,
  Velocity,
  Camera,
  Transform,
  Callback,
  Acceleration,
} from "../components.ts";

export function handleCallbacks(world: World) {
  for (const e of world.query({ and: [Callback] })) {
    world.getComponent(e, Callback).fn(e);
  }
}

export function handleTimers(world: World) {
  world.query({ and: [Timer] }).forEach((e) => {
    const t = world.getComponent(e, Timer);
    if (t.reset) t.timeSeconds = 0;
    t.reset = false;
    if (!t.pause) t.timeSeconds += time.dtSeconds;
  });
}

export function handleCamera(world: World) {
  for (const e of world.query({ and: [Camera, Transform] })) {
    const c = world.getComponent(e, Camera);
    if (!c.isActive) continue;
    const p = world.getComponent(e, Transform);
    if (c.targetEntity != -1 && world.hasComponent(c.targetEntity, Transform)) {
      const targetPos = world.getComponent(c.targetEntity, Transform);
      Object.assign(p, targetPos);
    }
    const sin = Math.sin(c.tilt) * c.zoom;
    const cos = Math.cos(c.tilt) * c.zoom;
    ctx.setTransform(
      cos,
      sin,
      -sin,
      cos,
      cos * -p.x - sin * -p.y + ctx.canvas.width * 0.5,
      sin * -p.x + cos * -p.y + ctx.canvas.height * 0.5,
    );
    break;
  }
}

export function handleMovement(world: World) {
  world.query({ and: [Transform, Velocity] }).forEach((e) => {
    const p = world.getComponent(e, Transform);
    const v = world.getComponent(e, Velocity);
    p.x += v.x * time.dtSeconds;
    p.y += v.y * time.dtSeconds;
  });
  world.query({ and: [Acceleration, Velocity] }).forEach((e) => {
    const v = world.getComponent(e, Velocity);
    const a = world.getComponent(e, Acceleration);
    v.x += a.x * time.dtSeconds;
    v.y += a.y * time.dtSeconds;
  });
}
