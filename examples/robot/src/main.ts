import { entityT, World } from "bozoecs";

// singletons
const Ctx2D = setUpCanvas2D();
const Time = setUpTime();
const Pointer = setUpPointer();

function setUpCanvas2D() {
  const canvas =
    document.querySelector("canvas") ?? document.createElement("canvas");
  if (!canvas) throw new Error("Cannot create canvas element.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot initialize context 2d.");

  document.body.appendChild(canvas);

  globalThis.onresize = globalThis.onload = () => {
    if (innerWidth / innerHeight < canvas.width / canvas.height) {
      canvas.style.width = "100%";
      canvas.style.height = "";
    } else {
      canvas.style.width = "";
      canvas.style.height = "100%";
    }
  };

  return { canvas, ctx };
}
function setUpTime() {
  return { dtMilli: 0, timeMilli: 0 };
}
function updateTime(time: { dtMilli: number; timeMilli: number }) {
  time.dtMilli = performance.now() - time.timeMilli;
  time.timeMilli += time.dtMilli;
}
type pointerT = {
  pos: Map<number, vec2>;
  isDown: Map<number, boolean>;
  justPressed: Map<number, boolean>;
  justReleased: Map<number, boolean>;
  pressPos: Map<number, vec2>;
  releasePos: Map<number, vec2>;
};
function setUpPointer() {
  const pointer: pointerT = {
    pos: new Map(),
    isDown: new Map(),
    justPressed: new Map(),
    justReleased: new Map(),
    pressPos: new Map(),
    releasePos: new Map(),
  };

  globalThis.onpointerdown = (e) => {
    if (!(e.target instanceof HTMLCanvasElement)) return;
    pointer.pos.set(e.pointerId, { x: e.x, y: e.y });
    pointer.pressPos.set(e.pointerId, { x: e.x, y: e.y });
    pointer.isDown.set(e.pointerId, true);
    pointer.justPressed.set(e.pointerId, true);
  };

  globalThis.onpointerup = (e) => {
    pointer.pos.delete(e.pointerId);
    pointer.releasePos.set(e.pointerId, { x: e.x, y: e.y });
    pointer.isDown.delete(e.pointerId);
    pointer.justReleased.set(e.pointerId, true);
  };

  globalThis.onpointermove = (e) => {
    pointer.pos.set(e.pointerId, { x: e.x, y: e.y });
  };

  return pointer;
}
function updatePointer(pointer: pointerT) {
  pointer.justReleased.clear();
  pointer.justPressed.clear();
  pointer.releasePos.clear();
  pointer.pressPos.clear();
}

// components
const Transform = { x: 0, y: 0, rad: 0 };
const Hierarchy: { parent: entityT; children: entityT[] } = {
  parent: -1,
  children: [],
};
const Eye = { eyeWhiteRadius: 1, pupilRadius: 0.4, lookAtEntity: -1 };
const Camera = { zoom: 20, tilt: 0, isActive: false };
const Rect = { width: 1, height: 1 };
const Material = { density: 0.1 };
const Velocity = { x: 0, y: 0 };
const Acceleration = { x: 0, y: 0 };
const isPointer = {};
const AngularVelocity = { radPerSecond: 0 };

