import { World, entityT } from "bozoecs";
import {
  QtreeRect,
  QtreeCircle,
  QtreeLine,
  QtreePoint,
} from "../quadtree/quadtree.ts";

type EntityId = { owner: entityT };
export const QtRect: QtreeRect & EntityId = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  owner: -1,
};
export const QtCircle: QtreeCircle & EntityId = {
  x: 0,
  y: 0,
  radius: 1,
  owner: -1,
};
export const QtLine: QtreeLine & EntityId = {
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
  owner: -1,
};
export const QtPoint: QtreePoint & EntityId = {
  x: 0,
  y: 0,
  owner: -1,
};
export type QtShapes =
  | typeof QtRect
  | typeof QtLine
  | typeof QtCircle
  | typeof QtPoint;
export const Stats = {
  attackDamage: 0,
  physicalDefence: 0,
  magicResistance: 0,
  abilityPower: 0,
  moveSpeed: 0,
  attackSpeed: 0,
  attackRange: 0,
};
export const Health = { current: 0, max: 0 };
export const Callback = { fn: (_: entityT) => {} };
export const Transform = { x: 0, y: 0, rad: 0, scaleX: 1, scaleY: 1 };
export const Velocity = { x: 0, y: 0 };
export const Acceleration = { x: 0, y: 0 };
export const IsPlayer = {};
export const OnScreen = {};
export const ParticleEmitter = {
  spreadRadians: 0,
  particleEntity: -1,
  particleLifetimeSeconds: 1,
  lastEmitTimeSeconds: 0,
  emitRate: 5,
  enabled: false,
  particleTransition: function (
    world: World,
    particleEntity: entityT,
    entityTimer: typeof Timer,
  ) {
    const sizeDurationSeconds = 0.3;
    const t = world.getComponent(particleEntity, Transform);
    const spawnSize = entityTimer.timeSeconds / sizeDurationSeconds;
    const despawnSize =
      (this.particleLifetimeSeconds - entityTimer.timeSeconds) /
      sizeDurationSeconds;
    const size = spawnSize < 1 ? spawnSize : despawnSize < 1 ? despawnSize : 1;
    t.scaleX = t.scaleY = -((size - 1) ** 2) + 1;
  },
};
export const Camera = { zoom: 1, tilt: 0, isActive: false, targetEntity: -1 };
export const Rect = { width: 1, height: 1, x: -0.5, y: -0.5 };
export const Circle = { radius: 1, x: 0, y: 0 };
export const Graphic = { x: 0, y: 0, image: new Image() };
export const Button = {
  enabled: true,
  hovered: false,
  isDown: false,
  clicked: false,
};
export const Color = { fill: "white", stroke: "black" };
export const Text = {
  x: 0,
  y: 0,
  content: "",
  fontSize: 20,
  padding: 3,
  color: "black",
  backgroundColor: "white",
};
export const Timer = { timeSeconds: 0, reset: false, pause: false };
export const PathFinder = { targetX: 0, targetY: 0 };
export const Attack = {
  targetEntity: -1,
  range: 10,
  damage: 0,
  speed: 1,
  lastAttackTimeSeconds: 0,
};
