import {
  addPlayer,
  addSpawner,
  addMinion,
  addGraphic,
  addCamera,
  addTurrent,
  addFountain,
} from "../../ecs/entities.ts";
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
  handleCamera,
  handleTimers,
  handleMovement,
  handleCallbacks,
} from "../../ecs/systems/core.ts";
import {
  handleCollision,
  handleQuadtreeElms,
  checkOnScreenEntities,
  drawBg,
} from "./utils.ts";
import {
  drawImg,
  drawRects,
  drawTexts,
  drawCircles,
  drawHealthBars,
  drawPathFindTargets,
  drawParticleEmitters,
  drawCameraRect,
  drawAttackTargets,
} from "../../ecs/systems/drawing.ts";
import { World } from "bozoecs";
import { default as config } from "../../config.json" with { type: "json" };
import { Quadtree } from "quadtree";
import { isQtreeElm } from "./utils.ts";
import { Camera } from "../../ecs/components.ts";
import * as GameInfo from "../gameInfo/api.ts";
import ctx from "../resizingCanvas/api.ts";

function addTurrents(world: World) {
  const pos = [
    -10, 10, -60, 60, -108, 108, -138, 92, -138, 0, -138, -110, -92, 138, 0,
    138, 110, 138,
  ];
  for (let i = 0, l = pos.length; i < l; i += 2) {
    addTurrent(world, pos[i], pos[i + 1]);
    addTurrent(world, -pos[i], -pos[i + 1]);
  }
}

function addFountains(world: World) {
  addFountain(world, -128, 128);
  addFountain(world, 128, -128);
}

function addSpawners(world: World) {
  const base = addMinion(world, -152, 152);
  const pos = [-138, 109, -109, 138, -120, 120];
  for (let i = 0, l = pos.length; i < l; i += 2) {
    addSpawner(
      world,
      pos[i],
      pos[i + 1],
      base,
      config.entities.minion.spawnRate,
    );
    addSpawner(
      world,
      -pos[i],
      -pos[i + 1],
      base,
      config.entities.minion.spawnRate,
    );
  }
}

const world = new World();
const qtree = new Quadtree();

function setUp(world: World): void {
  world.clearWorld();
  world.onAddedComponent = (_entity, _component, instance) => {
    if (isQtreeElm(instance)) {
      qtree.insert(instance);
    }
  };

  world.onRemoveComponent = (_entity, _component, instance) => {
    if (isQtreeElm(instance)) {
      qtree.eraseExact(instance);
    }
  };

  const player = addPlayer(world, -146, 146);
  // const player = addPlayer(world, -115, 115);
  // const player = addPlayer(world, 0, 0);
  // const player = addPlayer(world, 146, -146);
  addTurrents(world);
  addFountains(world);
  addSpawners(world);
  /**
   * By Original PNG version by Raizin, SVG rework by Sameboat. - file:Map of MOBA.png (CC 3.0), CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=29443207
   */
  addGraphic(world, "./assets/Map_of_MOBA.svg", -150, -150, 300, 300);

  const cam = addCamera(world, -146, 146);
  const camComponent = world.getComponent(cam, Camera);
  camComponent.targetEntity = player;
  camComponent.isActive = true;
  camComponent.zoom = 20;
  // camComponent.zoom = 0.1;

  // const cleaner = world.addEntity();
  // world.addComponent(cleaner, Timer);
  // world.addComponent(cleaner, Callback, {
  //   fn(e) {
  //     const t = world.getComponent(e, Timer);
  //     if (t.timeMilli < 1000 * 60 * 5) return;
  //     t.reset = true;
  //     world.cleanObjectPools();
  //   },
  // });
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
  // () => qtree.drawTree(ctx),
  handleDeath,
  handleParticleEmitters,
  handlePathfind,
  handleMovementInput,
  // handleAiAttack,
  // handleAttackInput,
  // handleAttack,
  handleCallbacks,
  handleTimers,
  handleMovement,
  handleCollision,
];

const plug = {
  setUp: () => {
    setUp(world);
    qtree.setBoundary({
      x: -150,
      y: -150,
      width: 300,
      height: 300,
    });
  },
  update: () => {
    GameInfo.setGameWorld(world);
    drawBg();
    for (const sys of systems) {
      sys(world, qtree);
    }
    qtree.update();
  },
};

export default plug;
