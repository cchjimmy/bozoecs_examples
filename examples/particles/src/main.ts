import { World } from "bozoecs";

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

(() => {
  const canvas =
    document.querySelector("canvas") || document.createElement("canvas");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d", { alpha: false });

  const ENTITY_COUNT = 1000;

  const w = new World();

  // components
  const Position = { x: 0, y: 0 };
  const Velocity = { x: 0, y: 0 };
  const Circle = { radius: 10, color: "green" };

  const Time = { dtSeconds: 0, dtMilli: 0, timeMilli: 0, timeSeconds: 0 };

  // systems
  function render(world: World) {
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    world.query({ and: [Position, Circle] }).forEach((e) => {
      const p = world.getComponent(e, Position);
      const c = world.getComponent(e, Circle);
      ctx.beginPath();
      ctx.arc(p.x, p.y, c.radius, 0, Math.PI * 2);
      ctx.strokeStyle = c.color;
      ctx.stroke();
    });
    ctx.fillStyle = "white";
    const fontSize = canvas.height / 20;
    ctx.font = `${fontSize}px serif`;
    ctx.fillText(`FPS: ${(1 / Time.dtSeconds).toFixed(0)}`, 0, fontSize);
  }
  function move(world: World) {
    const dt = Time.dtSeconds;
    world.query({ and: [Position, Velocity] }).forEach((e) => {
      const p = world.getComponent(e, Position);
      const v = world.getComponent(e, Velocity);
      p.x += v.x * dt;
      p.y += v.y * dt;
    });
  }
  function bounce(world: World) {
    world.query({ and: [Position, Velocity, Circle] }).forEach((e) => {
      const p = world.getComponent(e, Position);
      const v = world.getComponent(e, Velocity);
      const c = world.getComponent(e, Circle);
      if (p.x - c.radius < 0 || p.x + c.radius > canvas.width) {
        v.x *= -1;
        p.x = p.x < canvas.width * 0.5 ? c.radius : canvas.width - c.radius;
      }
      if (p.y - c.radius < 0 || p.y + c.radius > canvas.height) {
        v.y *= -1;
        p.y = p.y < canvas.height * 0.5 ? c.radius : canvas.height - c.radius;
      }
    });
  }

  // entity
  function createEntity() {
    const e = w.addEntity();
    w.addComponent(e, Position, {
      x: random(0, canvas.width),
      y: random(0, canvas.height),
    });
    const maxSpeed = 100;
    const speed = maxSpeed * Math.random();
    const dir = random(0, Math.PI * 2);
    w.addComponent(e, Velocity, {
      x: Math.cos(dir) * speed,
      y: Math.sin(dir) * speed,
    });
    const c = w.addComponent(e, Circle, {
      radius: random(10, 30),
      color: `#${Math.round(random(0, 16 ** 6 - 1))
        .toString(16)
        .padStart(6, "0")}`,
    });
    return e;
  }

  globalThis.onload = globalThis.onresize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    canvas.style.width = canvas.style.height = "100%";
  };

  canvas.width = innerWidth;
  canvas.height = innerHeight;

  for (let i = 0; i < ENTITY_COUNT; ++i) {
    createEntity();
  }

  Time.timeMilli = performance.now();

  canvas.style.imageRendering = "pixelated";

  function update() {
    if (!ctx) return;
    requestAnimationFrame(update);
    w.update([render, move, bounce]);
    Time.dtMilli = performance.now() - Time.timeMilli;
    Time.dtSeconds = Time.dtMilli / 1000;
    Time.timeMilli += Time.dtMilli;
    Time.timeSeconds = Time.timeMilli / 1000;
  }

  update();
})();
