import * as ecs from "bozoecs";
import * as qtree from "quadtree";

const Position = { x: 0, y: 0 };
const Rect = { x: 0, y: 0, width: 10, height: 10, owner: -1 };
const Text = { x: 0, y: 0, content: "", fontSize: 8 };
const Mouse: {
  x: number[];
  y: number[];
  justPressed: boolean[];
  justReleased: boolean[];
  isDown: boolean[];
} = {
  x: [],
  y: [],
  justPressed: [],
  justReleased: [],
  isDown: [],
};
let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
let displayBuff = "";

function main(): void {
  const c = document.querySelector("canvas");
  if (!c) return;
  c.style.imageRendering = "pixelated";
  canvas = c;
  const context = canvas.getContext("2d");
  if (!context) return;
  ctx = context;

  const world = new ecs.World();
  const qt = new qtree.Quadtree();

  const systems = [drawRects, drawText, highlightHovered];

  function update() {
    requestAnimationFrame(update);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // qt.drawTree(ctx);
    for (const sys of systems) {
      sys(world, qt);
    }

    for (let i = 0, l = Mouse.x.length; i < l; i++) {
      Mouse.justPressed[i] = false;
      Mouse.justReleased[i] = false;
    }
  }

  update();
  genCalcUI(world, qt);
  maximizeCanvas();
}

globalThis.onload = main;
globalThis.onresize = maximizeCanvas;
globalThis.onpointermove = (e) => {
  setMousePos(e);
};
globalThis.onpointerdown = (e) => {
  setMousePos(e);
  Mouse.justPressed[e.pointerId] = true;
  Mouse.isDown[e.pointerId] = true;
};
globalThis.onpointerup = (e) => {
  setMousePos(e);
  Mouse.justReleased[e.pointerId] = true;
  Mouse.isDown[e.pointerId] = false;
};

function setMousePos(e: PointerEvent): void {
  Mouse.x[e.pointerId] = e.x;
  Mouse.y[e.pointerId] = e.y;
  pointer2Screen(Mouse, e.pointerId);
}

function maximizeCanvas(): void {
  if (canvas.width / canvas.height > innerWidth / innerHeight) {
    canvas.style.width = "100%";
    canvas.style.height = "";
  } else {
    canvas.style.width = "";
    canvas.style.height = "100%";
  }
}

function genCalcUI(world: ecs.World, quadtree: qtree.Quadtree): void {
  const elmPerRow = [1, 3, 4, 4, 4, 3];
  const elmWidthSpan = [
    // row 1
    4,
    // row 2
    2, 1, 1,
    // row 3
    1, 1, 1, 1,
    // row 4
    1, 1, 1, 1,
    // row 5
    1, 1, 1, 1,
    // row 6
    2, 1, 1,
  ];
  const elmText = [
    // row 1
    "",
    // row 2
    "C",
    "%",
    "÷",
    // row 3
    "7",
    "8",
    "9",
    "×",
    // row 4
    "4",
    "5",
    "6",
    "-",
    // row 5
    "1",
    "2",
    "3",
    "+",
    // row 6
    "0",
    ".",
    "=",
  ];
  const unitWidth = 20;
  const unitHeight = 20;

  let numCol = -Infinity;
  for (let i = 0, l = elmPerRow.length; i < l; i++) {
    numCol = elmPerRow[i] > numCol ? elmPerRow[i] : numCol;
  }

  canvas.width = unitWidth * numCol;
  canvas.height = unitHeight * elmPerRow.length;

  let start = 0;
  for (let i = 0, l = elmPerRow.length; i < l; i++) {
    let widthSum = 0;
    for (let j = 0, m = elmPerRow[i]; j < m; j++) {
      const elm = world.addEntity();
      world.addComponent(elm, Position, {
        x: unitWidth * widthSum,
        y: unitHeight * i,
      });
      world.addComponent(elm, Rect, {
        width: unitWidth * elmWidthSpan[start + j],
        height: unitHeight,
        owner: elm,
      });
      world.addComponent(elm, Text, {
        x: 2,
        y: unitHeight - 1,
        content: elmText[start + j],
        fontSize: unitHeight,
      });
      quadtree.insert({
        x: unitWidth * widthSum,
        y: unitHeight * i,
        width: unitWidth * elmWidthSpan[start + j],
        height: unitHeight,
        owner: elm,
      } as typeof Rect);
      widthSum += elmWidthSpan[start + j];
    }
    start += elmPerRow[i];
  }
}

function drawRects(world: ecs.World): void {
  ctx.beginPath();
  world.query({ and: [Position, Rect] }).forEach((e) => {
    const p = world.getComponent(e, Position);
    const r = world.getComponent(e, Rect);
    ctx.rect(p.x + r.x, p.y + r.y, r.width, r.height);
  });
  ctx.stroke();
}

function drawText(world: ecs.World): void {
  world.query({ and: [Position, Text] }).forEach((e) => {
    const p = world.getComponent(e, Position);
    const t = world.getComponent(e, Text);
    ctx.font = `${t.fontSize}px sans`;
    ctx.fillText(t.content, p.x + t.x, p.y + t.y);
  });
}

