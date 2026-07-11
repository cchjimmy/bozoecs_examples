import * as ecs from "bozoecs";
import * as qtree from "quadtree";

const Position = { x: 0, y: 0 };
const Rect = { x: 0, y: 0, width: 10, height: 10, owner: -1 };
const Text = { x: 0, y: 0, content: "", fontSize: 8 };
const Button = {
  isDown: false,
  justPressed: false,
  justReleased: false,
  isHovered: false,
};
const Cursor = {
  position: 0,
};
const Mouse: {
  x: number[];
  y: number[];
  releaseX: number[];
  releaseY: number[];
  justPressed: boolean[];
  justReleased: boolean[];
  isDown: boolean[];
} = {
  x: [],
  y: [],
  releaseX: [],
  releaseY: [],
  justPressed: [],
  justReleased: [],
  isDown: [],
};
let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;

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

  const systems = [
    highlightHovered,
    drawText,
    drawRects,
    handleButtons,
    handleCursors,
    handleButtonInput,
  ];

  function update() {
    requestAnimationFrame(update);
    const oldFill = ctx.fillStyle;
    ctx.fillStyle = "rgb(100,100,100)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = oldFill;
    // qt.drawTree(ctx);
    ctx.fillStyle = "white";
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
  Mouse.releaseX[e.pointerId] = Mouse.x[e.pointerId];
  Mouse.releaseY[e.pointerId] = Mouse.y[e.pointerId];
  Mouse.x[e.pointerId] = Mouse.y[e.pointerId] = NaN;
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
  const elmPerRow = [3, 3, 4, 4, 4, 3];
  const elmWidthSpan = [
    // row 1
    0.5, 3, 0.5,
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
    "<",
    "",
    ">",
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
        y: unitHeight - 1,
        content: elmText[start + j],
        fontSize: unitHeight - 3,
      });
      if (start + j != 1) {
        world.addComponent(elm, Button);
        quadtree.insert({
          x: unitWidth * widthSum,
          y: unitHeight * i,
          width: unitWidth * elmWidthSpan[start + j],
          height: unitHeight,
          owner: elm,
        } as typeof Rect);
      } else {
        world.addComponent(elm, Cursor);
      }
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
    if (!world.hasComponent(e, Rect)) {
      ctx.fillText(t.content, p.x + t.x, p.y + t.y);
      return;
    }
    const r = world.getComponent(e, Rect);
    const txtMetric = ctx.measureText(t.content);
    const numRows = Math.min(
      Math.ceil(txtMetric.width / r.width),
      Math.floor(r.height / txtMetric.fontBoundingBoxAscent),
    );
    let cursor: typeof Cursor | undefined;
    if (world.hasComponent(e, Cursor)) {
      cursor = world.getComponent(e, Cursor);
    }
    const ratio = (numRows * r.width) / ctx.measureText(t.content).width;
    const charCount = Math.min(
      Math.floor(t.content.length * ratio),
      t.content.length,
    );
    const charsPerRow = Math.floor(charCount / numRows);
    const start = Math.min(
      cursor && ratio < 1
        ? Math.max(cursor.position - Math.floor(charCount / 2), 0)
        : 0,
      t.content.length - charCount,
    );
    for (let i = 0, l = numRows; i < l; i++) {
      if (cursor) {
        const diff = cursor.position - (start + i * charsPerRow);
        if (diff >= 0 && diff <= charsPerRow) {
          ctx.fillRect(
            p.x +
              t.x +
              ctx.measureText(
                t.content.slice(
                  start + i * charsPerRow,
                  start + i * charsPerRow + diff,
                ),
              ).width,
            p.y + t.y + i * txtMetric.fontBoundingBoxAscent,
            2,
            -txtMetric.fontBoundingBoxAscent,
          );
        }
      }
      ctx.fillText(
        t.content.substring(
          start + i * charsPerRow,
          start + (i + 1) * charsPerRow,
        ),
        p.x + t.x,
        p.y + t.y + txtMetric.fontBoundingBoxAscent * i,
      );
    }
  });
}