// entities
function addLimb(
  world: World,
  x = 0,
  y = 0,
  rect: typeof Rect = { width: 1, height: 1 },
  offset: vec2 = { x: 0, y: 0 },
  parent = -1,
) {
  const anchor = world.addEntity();
  world.addComponent(anchor, Transform, { x, y });
  world.addComponent(anchor, Velocity);
  world.addComponent(anchor, Acceleration);
  world.addComponent(anchor, AngularVelocity);
  const limb = world.addEntity();
  world.addComponent(limb, Transform, offset);
  world.addComponent(limb, Rect, rect);
  world.addComponent(limb, Material);
  attach(world, parent, anchor);
  attach(world, anchor, limb);
  return anchor;
}
function addEye(
  world: World,
  x = 0,
  y = 0,
  eyeWhiteRadius = 1,
  pupilRadius = 0.4,
  lookAtEntity = -1,
  parent = -1,
) {
  const eye = world.addEntity();
  world.addComponent(eye, Transform, { x, y });
  world.addComponent(eye, Hierarchy, { parent });
  world.addComponent(eye, Eye, { eyeWhiteRadius, pupilRadius, lookAtEntity });
  return eye;
}
function addPerson(world: World, x = 0, y = 0, lookAtEntity = -1) {
  const headRect: typeof Rect = { width: 1, height: 1 };
  const headOffset: vec2 = { x: -0.5, y: 0 };
  const torsoRect: typeof Rect = { width: 1, height: 2 };
  const torsoOffset: vec2 = { x: -0.5, y: -2 };
  const limbRect: typeof Rect = { width: 0.5, height: 0.9 };
  const limbOffset: vec2 = { x: -0.25, y: -0.9 };

  const torso = addLimb(world, x, y, torsoRect, torsoOffset);
  const head = addLimb(world, 0, 0.2, headRect, headOffset, torso);
  const leftEye = addEye(world, 0.4, 0.4, 0.3, 0.1, lookAtEntity, head);
  const rightEye = addEye(world, -0.4, 0.4, 0.3, 0.1, lookAtEntity, head);
  const leftUpperArm = addLimb(world, 1, 0, limbRect, limbOffset, torso);
  const leftLowerArm = addLimb(
    world,
    0,
    -1,
    limbRect,
    limbOffset,
    leftUpperArm,
  );
  const rightUpperArm = addLimb(world, -1, 0, limbRect, limbOffset, torso);
  const rightLowerArm = addLimb(
    world,
    0,
    -1,
    limbRect,
    limbOffset,
    rightUpperArm,
  );
  const leftUpperLeg = addLimb(world, 0.5, -2.2, limbRect, limbOffset, torso);
  const leftLowerLeg = addLimb(
    world,
    0,
    -1,
    limbRect,
    limbOffset,
    leftUpperLeg,
  );
  const rightUpperLeg = addLimb(world, -0.5, -2.2, limbRect, limbOffset, torso);
  const rightLowerLeg = addLimb(
    world,
    0,
    -1,
    limbRect,
    limbOffset,
    rightUpperLeg,
  );
  return {
    head,
    rightEye,
    leftEye,
    torso,
    rightUpperArm,
    rightLowerArm,
    leftUpperArm,
    leftLowerArm,
    rightUpperLeg,
    rightLowerLeg,
    leftUpperLeg,
    leftLowerLeg,
  };
}

