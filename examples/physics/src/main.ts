import { World } from "bozoecs";

// singletons
const Time = { dtMilli: 0, timeMilli: 0, dtSeconds: 0, timeSeconds: 0 };
const Ctx2D = setUpCtx2D();

// utils
function updateTime(p: typeof Time) {
  p.dtMilli = performance.now() - p.timeMilli;
  p.timeMilli += p.dtMilli;
  p.dtSeconds = p.dtMilli / 1000;
  p.timeSeconds = p.timeMilli / 1000;
}
function setUpCtx2D() {
  let canvas = document.querySelector("canvas");
  if (canvas == null) {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot initialize 2D context.");
  return { canvas, ctx };
}

// components
const Position = { x: 0, y: 0 };
const Velocity = { x: 0, y: 0 };
const Acceleration = { x: 0, y: 0 };
const Mass = { kg: 0 };
const Force = { x: 0, y: 0 };
const Circle = { radius: 5 };
const Text = { content: "placeholder", font: "20px sans-serif" };

// systems
function handleMovement(world: World) {
  for (const e of world.query({ and: [Velocity, Acceleration] })) {
    const v = world.getComponent(e, Velocity);
    const a = world.getComponent(e, Acceleration);
    v.x += a.x * Time.dtSeconds;
    v.y += a.y * Time.dtSeconds;
  }
  for (const e of world.query({ and: [Position, Velocity] })) {
    const p = world.getComponent(e, Position);
    const v = world.getComponent(e, Velocity);
    p.x += v.x * Time.dtSeconds;
    p.y += v.y * Time.dtSeconds;
  }
}
function handleApplyForces(world: World) {
  for (const e of world.query({ and: [Force, Mass, Acceleration] })) {
    const f = world.getComponent(e, Force);
    const m = world.getComponent(e, Mass).kg;
    const a = world.getComponent(e, Acceleration);
    // solve for acceleration, F=ma, a=F/m
    a.x = f.x / m;
    a.y = f.y / m;
    f.x = f.y = 0;
  }
}
function handleForceInteractions(world: World) {
  const objs = world.query({ and: [Force, Mass, Position] });
  const fs = [];
  const ms = [];
  const ps = [];
  for (const e of objs) {
    fs.push(world.getComponent(e, Force));
    ms.push(world.getComponent(e, Mass).kg);
    ps.push(world.getComponent(e, Position));
  }
  for (let i = 0, l = fs.length; i < l; i++) {
    const m1 = ms[i];
    const p1 = ps[i];
    for (let j = 0; j < l; j++) {
      if (j == i) continue;
      const f2 = fs[j];
      const m2 = ms[j];
      const p2 = ps[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = (dx * dx + dy * dy) ** 0.5;
      f2.x -= ((6.674 * 10 ** -11 * (m1 * m2)) / distance ** 3) * dx;
      f2.y -= ((6.674 * 10 ** -11 * (m1 * m2)) / distance ** 3) * dy;
    }
  }
}
function handleDrawCircles(world: World) {
  Ctx2D.ctx.strokeStyle = "red";
  Ctx2D.ctx.beginPath();
  for (const e of world.query({ and: [Position, Circle] })) {
    const p = world.getComponent(e, Position);
    const r = world.getComponent(e, Circle).radius;
    Ctx2D.ctx.moveTo(p.x + r, p.y);
    Ctx2D.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  }
  Ctx2D.ctx.stroke();
}
function handleBounce(world: World) {
  for (const e of world.query({
    and: [Position, Velocity, Mass, Force],
  })) {
    const p = world.getComponent(e, Position);
    const v = world.getComponent(e, Velocity);
    const m = world.getComponent(e, Mass).kg;
    const f = world.getComponent(e, Force);
    if (p.x < 0 || p.x > Ctx2D.canvas.width) {
      p.x = p.x < Ctx2D.canvas.width / 2 ? 0 : Ctx2D.canvas.width;
      f.x += (m * -v.x) / Time.dtSeconds;
      v.x = 0;
    }
    if (p.y < 0 || p.y > Ctx2D.canvas.height) {
      p.y = p.y < Ctx2D.canvas.height / 2 ? 0 : Ctx2D.canvas.height;
      f.y += (m * -v.y) / Time.dtSeconds;
      v.y = 0;
    }
  }
}
function handleDrawTexts(world: World) {
  Ctx2D.ctx.fillStyle = "white";
  for (const e of world.query({ and: [Text, Position] })) {
    const text = world.getComponent(e, Text);
    const p = world.getComponent(e, Position);
    const split = text.content.split("\n");
    Ctx2D.ctx.font = text.font;
    const textMetrics = Ctx2D.ctx.measureText(text.content);
    for (let i = 0, l = split.length; i < l; i++) {
      Ctx2D.ctx.fillText(
        split[i],
        p.x,
        p.y + textMetrics.emHeightAscent * (i + 1),
      );
    }
  }
}
function handleDrawForceField(world: World) {
  Ctx2D.ctx.strokeStyle = "white";
  Ctx2D.ctx.beginPath();
  const ps = [];
  const fs = [];
  const ms = [];
  const dx = Ctx2D.canvas.width / 10;
  for (const e of world.query({ and: [Position, Force, Mass] })) {
    ps.push(world.getComponent(e, Position));
    fs.push(world.getComponent(e, Force));
    ms.push(world.getComponent(e, Mass).kg);
  }
  for (let x = dx; x < Ctx2D.canvas.width; x += dx) {
    for (let y = dx; y < Ctx2D.canvas.height; y += dx) {
      let rfx = 0;
      let rfy = 0;
      for (let i = 0, l = fs.length; i < l; i++) {
        const m = ms[i];
        const p = ps[i];
        const dx = p.x - x;
        const dy = p.y - y;
        const distance = (dx * dx + dy * dy) ** 0.5;
        rfx += ((6.674 * 10 ** -11 * m) / distance ** 3) * dx;
        rfy += ((6.674 * 10 ** -11 * m) / distance ** 3) * dy;
      }
      const mag = (rfx * rfx + rfy * rfy) ** 0.5 / (dx / 2);
      Ctx2D.ctx.moveTo(x, y);
      Ctx2D.ctx.lineTo(x + rfx / mag, y + rfy / mag);
      Ctx2D.ctx.moveTo(x + dx / 10, y);
      Ctx2D.ctx.arc(x, y, dx / 10, 0, Math.PI * 2);
    }
  }
  Ctx2D.ctx.stroke();
}

// entities
function addPointMass(world: World, x: number, y: number, mass: number) {
  const e = world.addEntity();
  world.addComponent(e, Position, { x, y });
  world.addComponent(e, Mass, { kg: mass });
  world.addComponent(e, Velocity);
  world.addComponent(e, Acceleration);
  world.addComponent(e, Force);
  world.addComponent(e, Circle, { radius: 5 });
  world.addComponent(e, Text, {
    content: `${mass.toExponential(2)} kg`,
    font: "10px sans-serif",
  });
  return e;
}

const game = new World();

Ctx2D.canvas.width = 200;
Ctx2D.canvas.height = 200;
Ctx2D.canvas.style.imageRendering = "pixelated";

addPointMass(game, Ctx2D.canvas.width / 2, Ctx2D.canvas.height / 2, 2e15);
const lightMass = addPointMass(
  game,
  Ctx2D.canvas.width / 2 + 40,
  Ctx2D.canvas.height / 2,
  1,
);
game.addComponent(lightMass, Force, { y: 1500 });

{
  (function loop() {
    requestAnimationFrame(loop);

    const fps = 30;

    if (Time.timeSeconds % (1 / fps) < Time.dtSeconds) {
      Time.dtSeconds = 1 / 30;
      Ctx2D.ctx.fillStyle = "#424242";
      Ctx2D.ctx.fillRect(0, 0, Ctx2D.canvas.width, Ctx2D.canvas.height);
      game.update([
        handleApplyForces,
        handleForceInteractions,
        // handleBounce,
        handleDrawCircles,
        handleDrawForceField,
        handleDrawTexts,
        handleMovement,
      ]);
    }

    updateTime(Time);
  })();
}