function handleCursors(world: ecs.World): void {
  world.query({ and: [Cursor, Text] }).forEach((e) => {
    const c = world.getComponent(e, Cursor);
    const t = world.getComponent(e, Text);
    c.position =
      c.position > t.content.length
        ? t.content.length
        : c.position < 0
          ? 0
          : c.position;
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

function handleButtons(world: ecs.World, quadtree: qtree.Quadtree): void {
  world.query({ and: [Button] }).forEach((e) => {
    const b = world.getComponent(e, Button);
    b.justPressed = b.justReleased = b.isHovered = b.isDown = false;
  });
  for (let i = 0, l = Mouse.x.length; i < l; i++) {
    quadtree.query({ x: Mouse.x[i], y: Mouse.y[i] }).forEach((shape) => {
      const rect = shape as typeof Rect;
      if (!world.hasComponent(rect.owner, Button)) return;
      const b = world.getComponent(rect.owner, Button);
      b.isHovered = true;
      b.isDown = Mouse.isDown[i];
      b.justPressed = Mouse.justPressed[i];
    });
    if (!Mouse.justReleased[i]) return;
    quadtree
      .query({ x: Mouse.releaseX[i], y: Mouse.releaseY[i] })
      .forEach((shape) => {
        const rect = shape as typeof Rect;
        if (!world.hasComponent(rect.owner, Button)) return;
        const b = world.getComponent(rect.owner, Button);
        b.justReleased = true;
      });
  }
}

function highlightHovered(world: ecs.World): void {
  ctx.beginPath();
  const oldFill = ctx.fillStyle;
  ctx.fillStyle = "darkorange";
  world.query({ and: [Button, Rect, Position] }).forEach((e) => {
    const b = world.getComponent(e, Button);
    const r = world.getComponent(e, Rect);
    const p = world.getComponent(e, Position);
    if (!b.isHovered) return;
    ctx.rect(p.x + r.x, p.y + r.y, r.width, r.height);
  });
  ctx.fill();
  ctx.fillStyle = oldFill;
}

function handleButtonInput(world: ecs.World): void {
  const displayEntity = world.query({ and: [Text, Cursor] })[0];
  if (!displayEntity) return;
  const cursor = world.getComponent(displayEntity, Cursor);
  const txt = world.getComponent(displayEntity, Text);
  canvas.style.cursor = "";
  world.query({ and: [Button, Text] }).forEach((e) => {
    const b = world.getComponent(e, Button);
    if (b.isHovered) canvas.style.cursor = "pointer";
    if (!b.justReleased) return;
    const t = world.getComponent(e, Text);
    handleInput(t.content, cursor, txt);
  });
}

function handleInput(
  t: string,
  cursor: typeof Cursor,
  displayBuff: typeof Text,
): void {
  switch (t) {
    case "<":
      cursor.position--;
      break;
    case ">":
      cursor.position++;
      break;
    case "=":
      displayBuff.content = evaluate(displayBuff.content).toString();
      cursor.position = displayBuff.content.length;
      break;
    case "C":
      displayBuff.content =
        displayBuff.content.substring(0, cursor.position - 1) +
        displayBuff.content.substring(cursor.position);
      cursor.position--;
      break;
    default:
      displayBuff.content =
        displayBuff.content.substring(0, cursor.position) +
        t +
        displayBuff.content.substring(cursor.position);
      cursor.position++;
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
    const char = buff.charAt(i);
    switch (char) {
      case "-":
      case "%":
      case "+":
      case "×":
      case "÷":
        if (tokenValue.length) {
          tokens.push({ type: TokenTypes.Number, value: tokenValue });
        }
        tokenValue = "";
        tokens.push({ type: TokenTypes.Operator, value: char });
        break;
      default:
        tokenValue += char;
        break;
    }
  }
  if (tokenValue.length) {
    tokens.push({ type: TokenTypes.Number, value: tokenValue });
  }
  return tokens;
}

type Expr = Partial<{
  lhs: string | Expr;
  op: string;
  rhs: string | Expr;
}>;

function parse(tokens: Token[]): Expr {
  let res: Expr = {};
  let current: Expr = res;
  let last: Expr = res;
  for (let i = 0, l = tokens.length; i < l; i++) {
    switch (tokens[i].type) {
      case TokenTypes.Number:
        if (current.lhs == undefined && current.op == undefined) {
          current.lhs = tokens[i].value;
        } else if (current.rhs == undefined) {
          current.rhs = tokens[i].value;
        }
        break;
      case TokenTypes.Operator:
        if (current.op == undefined && tokens[i].value != "%") {
          current.op = tokens[i].value;
          break;
        }
        switch (tokens[i].value) {
          case "%":
            if (
              current.lhs != undefined &&
              current.op == undefined &&
              current.rhs == undefined
            ) {
              current.lhs = (Number(current.lhs) / 100).toString();
            } else if (current.rhs != undefined) {
              current.rhs = (Number(current.rhs) / 100).toString();
            }
            break;
          case "-":
          case "+":
            if (current.rhs != undefined) {
              current = { lhs: res, op: tokens[i].value };
              last = res;
              res = current;
            } else {
              current.rhs = { op: tokens[i].value };
              last = current;
              current = current.rhs;
            }
            break;
          case "×":
          case "÷":
            if (current.op == "-" || current.op == "+") {
              current.rhs = {
                lhs: current.rhs,
                op: tokens[i].value,
              };
              last = current;
              current = current.rhs;
            } else {
              const temp = { lhs: current, op: tokens[i].value };
              if (last.lhs == current) {
                last.lhs = temp;
              } else if (last.rhs == current) {
                last.rhs = temp;
              } else {
                res = temp;
              }
              current = temp;
            }
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
    lhs = Number(e.lhs) || 0;
  }
  if (typeof e.rhs == "object") {
    rhs = calculate(e.rhs);
  } else {
    rhs = Number(e.rhs) || 0;
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
