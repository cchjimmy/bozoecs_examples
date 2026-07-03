type contextIds = "2d" | "webgl" | "webgl2" | "webgpu" | "bitmaprenderer";
type renderingContext<T extends contextIds> = T extends "2d"
  ? CanvasRenderingContext2D
  : T extends "webgl"
    ? WebGLRenderingContext
    : T extends "webgl2"
      ? WebGL2RenderingContext
      : T extends "webgpu"
        ? GPUCanvasContext
        : T extends "bitmaprenderer"
          ? ImageBitmapRenderingContext
          : never;

function getContext<T extends contextIds>(contextId: T): renderingContext<T> {
  const ctx = document.querySelector("canvas")?.getContext(contextId);
  if (ctx == undefined) throw new Error();
  return ctx as renderingContext<T>;
}

const ctx = getContext("2d");
export default ctx;
