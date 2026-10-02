import ctx from "../../plugins/resizingCanvas/api.ts";
import pointers from "../../plugins/pointers/api.ts";
import { World } from "bozoecs";
import {
  Attack,
  Callback,
  Camera,
  Health,
  IsPlayer,
  ParticleEmitter,
  PathFinder,
  QtShapes,
  Stats,
  Timer,
  Transform,
  Velocity,
} from "../components.ts";
import { pointerToScreen, screenToWorld } from "../../utils.ts";
import time from "../../plugins/time/api.ts";
import { Quadtree } from "quadtree";

export function handleMovementInput(world: World, qtree: Quadtree) {
  const justPressedId = pointers.justPressed.findIndex((x) => x);
  if (justPressedId == -1) return;

  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (camEntity == undefined) return;

  const camera = world.getComponent(camEntity, Camera);
  const camTransform = world.getComponent(camEntity, Transform);

  const pressPos = pointerToScreen(
    {
      x: pointers.pressX[justPressedId],
      y: pointers.pressY[justPressedId],
    },
    ctx.canvas,
  );
  const worldPos = screenToWorld(
    pressPos,
    camTransform,
    camera.tilt,
    camera.zoom,
  );

  const players = world.query({ and: [IsPlayer, Velocity] });
  if (qtree.query(worldPos).length != 0) {
    for (const e of players) {
      world.removeComponent(e, PathFinder);
      const v = world.getComponent(e, Velocity);
      v.x = v.y = 0;
    }
    return;
  }

  // click to move
  for (const e of players) {
    const pf = world.addComponent(e, PathFinder);
    pf.targetX = worldPos.x;
    pf.targetY = worldPos.y;
  }
}

export function handleAttackInput(world: World, qtree: Quadtree) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (camEntity == undefined) return;
  const camera = world.getComponent(camEntity, Camera);
  const camTransform = world.getComponent(camEntity, Transform);

  const justPressedId = pointers.justPressed.findIndex((x) => x);
  if (justPressedId == -1) return;
  const pressPos = pointerToScreen(
    {
      x: pointers.pressX[justPressedId],
      y: pointers.pressY[justPressedId],
    },
    ctx.canvas,
  );
  const worldPos = screenToWorld(
    pressPos,
    camTransform,
    camera.tilt,
    camera.zoom,
  );
  const clickedShapes = qtree.query(worldPos);
  const players = world.query({ and: [IsPlayer, Stats] });
  if (clickedShapes.length == 0) {
    for (const e of players) {
      world.removeComponent(e, Attack);
    }
    return;
  }
  let minHealth = Infinity;
  let minHealthTarget = -1;
  for (const shape of clickedShapes) {
    if (!world.hasComponent((shape as QtShapes).owner, Health)) continue;
    const h = world.getComponent((shape as QtShapes).owner, Health);
    // choose entity with the least health
    if (minHealth < h.current) continue;
    minHealth = h.current;
    minHealthTarget = (shape as QtShapes).owner;
  }
  if (minHealthTarget == -1) return;
  for (const e of players) {
    const s = world.getComponent(e, Stats);
    world.addComponent(e, Attack, {
      targetEntity: minHealthTarget,
      damage: s.attackDamage,
      range: s.attackRange,
      speed: s.attackSpeed,
    });
  }
}

export function handleAiAttack(world: World, qtree: Quadtree) {
  for (const e of world.query({ and: [Transform, Stats] })) {
    const s = world.getComponent(e, Stats);
    const t = world.getComponent(e, Transform);

    // attack closest
    let minDistance = Infinity;
    let target = -1;
    for (
      const shape of qtree.query({
        x: t.x,
        y: t.y,
        radius: s.attackRange,
      })
    ) {
      const shapeOwner = (shape as QtShapes).owner;
      if (
        shapeOwner == e || !world.hasComponent(shapeOwner, Transform) ||
        !world.hasComponent(shapeOwner, Health)
      ) {
        continue;
      }
      const targetT = world.getComponent(shapeOwner, Transform);
      const distance = (targetT.x - t.x) * (targetT.x - t.x) +
        (targetT.y - t.y) * (targetT.y - t.y);
      if (distance > minDistance) continue;
      minDistance = distance;
      target = shapeOwner;
    }
    if (target == -1) continue;
    world.addComponent(e, Attack, {
      targetEntity: target,
      range: s.attackRange,
      speed: s.attackSpeed,
      damage: s.attackDamage,
    });
  }
}

