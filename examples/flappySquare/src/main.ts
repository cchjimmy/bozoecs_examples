import { entityT, World } from "bozoecs";
import { default as config } from "../config.json" with { type: "json" };

// singletons
const canvas = document.createElement("canvas");
if (!canvas) throw new Error("Cannot create canvas element.");
canvas.style.imageRendering = "pixelated";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Cannot initialize 2d context.");
const Pointer = { isDown: false, justPressed: false, justReleased: false };
const Keys: Record<keyof typeof Pointer, Record<string, boolean>> = {
  isDown: {},
  justPressed: {},
  justReleased: {},
};
const GameState = {
  currentScore: 0,
  bestScore: 0,
};

// components
const Transform = { x: 0, y: 0, rad: 0, scaleX: 1, scaleY: 1 };
const Rect = { width: 10, height: 10 };
const Velocity = { x: 0, y: 0 };
const Acceleration = { x: 0, y: 0 };
const PlayerControl = {};
const Obstacle = { gapHeight: config.pipe.gapHeight };

// systems
function drawRect(
  ctx: CanvasRenderingContext2D,
  t: typeof Transform,
  r: typeof Rect,
  color = "white",
) {
  const s = Math.sin(t.rad);
  const c = Math.cos(t.rad);
  const oldF = ctx.fillStyle;
  ctx.transform(c, s, -s, c, t.x, t.y);
  ctx.fillStyle = color;
  ctx.fillRect(
    -r.width * 0.5,
    -r.height * 0.5,
    r.width * t.scaleX,
    r.height * t.scaleY,
  );
  ctx.fillStyle = oldF;
  ctx.transform(c, -s, s, c, c * -t.x + s * -t.y, -s * -t.x + c * -t.y);
}

function handleDrawing(world: World) {
  if (!ctx) return;
  drawBackground(ctx, "green");
  world.query({ and: [Transform, Rect], not: [Obstacle] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    drawRect(ctx, t, r);
  });
  world.query({ and: [Transform, Rect, Obstacle] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    const o = world.getComponent(e, Obstacle);
    const height = (r.height - o.gapHeight) * 0.5;
    drawRect(
      ctx,
      {
        x: t.x,
        y: t.y + (o.gapHeight + height) * 0.5,
        scaleX: 1,
        scaleY: 1,
        rad: 0,
      },
      {
        width: r.width,
        height,
      },
    );
    drawRect(
      ctx,
      {
        x: t.x,
        y: t.y - (o.gapHeight + height) * 0.5,
        scaleX: 1,
        scaleY: 1,
        rad: 0,
      },
      {
        width: r.width,
        height,
      },
    );
  });

  ctx.fillText(
    "Score: " + GameState.currentScore + "; Best: " + GameState.bestScore,
    0,
    10,
  );
}

function handleMovement(world: World) {
  const dt = dtMilli / 1000;
  world.query({ and: [Transform, Acceleration, Velocity] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const v = world.getComponent(e, Velocity);
    const a = world.getComponent(e, Acceleration);
    v.x += a.x * dt;
    v.x *= config.hSpeedMult;
    v.y += a.y * dt;
    t.x += v.x * dt;
    t.y += v.y * dt;
  });
}

function handleInput(world: World) {
  world.query({ and: [PlayerControl, Acceleration, Velocity] }).forEach((e) => {
    // movement control
    const a = world.getComponent(e, Acceleration);
    const v = world.getComponent(e, Velocity);
    a.y = config.grav;
    if (Keys.justPressed[" "] || Pointer.justPressed) {
      a.y = -config.grav * 2e1;
      v.x = v.y = 0;
    }
  });
}

function resetGame(world: World) {
  GameState.bestScore = parseInt(localStorage.getItem("best") || "0");

  GameState.bestScore =
    GameState.currentScore > GameState.bestScore
      ? GameState.currentScore
      : GameState.bestScore;
  GameState.currentScore = 0;

  localStorage.setItem("best", GameState.bestScore.toString());

  world.query({ and: [PlayerControl] }).forEach((e) => {
    resetPlayer(e);
  });
  world.query({ and: [Obstacle] }).forEach((e) => {
    const v = world.getComponent(e, Velocity);
    v.x = -config.pipe.baseSpeed;
    resetObstacle(e);
  });
}

