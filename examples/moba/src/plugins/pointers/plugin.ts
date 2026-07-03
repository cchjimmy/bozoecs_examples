import { Plugin } from "../../core/app.ts";
import { updatePointers } from "../../core/pointers.ts";
import pointers from "./api.ts";

export default {
  run: () => {
    const update = () => {
      updatePointers(pointers);
      requestAnimationFrame(update);
    };
    update();
  },
} satisfies Plugin;
