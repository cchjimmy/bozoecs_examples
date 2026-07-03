import { Plugin } from "../../core/app.ts";
import { updateKeyboard } from "../../core/keys.ts";
import keyboard from "./api.ts";

export default {
  run: () => {
    const update = () => {
      updateKeyboard(keyboard);
      requestAnimationFrame(update);
    };
    update();
  },
} satisfies Plugin;