function pointer2Screen(mouse: typeof Mouse, pointerId: number): void {
  const rect = canvas.getBoundingClientRect();
  mouse.x[pointerId] -= rect.left;
  mouse.y[pointerId] -= rect.top;
  if (canvas.width / canvas.height > innerWidth / innerHeight) {
    mouse.x[pointerId] *= canvas.width / innerWidth;
    mouse.y[pointerId] *= canvas.width / innerWidth;
  } else {
    mouse.x[pointerId] *= canvas.height / innerHeight;
    mouse.y[pointerId] *= canvas.height / innerHeight;
  }
}

function highlightHovered(world: ecs.World, quadtree: qtree.Quadtree): void {
  const displayEntity = world.query({ and: [Text, Rect] })[0];
  if (displayEntity == undefined) return;
  const display = world.getComponent(displayEntity, Text);
  const displayRect = world.getComponent(displayEntity, Rect);
  ctx.beginPath();
  const oldStroke = ctx.strokeStyle;
  ctx.strokeStyle = "red";
  for (let i = 0, l = Mouse.x.length; i < l; i++) {
    quadtree.query({ x: Mouse.x[i], y: Mouse.y[i] }).forEach((e) => {
      const rect = e as typeof Rect;
      ctx.rect(rect.x, rect.y, rect.width, rect.height);
      if (!Mouse.justReleased[i]) return;
      const t = world.getComponent(rect.owner, Text).content;
      handleInput(t);
    });
  }
  display.content = displayBuff;
  while (ctx.measureText(display.content).width >= displayRect.width) {
    display.content = display.content.slice(1);
  }
  ctx.stroke();
  ctx.strokeStyle = oldStroke;
}

function handleInput(t: string): void {
  switch (t) {
    case "=":
      displayBuff = evaluate(displayBuff).toString();
      break;
    case "C":
      displayBuff = "";
      break;
    default:
      displayBuff += t;
  }
}

enum TokenTypes {
  Number,
  Operator,
}

type Token = { type: TokenTypes; value: string };

function tokenize(buff: string): Token[] {
  const tokens: Token[] = [];
  let tokenValue = "";
  for (let i = 0, l = buff.length; i < l; i++) {
    switch (buff[i]) {
      case "-":
        if (tokenValue.length) {
          tokens.push({ type: TokenTypes.Number, value: tokenValue });
          tokens.push({ type: TokenTypes.Operator, value: "+" });
        }
        tokenValue = "-";
        break;
      case "%":
      case "+":
      case "×":
      case "÷":
        if (tokenValue.length) {
          tokens.push({ type: TokenTypes.Number, value: tokenValue });
          tokenValue = "";
        }
        tokens.push({ type: TokenTypes.Operator, value: buff[i] });
        break;
      default:
        tokenValue += buff[i];
        break;
    }
  }
  if (tokenValue.length) {
    tokens.push({ type: TokenTypes.Number, value: tokenValue });
  }
  return tokens;
}

type Expr = {
  lhs: string | Expr;
  op: string;
  rhs: string | Expr;
};

function parse(tokens: Token[]): Expr {
  let res: Expr = { lhs: "", op: "", rhs: "" };
  let current: Expr = res;
  for (let i = 0, l = tokens.length; i < l; i++) {
    switch (tokens[i].type) {
      case TokenTypes.Number:
        if (current.lhs == "" && i == 0) {
          current.lhs = tokens[i].value;
        } else if (current.rhs == "") {
          current.rhs = tokens[i].value;
        }
        break;
      case TokenTypes.Operator:
        if (current.op == "" && tokens[i].value != "%") {
          current.op = tokens[i].value;
          break;
        }
        switch (tokens[i].value) {
          case "%":
            if (
              current.rhs == "" &&
              typeof current.lhs == "string" &&
              current.lhs != ""
            ) {
              current.lhs = (Number(current.lhs) / 100).toString();
            } else if (typeof current.rhs == "string" && current.rhs != "") {
              current.rhs = (Number(current.rhs) / 100).toString();
            }
            break;
          case "-":
          case "+":
            current = { lhs: res, op: tokens[i].value, rhs: "" };
            res = current;
            break;
          case "×":
          case "÷":
            current.rhs = { lhs: current.rhs, op: tokens[i].value, rhs: "" };
            current = current.rhs;
            break;
        }
    }
  }
  return res;
}

function calculate(e: Expr): number {
  let lhs = 0;
  let rhs = 0;
  if (typeof e.lhs == "object") {
    lhs = calculate(e.lhs);
  } else {
    lhs = Number(e.lhs);
  }
  if (typeof e.rhs == "object") {
    rhs = calculate(e.rhs);
  } else {
    rhs = Number(e.rhs);
  }
  switch (e.op) {
    case "×":
      lhs *= rhs;
      break;
    case "÷":
      lhs /= rhs;
      break;
    case "-":
      lhs -= rhs;
      break;
    case "+":
      lhs += rhs;
      break;
  }
  return lhs;
}

function evaluate(buff: string): number {
  const tokens = tokenize(buff);
  const ast = parse(tokens);
  return calculate(ast);
}
