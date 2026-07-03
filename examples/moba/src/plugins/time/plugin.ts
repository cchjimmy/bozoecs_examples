import { Plugin } from "../../core/app.ts";
import { updateTime } from "../../core/time.ts";
import time from "./api.ts";

export default {
  run: () => {
    const update = () => {
      updateTime(time);
      requestAnimationFrame(update);
    };
    update();
  },
} satisfies Plugin;
