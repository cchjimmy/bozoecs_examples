import { addButton, addCamera } from "../../ecs/entities.ts";
import { Camera } from "../../ecs/components.ts";
import { handleCallbacks, handleCamera } from "../../ecs/systems/core.ts";
import { drawRects, drawTexts } from "../../ecs/systems/drawing.ts";
import { handleButtons } from "../../ecs/systems/ui.ts";
import { default as config } from "../../config.json" with { type: "json" };
import { checkOnScreenEntities, handleQuadtreeElms } from "./utils.ts";
import { World } from "bozoecs";
import { Plugin } from "../../core/app.ts";
import { Quadtree } from "../../quadtree/quadtree.ts";

function setUp(world: World): void {
  addButton(
    world,
    config.viewport.width * 0.9,
    config.viewport.height * 0.8,
    config.viewport.height * 0.3,
    config.viewport.height * 0.3,
  );

  const cam = addCamera(
    world,
    config.viewport.width / 2,
    config.viewport.height / 2,
  );
  world.getComponent(cam, Camera).isActive = true;
}

const systems = [
  handleCamera,
  handleQuadtreeElms,
  checkOnScreenEntities,
  drawRects,
  drawTexts,
  handleButtons,
  handleCallbacks,
];

const world = new World();
const qtree = new Quadtree();

const plug: Plugin = {
  setUp: () => {
    world.clearWorld();
    setUp(world);
  },
  update: () => {
    for (const sys of systems) {
      sys(world, qtree);
    }
    qtree.update();
  },
};

export default plug;
