import { Plugin } from "../../core/app.ts";
import qtManager from "./api.ts";

const plug: Plugin = {
  setUp() {},
  update() {
    qtManager.update();
  },
};

export default plug;
