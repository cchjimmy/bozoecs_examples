import {
  addCamera,
  addMinion,
  addPlayer,
  addSpawner,
} from "../../ecs/entities.ts";
import {
  Camera,
  Circle,
  Color,
  Health,
  IsPlayer,
  OnScreen,
  QtRect,
  Rect,
  Transform,
  Velocity,
} from "../../ecs/components.ts";
import {
  handleAiAttack,
  handleAttack,
  handleAttackInput,
  handleDeath,
  handleMovementInput,
  handleParticleEmitters,
  handlePathfind,
} from "../../ecs/systems/gameplay.ts";
import {
  handleCallbacks,
  handleCamera,
  handleMovement,
  handleTimers,
} from "../../ecs/systems/core.ts";
import {
  checkOnScreenEntities,
  drawBg,
  handleCollision,
  handleQuadtreeElms,
} from "./utils.ts";
import {
  drawAttackTargets,
  drawCameraRect,
  drawCircles,
  drawHealthBars,
  drawImg,
  drawParticleEmitters,
  drawPathFindTargets,
  drawRects,
  drawTexts,
} from "../../ecs/systems/drawing.ts";
import { entityT, World } from "bozoecs";
import { Quadtree } from "quadtree";
import { isQtreeElm } from "./utils.ts";
import ctx from "../resizingCanvas/api.ts";
import { setGameWorld } from "../gameInfo/api.ts";

const world = new World();
const qtree = new Quadtree();

function setUp(world: World): void {
  world.clearWorld();
  world.on("addedComponent", (_entity, _component, instance) => {
    if (isQtreeElm(instance)) {
      qtree.insert(instance);
    }
  });

  world.on("removeComponent", (_entity, _component, instance) => {
    if (isQtreeElm(instance)) {
      qtree.eraseExact(instance);
    }
  });

  const player = addPlayer(world, 0, 0);
  world.addComponent(player, Transform, { scaleX: 2, scaleY: 2 });
  const playerClone = world.cloneEntity(player);
  world.setComponent(playerClone, Transform, { y: -5 }, false);
  world.setComponent(playerClone, Velocity, {}, false);
  world.removeComponent(playerClone, IsPlayer, false);
  qtree.insert(world.setComponent(playerClone, QtRect, {}, false));
  const cam = addCamera(world, 0, 0);
  const camComp = world.getComponent(cam, Camera);
  // camComp.targetEntity = player;
  camComp.isActive = true;
  camComp.zoom = 20;
  const minion = addMinion(world, 10, 0);
  addSpawner(world, -10, 0, minion);
}

const systems = [
  handleCamera,
  handleQuadtreeElms,
  checkOnScreenEntities,
  drawImg,
  drawCircles,
  drawRects,
  drawHealthBars,
  drawTexts,
  drawPathFindTargets,
  drawParticleEmitters,
  () => {
    qtree.drawTree(ctx);
  },
  drawCameraRect,
  drawAttackTargets,
  handleDeath,
  handleParticleEmitters,
  handlePathfind,
  handleMovementInput,
  handleAiAttack,
  handleAttackInput,
  handleAttack,
  handleCallbacks,
  handleTimers,
  handleMovement,
  handleCollision,
];

const plug = {
  setUp: () => {
    setUp(world);
    const qtreeWidth = 30;
    const qtreeHeight = 15;
    qtree.setBoundary({
      x: qtreeWidth / -2,
      y: qtreeHeight / -2,
      width: qtreeWidth,
      height: qtreeHeight,
    });
  },
  update: () => {
    drawBg();
    setGameWorld(world);
    ctx.lineWidth = 0.1;
    for (const sys of systems) {
      sys(world, qtree);
    }
    qtree.update();
  },
};

export default plug;
