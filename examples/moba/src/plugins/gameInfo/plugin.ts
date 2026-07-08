import { Plugin } from "../../core/app.ts";
import time from "../time/api.ts";
import { addText } from "../../ecs/entities.ts";
import { drawTexts } from "../../ecs/systems/drawing.ts";
import { World } from "bozoecs";
import { Camera, Color, Text, Transform } from "../../ecs/components.ts";
import {
  getGameWorld,
  detectDeviceType,
  addGraph,
  Graph,
  drawGraph,
} from "./api.ts";
import ctx from "../resizingCanvas/api.ts";

const gameInfoWorld = new World();
const systems = [drawGraph, drawTexts];
let fpsRollingSum = 0;

export default {
  run() {
    const gameText = gameInfoWorld.getComponent(
      addText(gameInfoWorld, 0, 0),
      Text,
    );
    gameText.color = "white";
    gameText.backgroundColor = "transparent";
    const width = 200;
    const height = 100;
    const fpsGraph = addGraph(
      gameInfoWorld,
      ctx.canvas.width - width,
      0,
      width,
      height,
    );
    const g = gameInfoWorld.getComponent(fpsGraph, Graph);
    const xLen = 50;
    g.x = new Array(xLen);
    for (let i = 0; i < xLen; i++) {
      g.x[i] = i;
    }
    g.y = new Array(xLen).fill(0);
    g.xMin = 0;
    g.xMax = xLen;
    g.yMin = 0;
    g.yMax = 120;
    gameInfoWorld.addComponent(fpsGraph, Text, {
      content: "FPS",
      backgroundColor: "transparent",
      color: "white",
    });

    const update = () => {
      ctx.resetTransform();
      gameText.content = "";
      gameText.content += `Device type: ${detectDeviceType()}\n`;
      const gameWorld = getGameWorld();
      if (gameWorld) {
        gameText.content += `Entity count: ${gameWorld.entityCount()}\n`;
        const cams = gameWorld.query({ and: [Camera] });
        let camTransform = Transform;
        for (let i = 0, l = cams.length; i < l; i++) {
          const cam = gameWorld.getComponent(cams[i], Camera);
          if (!cam.isActive) continue;
          camTransform = gameWorld.getComponent(cams[i], Transform);
        }
        gameText.content += `Pos: (${Math.floor(camTransform.x)}, ${Math.floor(camTransform.y)})\n`;
      }

      const graphs = gameInfoWorld.query({ and: [Graph] });
      const fpsGraph = gameInfoWorld.getComponent(graphs[0], Graph);
      const fps = time.dtSeconds == 0 ? 0 : 1 / time.dtSeconds;
      fpsGraph.y.unshift(fps);
      fpsGraph.y.pop();
      const fpsString = gameInfoWorld.getComponent(graphs[0], Text);
      fpsRollingSum += fps;
      fpsRollingSum -= fpsGraph.y[fpsGraph.y.length - 1];
      fpsString.content = `FPS avg.: ${Math.round(fpsRollingSum / fpsGraph.x.length)}`;

      gameInfoWorld.update(systems);

      requestAnimationFrame(update);
    };

    update();
  },
} satisfies Plugin;
