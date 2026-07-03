import { Plugin } from "../../core/app.ts";
import ecs from "./api.ts";

const plug: Plugin = {
  setUp: () => {},
  update: () => {
    ecs.update();
  },
};

export default plug;
