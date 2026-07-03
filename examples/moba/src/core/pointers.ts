export type Pointers = {
  x: number[];
  y: number[];
  pressX: number[];
  pressY: number[];
  isDown: boolean[];
  justPressed: boolean[];
  justReleased: boolean[];
};
export function setUpPointers(): Pointers {
  const pointers: Pointers = {
    x: [],
    y: [],
    pressX: [],
    pressY: [],
    isDown: [],
    justPressed: [],
    justReleased: [],
  };
  globalThis.onpointerdown = (e) => {
    if (e.target != document.querySelector("canvas")) return;
    pointers.x[e.pointerId] = e.x;
    pointers.y[e.pointerId] = e.y;
    pointers.isDown[e.pointerId] = true;
    pointers.justPressed[e.pointerId] = true;
    pointers.pressX[e.pointerId] = e.x;
    pointers.pressY[e.pointerId] = e.y;
  };
  globalThis.onpointerup = (e) => {
    pointers.x[e.pointerId] = e.x;
    pointers.y[e.pointerId] = e.y;
    pointers.isDown[e.pointerId] = false;
    pointers.justReleased[e.pointerId] = true;
  };
  globalThis.onpointermove = (e) => {
    pointers.x[e.pointerId] = e.x;
    pointers.y[e.pointerId] = e.y;
  };
  return pointers;
}

export function updatePointers(pointers: Pointers) {
  for (let i = 0, l = pointers.x.length; i < l; i++) {
    if (pointers.justReleased[i]) {
      pointers.x[i] = -1;
      pointers.y[i] = -1;
      pointers.isDown[i] = false;
      pointers.justReleased[i] = false;
      pointers.pressX[i] = -1;
      pointers.pressY[i] = -1;
    }
    pointers.justPressed[i] = false;
  }
}