function handleCollision(world: World) {
  world.query({ and: [PlayerControl, Rect, Transform] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);

    if (t.y > canvas.height - r.height * 0.5) {
      resetGame(world);
    }

    world.query({ and: [Transform, Rect, Obstacle] }).forEach((other) => {
      const ot = world.getComponent(other, Transform);
      const or = world.getComponent(other, Rect);
      const oo = world.getComponent(other, Obstacle);

      if (
        (t.x - ot.x) ** 2 < ((r.width + or.width) * 0.5) ** 2 &&
        (t.y - ot.y) ** 2 > ((oo.gapHeight - r.height) * 0.5) ** 2
      ) {
        resetGame(world);
      }

      // loop back
      if (ot.x + or.width * 0.5 < 0) {
        resetObstacle(other);
        GameState.currentScore++;
      }
    });
  });
}

function drawBackground(ctx: CanvasRenderingContext2D, color: string = "") {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const oldF = ctx.fillStyle;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = oldF;
}

// entity
function addRect(world: World, x = 0, y = 0, rad = 0, w = 10, h = 10): entityT {
  const e = world.addEntity();
  const t = world.addComponent(e, Transform);
  t.x = x;
  t.y = y;
  t.rad = rad;
  const r = world.addComponent(e, Rect);
  r.width = w;
  r.height = h;
  world.addComponent(e, Velocity);
  world.addComponent(e, Acceleration);
  return e;
}

function addPlayer(world: World): entityT {
  const player = addRect(world);
  world.addComponent(player, PlayerControl);
  return player;
}

function addObstacle(world: World): entityT {
  const e = addRect(world);
  const r = world.getComponent(e, Rect);
  world.addComponent(e, Obstacle);
  r.width = config.pipe.width;
  r.height = config.pipe.height;
  return e;
}

function resetPlayer(player: entityT) {
  const t = game.getComponent(player, Transform);
  const v = game.getComponent(player, Velocity);
  const a = game.getComponent(player, Acceleration);
  t.x = canvas.width * 0.15;
  t.y = canvas.height * 0.5;
  v.x = v.y = a.x = a.y = 0;
}

function resetObstacle(obstacle: entityT) {
  const t = game.getComponent(obstacle, Transform);
  const r = game.getComponent(obstacle, Rect);
  const o = game.getComponent(obstacle, Obstacle);
  const gapHeight = o.gapHeight;
  t.y = Math.random() * (canvas.height - gapHeight) + gapHeight * 0.5;
  t.x = canvas.width + r.width * 0.5;
}

document.onkeydown = (e) => {
  !Keys.isDown[e.key] && (Keys.justPressed[e.key] = true);
  Keys.isDown[e.key] = true;
};

document.onkeyup = (e) => {
  Keys.isDown[e.key] = false;
  Keys.justReleased[e.key] = true;
};

globalThis.window.onresize = document.body.onload = () => {
  if (innerWidth / innerHeight < canvas.width / canvas.height) {
    canvas.style.width = "100%";
    canvas.style.height = "";
  } else {
    canvas.style.width = "";
    canvas.style.height = "100%";
  }
};

document.onpointerdown = () => {
  Pointer.isDown = true;
  Pointer.justPressed = true;
};

document.onpointerup = () => {
  Pointer.isDown = false;
  Pointer.justReleased = true;
};

// initialization
const game = new World();
let dtMilli = 0;
let timeMilli = 0;
addPlayer(game);
addObstacle(game);
resetGame(game);

(function loop() {
  requestAnimationFrame(loop);
  game.update([handleDrawing, handleInput, handleCollision, handleMovement]);
  Pointer.justReleased = false;
  Pointer.justPressed = false;
  for (const key in Keys.justPressed) {
    Keys.justPressed[key] = false;
  }
  for (const key in Keys.justReleased) {
    Keys.justReleased[key] = false;
  }
  dtMilli = performance.now() - timeMilli;
  timeMilli += dtMilli;
})();