// systems
function handleAngularVelocity(world: World) {
  world.query({ and: [Transform, AngularVelocity] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const av = world.getComponent(e, AngularVelocity);
    t.rad += (av.radPerSecond * Time.dtMilli) / 1000;
  });
}
function handleDrawRects(world: World) {
  Ctx2D.ctx.beginPath();
  world.query({ and: [Transform, Rect] }).forEach((e) => {
    const { x, y, rad: r } = calculateHierarchyTransform(world, e);
    const rect = world.getComponent(e, Rect);
    const c = Math.cos(r);
    const s = Math.sin(r);
    Ctx2D.ctx.transform(c, s, -s, c, x, y);
    Ctx2D.ctx.rect(0, 0, rect.width, rect.height);
    Ctx2D.ctx.transform(c, -s, s, c, c * -x + s * -y, -s * -x + c * -y);
  });
  Ctx2D.ctx.fillStyle = "white";
  Ctx2D.ctx.fill();
}
function handleDrawEyes(world: World) {
  world.query({ and: [Transform, Eye, Hierarchy] }).forEach((e) => {
    const eye = world.getComponent(e, Eye);
    const { x, y } = calculateHierarchyTransform(world, e);
    Ctx2D.ctx.fillStyle = "lightgrey";
    Ctx2D.ctx.beginPath();
    Ctx2D.ctx.ellipse(
      x,
      y,
      eye.eyeWhiteRadius,
      eye.eyeWhiteRadius,
      0,
      0,
      Math.PI * 2,
    );
    Ctx2D.ctx.fill();
    let dirX = 0;
    let dirY = 0;
    let mag = eye.eyeWhiteRadius - eye.pupilRadius;
    if (eye.lookAtEntity != -1) {
      const t = world.getComponent(eye.lookAtEntity, Transform);
      dirX = t.x - x;
      dirY = t.y - y;
      const m = (dirX ** 2 + dirY ** 2) ** 0.5;
      dirX /= m;
      dirY /= m;
      mag = Math.min(m, mag);
    }
    Ctx2D.ctx.fillStyle = "black";
    Ctx2D.ctx.beginPath();
    Ctx2D.ctx.ellipse(
      x + dirX * mag,
      y + dirY * mag,
      eye.pupilRadius,
      eye.pupilRadius,
      0,
      0,
      Math.PI * 2,
    );
    Ctx2D.ctx.fill();
  });
}
function handleCamera(world: World) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (!camEntity) return;
  Ctx2D.ctx.resetTransform();
  const c = world.getComponent(camEntity, Camera);
  const p = world.getComponent(camEntity, Transform);
  if (world.hasComponent(camEntity, Hierarchy)) {
    const h = world.getComponent(camEntity, Hierarchy);
    if (world.hasComponent(h.parent, Transform)) {
      Object.assign(p, calculateHierarchyTransform(world, h.parent));
    }
  }
  const sin = Math.sin(p.rad + c.tilt);
  const cos = Math.cos(p.rad + c.tilt);
  const x = p.x * c.zoom;
  const y = p.y * -c.zoom;
  Ctx2D.ctx.transform(
    cos,
    sin,
    -sin,
    cos,
    cos * -x - sin * -y + Ctx2D.canvas.width * 0.5,
    sin * -x + cos * -y + Ctx2D.canvas.height * 0.5,
  );
  Ctx2D.ctx.transform(c.zoom, 0, 0, -c.zoom, 0, 0);
}
function handleGravity(world: World) {
  world.query({ and: [Acceleration] }).forEach((e) => {
    const a = world.getComponent(e, Acceleration);
    if (world.hasComponent(e, Hierarchy)) {
      const h = world.getComponent(e, Hierarchy);
      if (h.parent != -1) return;
    }
    a.y = -9.81;
  });
}
function handleMovement(world: World) {
  world.query({ and: [Velocity, Acceleration] }).forEach((e) => {
    const v = world.getComponent(e, Velocity);
    const a = world.getComponent(e, Acceleration);
    v.x += (a.x * Time.dtMilli) / 1000;
    v.y += (a.y * Time.dtMilli) / 1000;
  });
  world.query({ and: [Transform, Velocity] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const v = world.getComponent(e, Velocity);
    t.x += (v.x * Time.dtMilli) / 1000;
    t.y += (v.y * Time.dtMilli) / 1000;
  });
}
function handlePointer(world: World) {
  world.query({ and: [isPointer] }).forEach((e) => world.deleteEntity(e));
  const cam = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (!cam) return;
  const camComp = world.getComponent(cam, Camera);
  const camPos = world.getComponent(cam, Transform);
  Pointer.isDown.forEach((_, k) => {
    const pointerEntity = world.addEntity();
    const pos = Pointer.pos.get(k);
    if (!pos) return;
    world.addComponent(
      pointerEntity,
      Transform,
      screenToWorld(
        pointerToScreen(pos, Ctx2D.canvas, true),
        camPos,
        camComp.tilt,
        camComp.zoom,
      ),
    );
    world.addComponent(pointerEntity, isPointer);
    world.addComponent(pointerEntity, Rect);
  });
}
function handleLookAtPointer(world: World) {
  world.query({ and: [Eye, Transform] }).forEach((e) => {
    const eye = world.getComponent(e, Eye);
    const { x, y } = calculateHierarchyTransform(world, e);
    let pointerRect = -1;
    let minDistance = Number.POSITIVE_INFINITY;
    world.query({ and: [isPointer, Transform] }).forEach((e) => {
      const t = world.getComponent(e, Transform);
      const dx = t.x - x;
      const dy = t.y - y;
      const distance = (dx ** 2 + dy ** 2) ** 0.5;
      if (distance > minDistance) return;
      minDistance = distance;
      pointerRect = e;
    });
    eye.lookAtEntity = pointerRect ?? -1;
  });
}

