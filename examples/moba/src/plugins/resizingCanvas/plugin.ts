import { Plugin } from "../../core/app.ts";
import { setUpCanvas } from "../../core/canvas.ts";

const plug: Plugin = {
  run() {
    setUpCanvas();
  },
};

export default plug;
