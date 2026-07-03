import pointers from "../../plugins/pointers/api.ts";
import ctx from "../../plugins/resizingCanvas/api.ts";
import { World } from "bozoecs";
import { pointerToScreen } from "../../utils.ts";
import { Button, Transform, Rect } from "../components.ts";

export function handleButtons(world: World) {
  const buttons = world.query({ and: [Button, Transform, Rect] });
  buttons.forEach((e) => {
    const b = world.getComponent(e, Button);
    b.hovered = b.isDown = b.clicked = false;
  });
  for (let i = 0, l = pointers.x.length; i < l; i++) {
    const pointerPos = pointerToScreen(
      { x: pointers.x[i], y: pointers.y[i] },
      ctx.canvas,
    );
    buttons.forEach((e) => {
      const b = world.getComponent(e, Button);
      if (!b.enabled) return;
      const p = world.getComponent(e, Transform);
      const r = world.getComponent(e, Rect);
      const currentHovered =
        (pointerPos.x - (p.x + r.x)) ** 2 < ((r.width * p.scaleX) / 2) ** 2 &&
        (pointerPos.y - (p.y + r.y)) ** 2 < ((r.height * p.scaleY) / 2) ** 2;
      if (!currentHovered) return;
      b.hovered ||= currentHovered;
      b.isDown ||= currentHovered && pointers.isDown[i];
      b.clicked ||= !b.isDown && currentHovered && pointers.justReleased[i];
    });
  }
}