// utils
function drawBackground(color = "#202020") {
  Ctx2D.ctx.resetTransform();
  Ctx2D.ctx.fillStyle = color;
  Ctx2D.ctx.fillRect(0, 0, Ctx2D.canvas.width, Ctx2D.canvas.height);
}
type vec2 = { x: number; y: number };
function screenToWorld(
  screenPos: vec2,
  cameraPos: vec2,
  cameraTilt: number,
  cameraZoom: number,
): vec2 {
  const cos = Math.cos(cameraTilt);
  const sin = Math.sin(cameraTilt);
  const res = { x: 0, y: 0 };
  const x = screenPos.x - Ctx2D.canvas.width / 2;
  const y = screenPos.y - Ctx2D.canvas.height / 2;
  res.x = cos * x - sin * y;
  res.y = sin * x + cos * y;
  res.x /= cameraZoom;
  res.y /= cameraZoom;
  res.x += cameraPos.x;
  res.y += cameraPos.y;
  return res;
}
function pointerToScreen(
  pointerPos: vec2,
  canvas: HTMLCanvasElement,
  invertY: boolean = false,
): vec2 {
  const out = { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  out.x = pointerPos.x - rect.left;
  out.y = pointerPos.y - rect.top;
  if (innerWidth / innerHeight < canvas.width / canvas.height) {
    out.x *= canvas.width / innerWidth;
    out.y *= canvas.width / innerWidth;
  } else {
    out.x *= canvas.height / innerHeight;
    out.y *= canvas.height / innerHeight;
  }
  if (invertY) out.y = -out.y + canvas.height;
  return out;
}
function calculateHierarchyTransform(
  world: World,
  entity: entityT,
): typeof Transform {
  const t = world.getComponent(entity, Transform);
  if (!world.hasComponent(entity, Hierarchy)) return t;
  let x = t.x;
  let y = t.y;
  let r = t.rad;
  let h = world.getComponent(entity, Hierarchy);
  while (world.hasComponent(h.parent, Hierarchy)) {
    if (world.hasComponent(h.parent, Transform)) {
      const parentTransform = world.getComponent(h.parent, Transform);
      const c = Math.cos(parentTransform.rad);
      const s = Math.sin(parentTransform.rad);
      const _x = x;
      const _y = y;
      x = c * _x - s * _y;
      y = s * _x + c * _y;
      x += parentTransform.x;
      y += parentTransform.y;
      r += parentTransform.rad;
    }
    h = world.getComponent(h.parent, Hierarchy);
  }
  return { x, y, rad: r };
}
function attach(world: World, parent: entityT, child: entityT) {
  if (parent != -1) {
    !world.hasComponent(parent, Hierarchy) &&
      world.addComponent(parent, Hierarchy, { children: [] });
    const hp = world.getComponent(parent, Hierarchy);
    for (let i = 0, l = hp.children.length; i < l; i++) {
      if (hp.children[i] == child) return;
    }
    hp.children.push(child);
  }
  !world.hasComponent(child, Hierarchy) &&
    world.addComponent(child, Hierarchy, { children: [] });
  const hc = world.getComponent(child, Hierarchy);
  hc.parent = parent;
}
function detach(world: World, parent: entityT, child: entityT) {
  if (parent != -1) {
    !world.hasComponent(parent, Hierarchy) &&
      world.addComponent(parent, Hierarchy, { children: [] });
    const hp = world.getComponent(parent, Hierarchy);
    for (let i = 0, l = hp.children.length; i < l; i++) {
      if (hp.children[i] != child) continue;
      hp.children.splice(i, 1);
      break;
    }
  }
  !world.hasComponent(child, Hierarchy) &&
    world.addComponent(child, Hierarchy, { children: [] });
  const hc = world.getComponent(child, Hierarchy);
  hc.parent = -1;
}

// initialization
const game = new World();

const player = addPerson(game, 0, 0);
game.getComponent(player.rightUpperLeg, AngularVelocity).radPerSecond = 2;
game.getComponent(player.rightLowerLeg, AngularVelocity).radPerSecond = -2;
game.getComponent(player.leftLowerArm, AngularVelocity).radPerSecond = -1;
// addPerson(game, -3, 1);
// addPerson(game, 3, 0);

const camera = game.addEntity();
game.addComponent(camera, Transform, { x: 0, y: 0 });
game.addComponent(camera, Camera, {
  zoom: 18,
  isActive: true,
});
game.addComponent(camera, Hierarchy, { parent: player.torso });

{
  (function update() {
    requestAnimationFrame(update);
    drawBackground();
    game.update([
      handleCamera,
      handlePointer,
      handleLookAtPointer,
      handleDrawRects,
      handleDrawEyes,
      // handleGravity,
      handleMovement,
      handleAngularVelocity,
    ]);
    updateTime(Time);
    updatePointer(Pointer);
  })();
}