export function handleAttack(world: World) {
  for (const e of world.query({ and: [Attack, Transform] })) {
    const a = world.getComponent(e, Attack);
    const t = world.getComponent(e, Transform);
    if (
      a.targetEntity == e ||
      !world.hasComponent(a.targetEntity, Transform) ||
      !world.hasComponent(a.targetEntity, Health) ||
      !world.hasComponent(e, Health)
    ) {
      world.removeComponent(e, Attack);
      continue;
    }
    const targetT = world.getComponent(a.targetEntity, Transform);
    const dx = targetT.x - t.x;
    const dy = targetT.y - t.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > a.range) {
      if (!world.hasComponent(e, Velocity)) continue;
      world.addComponent(e, PathFinder, {
        targetX: targetT.x - (dx / mag) * (a.range - 10e-1),
        targetY: targetT.y - (dy / mag) * (a.range - 10e-1),
      });
    } else {
      // cooldown
      if (time.timeSeconds - a.lastAttackTimeSeconds < 1 / a.speed) continue;
      const targetH = world.getComponent(a.targetEntity, Health);
      targetH.current -= a.damage;
      a.lastAttackTimeSeconds = time.timeSeconds;
    }
  }
}

export function handleParticleEmitters(world: World) {
  world.query({ and: [ParticleEmitter, Transform] }).forEach((e) => {
    const emitter = world.getComponent(e, ParticleEmitter);
    const t = world.getComponent(e, Transform);
    if (
      !world.hasEntity(emitter.particleEntity) ||
      !emitter.enabled ||
      time.timeSeconds - emitter.lastEmitTimeSeconds < 1 / emitter.emitRate
    ) {
      return;
    }
    if (time.timeSeconds - emitter.lastEmitTimeSeconds > 3 / emitter.emitRate) {
      emitter.lastEmitTimeSeconds = time.timeSeconds;
      return;
    }
    for (
      let i = 0,
        l = Math.floor(
          (time.timeSeconds - emitter.lastEmitTimeSeconds) * emitter.emitRate,
        );
      i < l;
      i++
    ) {
      const particle = world.copyEntity(emitter.particleEntity);
      const rand = Math.random();
      world.addComponent(particle, Transform, {
        x: t.x +
          rand * emitter.maxSpreadDistance *
            Math.cos(t.rad + (rand - 0.5) * emitter.spreadRadians),
        y: t.y +
          rand * emitter.maxSpreadDistance *
            Math.sin(t.rad + (rand - 0.5) * emitter.spreadRadians),
      });
      const timer = world.addComponent(particle, Timer);
      world.addComponent(particle, Callback).fn = () => {
        if (timer.timeSeconds < emitter.particleLifetimeSeconds) {
          emitter.particleTransition(world, particle, timer);
          return;
        }
        world.deleteEntity(particle);
      };
    }
    emitter.lastEmitTimeSeconds = time.timeSeconds;
  });
}

export function handlePathfind(world: World) {
  world
    .query({ and: [PathFinder, Transform, Velocity, Stats] })
    .forEach((e) => {
      const pf = world.getComponent(e, PathFinder);
      const p = world.getComponent(e, Transform);
      const v = world.getComponent(e, Velocity);
      const s = world.getComponent(e, Stats);

      const dx = pf.targetX - p.x;
      const dy = pf.targetY - p.y;
      const dMag = Math.sqrt(dx * dx + dy * dy);
      const distancePerSec = s.moveSpeed * time.dtSeconds;
      if (dMag < distancePerSec) {
        world.removeComponent(e, PathFinder);
        v.x = v.y = 0;
        return;
      }
      // start slowing if we are less than threshold seconds away from the target
      const threshold = 0.1;
      const timeNeeded = dMag / s.moveSpeed;
      const adjustedSpeed = s.moveSpeed *
        (timeNeeded > threshold ? 1 : timeNeeded / threshold);
      v.x = (dx / dMag) * adjustedSpeed;
      v.y = (dy / dMag) * adjustedSpeed;
    });
}

export function handleDeath(world: World) {
  for (const e of world.query({ and: [Health] })) {
    const h = world.getComponent(e, Health);
    if (h.current > 0) continue;
    world.removeComponent(e, Health);
    const t = world.getComponent(e, Transform);
    const deathTime = time.timeSeconds;
    const sX = t.scaleX;
    const sY = t.scaleY;
    const deathDuration = 1;
    world.addComponent(e, Callback).fn = () => {
      if (time.timeSeconds - deathTime > deathDuration) {
        world.deleteEntity(e);
        return;
      }
      t.scaleX = (sX * (1 - (time.timeSeconds - deathTime))) / deathDuration;
      t.scaleY = (sY * (1 - (time.timeSeconds - deathTime))) / deathDuration;
    };
  }
}
