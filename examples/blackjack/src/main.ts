import { entityT, World } from "bozoecs";
import { generateDeck } from "./cards.ts";

// credit: https://www.wikihow.com/Play-Blackjack

// utils
function setUpTime() {
  const time = { dtMilli: 0, timeMilli: 0, dtSeconds: 0, timeSeconds: 0 };
  return time;
}
function updateTime(time: {
  dtMilli: number;
  timeMilli: number;
  dtSeconds: number;
  timeSeconds: number;
}) {
  time.dtMilli = performance.now() - time.timeMilli;
  time.timeMilli += time.dtMilli;
  time.dtSeconds = time.dtMilli / 1000;
  time.timeSeconds = time.timeMilli / 1000;
}
type Pointers = {
  x: number[];
  y: number[];
  isDown: boolean[];
  justPressed: boolean[];
  justReleased: boolean[];
};
function setUpPointers() {
  const pointers: Pointers = {
    x: [],
    y: [],
    isDown: [],
    justPressed: [],
    justReleased: [],
  };
  globalThis.onpointerup = (e) => {
    const id = e.pointerId;
    pointers.x[id] = e.x;
    pointers.y[id] = e.y;
    pointers.isDown[id] = false;
    pointers.justReleased[id] = true;
  };
  globalThis.onpointerdown = (e) => {
    const id = e.pointerId;
    pointers.x[id] = e.x;
    pointers.y[id] = e.y;
    pointers.isDown[id] = true;
    pointers.justPressed[id] = true;
  };
  globalThis.onpointermove = (e) => {
    const id = e.pointerId;
    pointers.x[id] = e.x;
    pointers.y[id] = e.y;
  };
  return pointers;
}
function updatePointers(pointers: Pointers) {
  for (let i = 0, l = pointers.x.length; i < l; i++) {
    if (pointers.justReleased[i]) {
      pointers.x[i] = -1;
      pointers.y[i] = -1;
      pointers.isDown[i] = false;
      pointers.justReleased[i] = false;
    }
    pointers.justPressed[i] = false;
  }
}
function setUpCanvas() {
  let canvas = document.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    document.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("cannot initialize 2d context.");
  return { canvas, ctx };
}
function screen2World(x: number, y: number) {
  const clientRect = Ctx2d.canvas.getBoundingClientRect();
  const ratio =
    Ctx2d.canvas.width / Ctx2d.canvas.height > innerWidth / innerHeight
      ? innerWidth / Ctx2d.canvas.width
      : innerHeight / Ctx2d.canvas.height;
  return {
    x: (x - clientRect.left) / ratio,
    y: (y - clientRect.top) / ratio,
  };
}
function isPointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
) {
  return px > rx && px < rx + rw && py > ry && py < ry + rh;
}
// credit: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(seconds: number) {
  return new Promise((res) => setTimeout(res, seconds * 1000));
}
function calcHandValue(
  world: World,
  hand: entityT[] = [],
  target: number = 21,
) {
  let value = 0;
  const vals: number[][] = [];
  const indices: number[] = [];
  for (const e of hand) {
    const c = world.getComponent(e, Card);
    const values = CardValues[c.value].sort();
    vals.push(values);
    indices.push(values.length - 1);
    value += values[values.length - 1];
  }
  let exhausted = false;
  while (value > target && !exhausted) {
    let indexSum = 0;
    for (let i = 0, l = indices.length; i < l; i++) {
      if (indices[i] == 0) continue;
      indexSum += indices[i];
      value -= vals[i][indices[i]];
      indices[i]--;
      value += vals[i][indices[i]];
      if (value <= target) break;
    }
    exhausted = indexSum == 0;
  }
  return value;
}
function pickACard(world: World, forPlayer = true, revealed = true) {
  let playersHand: entityT[] | undefined;
  let dealersHand: entityT[] | undefined;
  for (const e of world.query({ and: [Transform, EntityContainer] })) {
    const t = world.getComponent(e, Transform);
    const eC = world.getComponent(e, EntityContainer);
    if (t.y == 0) dealersHand = eC.entities;
    if (t.y == Ctx2d.canvas.height - CardSpec.height) playersHand = eC.entities;
  }
  if (!playersHand || !dealersHand) return;
  const deck = world.query({ and: [Card], not: [InHand] });
  if (deck.length == 0) return;
  const picked = deck[Math.round(Math.random() * (deck.length - 1))];
  world.addComponent(picked, InHand, {
    isPlayer: forPlayer,
    isRevealed: revealed,
  });
  const t = world.addComponent(picked, Transform, {
    x: Game.deckX,
    y: Game.deckY,
  });
  world.addComponent(picked, Graphic);
  if (forPlayer) {
    playersHand.push(picked);
  } else {
    dealersHand.push(picked);
  }
  // flipAnimation(t);
}
function splitHand(world: World) {
  const inHandCards = world.query({ and: [InHand] });
  const split: entityT[][] = [[], []];
  const playersHand = 0;
  const dealersHand = 1;
  for (const e of inHandCards) {
    split[
      world.getComponent(e, InHand).isPlayer ? playersHand : dealersHand
    ].push(e);
  }
  return split;
}
function setButtonsActivation(world: World, enabled = true) {
  for (const e of world.query({ and: [Button] })) {
    world.getComponent(e, Button).enabled = enabled;
  }
}
async function pickCard(world: World, forPlayer = true) {
  const split = splitHand(world);
  const playersHand = 0;
  const dealersHand = 1;
  if (split[playersHand].length == 0 && split[dealersHand].length == 0) {
    setButtonsActivation(world, false);
    for (let i = 0; i < 4; i++) {
      pickACard(world, i % 2 != 0, i != 2);
      await sleep(0.2);
    }
    setButtonsActivation(world, true);
    return;
  }
  pickACard(world, forPlayer);
}
function resetGame(world: World) {
  resetCards(world);
  Game.credits = 100;
  Game.minBet = 10;
  Game.bet = Game.minBet;
  Game.status = GAME_STATUSES.PLAY;
  Game.rounds = 0;
  Game.best = parseInt(localStorage.getItem("best_blackjack") ?? "0");
}
function calculateCredits() {
  switch (Game.status) {
    case GAME_STATUSES.BLACKJACK:
      // 3:2 ratio
      Game.credits += Math.floor((Game.bet / 2) * 3);
      break;
    case GAME_STATUSES.LOSE:
    case GAME_STATUSES.BUST:
      Game.credits -= Game.bet;
      break;
    case GAME_STATUSES.WIN:
      Game.credits += Game.bet;
      break;
    case GAME_STATUSES.PLAY:
    case GAME_STATUSES.DRAW:
  }
}
function resumeGame(world: World) {
  resetCards(world);
  Game.status = GAME_STATUSES.PLAY;
  Game.rounds++;
  if (Game.rounds % Game.roundsTilBetIncrease == 0) {
    Game.minBet **= Game.betIncreaseExponent;
    Game.minBet = Math.ceil(Game.minBet);
  }
  Game.bet = Math.max(Game.minBet, Game.bet);
}
function resetCards(world: World) {
  for (const e of world.query({ and: [InHand] })) {
    world.removeComponent(e, InHand);
    world.addComponent(e, MovementTarget, { x: Game.deckX, y: Game.deckY });
  }
  for (const e of world.query({ and: [Transform, EntityContainer] })) {
    const t = world.getComponent(e, Transform);
    const eC = world.getComponent(e, EntityContainer);
    if (t.y == 0 || t.y == Ctx2d.canvas.height - CardSpec.height) {
      eC.entities.length = 0;
    }
  }
}
async function handleDealer(world: World) {
  const dealersHand = 1;
  const split = splitHand(world);
  setButtonsActivation(world, false);
  if (split[dealersHand].length == 2) {
    world.getComponent(split[dealersHand][1], InHand).isRevealed = true;
    await sleep(1);
  }
  let value = calcHandValue(world, split[dealersHand]);
  while (value <= Game.dealerHitThreashold) {
    pickCard(world, false);
    const split = splitHand(world);
    value = calcHandValue(world, split[dealersHand]);
    await sleep(1);
  }
  setButtonsActivation(world, true);
  Game.status = checkWin(world);
  calculateCredits();
  if (Game.credits <= 0) {
    Game.status = GAME_STATUSES.GAME_OVER;
  }
}
function checkWin(world: World) {
  const split = splitHand(world);
  const playersHand = 0;
  const dealersHand = 1;
  const playersVal = calcHandValue(world, split[playersHand]);
  const dealersVal = calcHandValue(world, split[dealersHand]);
  if (Game.credits <= 0) return GAME_STATUSES.GAME_OVER;
  if (playersVal > Game.targetVal) return GAME_STATUSES.BUST;
  if (playersVal == dealersVal) return GAME_STATUSES.DRAW;
  if (dealersVal == 0 || playersVal == 0) return GAME_STATUSES.PLAY;
  if (playersVal == Game.targetVal && split[playersHand].length == 2)
    return GAME_STATUSES.BLACKJACK;
  if (dealersVal > playersVal && dealersVal <= Game.targetVal)
    return GAME_STATUSES.LOSE;
  if (
    (playersVal > dealersVal && playersVal <= Game.targetVal) ||
    dealersVal > Game.targetVal
  )
    return GAME_STATUSES.WIN;
  return GAME_STATUSES.PLAY;
}
function onGameOver() {
  Game.best = Game.best > Game.rounds ? Game.best : Game.rounds;
  localStorage.setItem("best_blackjack", Game.best.toString());
}
async function flipAnimation(t: typeof Transform, duration = 0.5) {
  const start = Time.timeSeconds;
  const originalScaleX = t.scaleX;
  while (Time.timeSeconds < start + duration) {
    t.scaleX =
      (originalScaleX *
        (Math.cos(((Time.timeSeconds - start) / duration) * Math.PI * 2) + 1)) /
      2;
    await sleep(1 / 30); // 30 fps
  }
}

// systems
function handleCard2Img(world: World) {
  for (const e of world.query({ and: [Card, Graphic] })) {
    const c = world.getComponent(e, Card);
    const g = world.getComponent(e, Graphic);
    g.image = Deck[c.value];
    if (!world.hasComponent(e, InHand)) {
      g.image = Deck["back"];
    } else if (!world.getComponent(e, InHand).isRevealed) {
      g.image = Deck["back"];
    }
  }
}
function handleDrawImages(world: World) {
  for (const e of world.query({ and: [Transform, Graphic] })) {
    const t = world.getComponent(e, Transform);
    const g = world.getComponent(e, Graphic);
    const c = Math.cos(t.rad);
    const s = Math.sin(t.rad);
    Ctx2d.ctx.transform(c, s, -s, c, t.x, t.y);
    Ctx2d.ctx.transform(t.scaleX, 0, 0, t.scaleY, 0, 0);
    Ctx2d.ctx.drawImage(g.image, 0, 0);
    Ctx2d.ctx.transform(1 / t.scaleX, 0, 0, 1 / t.scaleY, 0, 0);
    Ctx2d.ctx.transform(c, -s, s, c, c * -t.x + s * -t.y, -s * -t.x + c * -t.y);
  }
}
function handleCamera(world: World) {
  for (const e of world.query({ and: [Transform, Camera2D] })) {
    const t = world.getComponent(e, Transform);
    const cam = world.getComponent(e, Camera2D);
    const c = Math.cos(t.rad) * cam.zoom;
    const s = Math.sin(t.rad) * cam.zoom;
    Ctx2d.ctx.setTransform(c, s, -s, c, t.x, t.y);
  }
}
function handlePickCard(world: World) {
  const deck = world.query({ and: [Card], not: [InHand] });
  const graphics = world.query({ and: [Graphic], not: [Card] });
  const faceDownIndex = graphics.findIndex(
    (e) => (world.getComponent(e, Graphic).image = Deck["back"]),
  );
  if (deck.length > 0) {
    if (faceDownIndex == -1) {
      const facedDown = world.addEntity();
      world.addComponent(facedDown, Transform, {
        x: Game.deckX,
        y: Game.deckY,
      });
      world.addComponent(facedDown, Graphic, { image: Deck["back"] });
      return;
    }
    if (Game.status == GAME_STATUSES.PLAY) return;
    const t = world.getComponent(graphics[faceDownIndex], Transform);
    const g = world.getComponent(graphics[faceDownIndex], Graphic);
    let clicked = false;
    for (let i = 0, l = Pointers.x.length; i < l; i++) {
      const worldPos = screen2World(Pointers.x[i], Pointers.y[i]);
      if (
        !isPointInRect(
          worldPos.x,
          worldPos.y,
          t.x,
          t.y,
          g.image.width * t.scaleX,
          g.image.height * t.scaleY,
        )
      )
        continue;
      clicked = Pointers.justPressed[i];
      if (!clicked) continue;
      break;
    }
    if (!clicked) return;
    pickCard(world);
  } else {
    world.deleteEntity(graphics[faceDownIndex]);
  }
}
function handleCardVisibility(world: World) {
  for (const e of world.query({
    and: [Card, Transform, Graphic],
    not: [InHand, MovementTarget],
  })) {
    world.removeComponent(e, Transform);
    world.removeComponent(e, Graphic);
  }
}
function handleButtons(world: World) {
  const buttons = world.query({ and: [Button, Transform, Rect] });
  for (const e of buttons) {
    const b = world.getComponent(e, Button);
    b.hovered = b.isDown = b.justReleased = false;
  }
  for (let i = 0, l = Pointers.x.length; i < l; i++) {
    const worldPos = screen2World(Pointers.x[i], Pointers.y[i]);
    for (const e of buttons) {
      const b = world.getComponent(e, Button);
      if (!b.enabled) continue;
      const t = world.getComponent(e, Transform);
      const r = world.getComponent(e, Rect);
      const currentHovered = isPointInRect(
        worldPos.x,
        worldPos.y,
        t.x,
        t.y,
        r.w * t.scaleX,
        r.h * t.scaleY,
      );
      if (!currentHovered) continue;
      b.hovered ||= currentHovered;
      b.isDown ||= currentHovered && Pointers.isDown[i];
      b.justReleased ||=
        !b.isDown && currentHovered && Pointers.justReleased[i];
    }
  }
}
function handleCallbacks(world: World) {
  for (const e of world.query({ and: [Callback] })) {
    world.getComponent(e, Callback).callback(e);
  }
}
function handleDrawRects(world: World) {
  for (const e of world.query({ and: [Transform, Rect, Colour] })) {
    const t = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    const c = world.getComponent(e, Colour);
    Ctx2d.ctx.fillStyle = c.fill;
    Ctx2d.ctx.strokeStyle = c.stroke;
    Ctx2d.ctx.fillRect(t.x, t.y, r.w * t.scaleX, r.h * t.scaleY);
    Ctx2d.ctx.strokeRect(t.x, t.y, r.w * t.scaleX, r.h * t.scaleY);
  }
}
function handleMoveTargets(world: World) {
  for (const e of world.query({ and: [Transform, MovementTarget] })) {
    const t = world.getComponent(e, Transform);
    const mt = world.getComponent(e, MovementTarget);
    const v = world.addComponent(e, Velocity);
    const dx = mt.x - t.x;
    const dy = mt.y - t.y;
    const distance = (dx * dx + dy * dy) ** 0.5;
    v.x = (dx / distance) * Game.cardSpeed;
    v.y = (dy / distance) * Game.cardSpeed;
    if (distance > Game.cardSpeed * Time.dtSeconds) continue;
    v.x = v.y = 0;
    t.x = mt.x;
    t.y = mt.y;
    world.removeComponent(e, MovementTarget);
    world.removeComponent(e, Velocity);
  }
}
function handleMovement(world: World) {
  for (const e of world.query({ and: [Transform, Velocity] })) {
    const t = world.getComponent(e, Transform);
    const v = world.getComponent(e, Velocity);
    t.x += v.x * Time.dtSeconds;
    t.y += v.y * Time.dtSeconds;
  }
}
function handleDrawText(world: World) {
  for (const e of world.query({ and: [Text, Transform] })) {
    const text = world.getComponent(e, Text);
    const t = world.getComponent(e, Transform);
    const split = text.content.split("\n");
    Ctx2d.ctx.fillStyle = "white";
    Ctx2d.ctx.font = text.font;
    const textMetrics = Ctx2d.ctx.measureText(text.content);
    for (let i = 0, l = split.length; i < l; i++) {
      Ctx2d.ctx.fillText(
        split[i],
        t.x,
        t.y + textMetrics.actualBoundingBoxAscent * (i + 1),
      );
    }
  }
}
function handleContainers(world: World) {
  for (const e of world.query({
    and: [Transform, HorizontalContainer, EntityContainer],
  })) {
    const t = world.getComponent(e, Transform);
    const hC = world.getComponent(e, HorizontalContainer);
    const eC = world.getComponent(e, EntityContainer);
    // Ctx2d.ctx.fillRect(t.x, t.y, hC.width * t.scaleX, 1);
    const padX = hC.padding * t.scaleX;
    const padY = hC.padding * t.scaleY;
    const width = (hC.width - padX * 2) * t.scaleX;
    let childrenTotalWidth = padX * t.scaleX * (eC.entities.length - 1);
    let lastWidth = 0;
    for (const child of eC.entities) {
      const childTransform = world.getComponent(child, Transform);
      let childWidth = 0;
      if (world.hasComponent(child, Graphic)) {
        childWidth = world.getComponent(child, Graphic).image.width;
      }
      if (world.hasComponent(child, Rect)) {
        childWidth = world.getComponent(child, Rect).w;
      }
      childWidth *= childTransform.scaleX;
      childrenTotalWidth += childWidth;
      lastWidth = childWidth;
    }
    const needToStack = childrenTotalWidth > width;
    let startX = needToStack
      ? t.x + padX * t.scaleX
      : t.x + hC.width / 2 - childrenTotalWidth / 2;
    for (let i = 0, children = eC.entities, l = children.length; i < l; i++) {
      const childTransform = world.getComponent(children[i], Transform);
      let childWidth = 0;
      if (world.hasComponent(children[i], Graphic)) {
        childWidth = world.getComponent(children[i], Graphic).image.width;
      }
      if (world.hasComponent(children[i], Rect)) {
        childWidth = world.getComponent(children[i], Rect).w;
      }
      childWidth *= childTransform.scaleX;
      world.addComponent(children[i], MovementTarget, {
        x: startX + (needToStack ? ((width - lastWidth) / (l - 1)) * i : 0),
        y: t.y + padY,
      });
      startX += needToStack ? 0 : childWidth + padX;
    }
  }
}
function drawPointers() {
  Ctx2d.ctx.beginPath();
  for (let i = 0, l = Pointers.x.length; i < l; i++) {
    const worldPos = screen2World(Pointers.x[i], Pointers.y[i]);
    Ctx2d.ctx.moveTo(worldPos.x, worldPos.y);
    Ctx2d.ctx.arc(worldPos.x, worldPos.y, 10, 0, Math.PI * 2);
  }
  Ctx2d.ctx.fill();
}

// components
const Text = { content: "placeholder", font: "" };
const Transform = { x: 0, y: 0, rad: 0, scaleX: 1, scaleY: 1 };
const Graphic = { image: new Image() };
const Camera2D = { zoom: 1 };
const Card: { value: keyof typeof Deck } = { value: "back" };
const InHand = { isPlayer: true, isRevealed: true };
const Button = {
  hovered: false,
  justReleased: false,
  isDown: false,
  enabled: true,
};
const Colour = { fill: "", stroke: "" };
const Rect = { w: 10, h: 10 };
const Callback = { callback: (_: entityT) => {} };
const MovementTarget = { x: 0, y: 0 };
const Velocity = { x: 0, y: 0 };
const HorizontalContainer = { width: 100, padding: 0 };
const EntityContainer: { entities: entityT[] } = { entities: [] };

// entities
function setUpCardContainers(world: World) {
  const playerContainer = world.addEntity();
  world.addComponent(playerContainer, Transform, {
    x: Ctx2d.canvas.width * 0.3,
    y: Ctx2d.canvas.height - CardSpec.height,
  });
  world.addComponent(playerContainer, HorizontalContainer, {
    width: Ctx2d.canvas.width * 0.65,
  });
  world.addComponent(playerContainer, EntityContainer, { entities: [] });
  const dealerContainer = world.addEntity();
  world.addComponent(dealerContainer, Transform, {
    x: Ctx2d.canvas.width * 0.3,
    y: 0,
  });
  world.addComponent(dealerContainer, HorizontalContainer, {
    width: Ctx2d.canvas.width * 0.65,
  });
  world.addComponent(dealerContainer, EntityContainer, { entities: [] });
}
function setUpButtons(world: World) {
  function buttonStyle(b: typeof Button, c: typeof Colour) {
    c.fill = b.enabled ? "#00000069" : "#00000020";
    c.stroke = b.hovered ? "white" : "transparent";
  }
  const buttons: { [name: string]: (_: entityT) => void } = {
    "bet /2": (e) => {
      const b = world.getComponent(e, Button);
      b.enabled =
        Game.status != GAME_STATUSES.PLAY &&
        Game.status != GAME_STATUSES.GAME_OVER;
      buttonStyle(b, world.getComponent(e, Colour));
      if (b.justReleased) {
        Game.bet /= 2;
        Game.bet = Math.round(Game.bet);
        Game.bet = Math.max(Game.minBet, Game.bet);
      }
    },
    "bet *2": (e) => {
      const b = world.getComponent(e, Button);
      b.enabled =
        Game.status != GAME_STATUSES.PLAY &&
        Game.status != GAME_STATUSES.GAME_OVER;
      buttonStyle(b, world.getComponent(e, Colour));
      if (b.justReleased) {
        Game.bet *= 2;
        Game.bet = Math.max(Math.min(Game.bet, Game.credits), Game.minBet);
      }
    },
    hit: (e) => {
      const b = world.getComponent(e, Button);
      buttonStyle(b, world.getComponent(e, Colour));
      if (b.justReleased) {
        if (Game.status == GAME_STATUSES.GAME_OVER) {
          onGameOver();
          resetGame(world);
        }
        if (Game.status != GAME_STATUSES.PLAY) {
          resumeGame(world);
        }
        pickCard(world);
        if (checkWin(world) == GAME_STATUSES.BUST) {
          Game.status = GAME_STATUSES.BUST;
          calculateCredits();
        }
        if (Game.credits <= 0) {
          Game.status = GAME_STATUSES.GAME_OVER;
        }
      }
    },
    stand: (e) => {
      const b = world.getComponent(e, Button);
      b.enabled &&= Game.status == GAME_STATUSES.PLAY;
      buttonStyle(b, world.getComponent(e, Colour));
      if (b.justReleased) {
        const split = splitHand(world);
        const playersHand = 0;
        if (split[playersHand].length == 0) return;
        handleDealer(world);
      }
    },
  };
  const w = 100;
  const h = 100;
  const leftpadPercent = 0.2;
  const x = Ctx2d.canvas.width * leftpadPercent;
  const y = Ctx2d.canvas.height / 2 - h / 2;
  const padding = 5;
  const buttonContainer = world.addEntity();
  world.addComponent(buttonContainer, Transform, { x, y });
  world.addComponent(buttonContainer, HorizontalContainer, {
    width: Ctx2d.canvas.width * (1 - leftpadPercent),
    padding,
  });
  const eC = world.addComponent(buttonContainer, EntityContainer, {
    entities: [],
  });
  for (const name in buttons) {
    eC.entities.push(addButton(world, name, 0, 0, w, h, buttons[name]));
  }
}
function addButton(
  world: World,
  labal: string,
  x: number,
  y: number,
  w: number,
  h: number,
  callback = (_: entityT) => {},
) {
  const button = world.addEntity();
  world.addComponent(button, Transform, { x, y });
  world.addComponent(button, Callback, { callback });
  world.addComponent(button, Rect, { w, h });
  world.addComponent(button, Button);
  world.addComponent(button, Text, { content: labal, font: "35px sans-serif" });
  world.addComponent(button, Colour, {
    fill: "#00000069",
    stroke: "transparent",
  });
  return button;
}
function addCard(world: World, value: keyof typeof Deck) {
  const card = world.addEntity();
  world.addComponent(card, Card, { value });
  return card;
}

// singletons
const Pointers = setUpPointers();
const Ctx2d = setUpCanvas();
const Time = setUpTime();
const CardSpec = {
  width: 1 * 200,
  height: 1.43 * 200,
  round: 0.05 * 200,
};
const Deck = generateDeck(CardSpec.width, CardSpec.height, CardSpec.round);
const CardValues: Record<keyof typeof Deck, number[]> = {
  "hearts-A": [1, 11],
  "hearts-2": [2],
  "hearts-3": [3],
  "hearts-4": [4],
  "hearts-5": [5],
  "hearts-6": [6],
  "hearts-7": [7],
  "hearts-8": [8],
  "hearts-9": [9],
  "hearts-10": [10],
  "hearts-J": [10],
  "hearts-Q": [10],
  "hearts-K": [10],
  "spades-A": [1, 11],
  "spades-2": [2],
  "spades-3": [3],
  "spades-4": [4],
  "spades-5": [5],
  "spades-6": [6],
  "spades-7": [7],
  "spades-8": [8],
  "spades-9": [9],
  "spades-10": [10],
  "spades-J": [10],
  "spades-Q": [10],
  "spades-K": [10],
  "clubs-A": [1, 11],
  "clubs-2": [2],
  "clubs-3": [3],
  "clubs-4": [4],
  "clubs-5": [5],
  "clubs-6": [6],
  "clubs-7": [7],
  "clubs-8": [8],
  "clubs-9": [9],
  "clubs-10": [10],
  "clubs-J": [10],
  "clubs-Q": [10],
  "clubs-K": [10],
  "diamonds-A": [1, 11],
  "diamonds-2": [2],
  "diamonds-3": [3],
  "diamonds-4": [4],
  "diamonds-5": [5],
  "diamonds-6": [6],
  "diamonds-7": [7],
  "diamonds-8": [8],
  "diamonds-9": [9],
  "diamonds-10": [10],
  "diamonds-J": [10],
  "diamonds-Q": [10],
  "diamonds-K": [10],
  back: [0],
};
const enum GAME_STATUSES {
  PLAY,
  BLACKJACK,
  BUST,
  DRAW,
  LOSE,
  WIN,
  GAME_OVER,
}
const Game = {
  width: 900,
  height: 600,
  deckX: 20,
  deckY: 600 / 2 - 150,
  cardSpeed: 3000,
  credits: 100,
  bet: 0,
  minBet: 10,
  best: 0,
  rounds: 0,
  roundsTilBetIncrease: 5,
  betIncreaseExponent: 1.1,
  targetVal: 21,
  dealerHitThreashold: 16,
  status: GAME_STATUSES.PLAY,
};
const StatusStrings: Record<GAME_STATUSES, string> = {
  [GAME_STATUSES.PLAY]: "",
  [GAME_STATUSES.BLACKJACK]: "Blackjack",
  [GAME_STATUSES.BUST]: "Bust",
  [GAME_STATUSES.DRAW]: "Draw",
  [GAME_STATUSES.LOSE]: "Lose",
  [GAME_STATUSES.WIN]: "Win",
  [GAME_STATUSES.GAME_OVER]: "Game Over",
};

Ctx2d.canvas.width = Game.width;
Ctx2d.canvas.height = Game.height;

const game = new World();

for (const card in Deck) {
  if ((card as keyof typeof Deck) == "back") continue;
  addCard(game, card as keyof typeof Deck);
}

const cam = game.addEntity();
game.addComponent(cam, Transform);
game.addComponent(cam, Camera2D, { zoom: 1 });

const gameText = game.addEntity();
game.addComponent(gameText, Transform);
const gameTextComp = game.addComponent(gameText, Text, {
  font: "40px sans-serif",
});

setUpButtons(game);
setUpCardContainers(game);
resetGame(game);

{
  (function loop() {
    Ctx2d.ctx.resetTransform();
    Ctx2d.ctx.fillStyle = "#424242";
    Ctx2d.ctx.fillRect(0, 0, Ctx2d.canvas.width, Ctx2d.canvas.height);

    gameTextComp.content = `Credits: ${Game.credits}\nBet: ${Game.bet}\nRound ${Game.rounds + 1}, Best: ${Game.best + 1}\n${StatusStrings[Game.status]}\n\n\n\n\n\n\n\n\n\n\n\n\n\nNext min bet: ${Math.ceil(Game.minBet ** Game.betIncreaseExponent)}\nRounds until min bet increases: ${
      Game.roundsTilBetIncrease - (Game.rounds % Game.roundsTilBetIncrease) - 1
    }`;

    // drawing
    game.update([
      handleCamera,
      handleDrawImages,
      handleDrawRects,
      handleDrawText,
    ]);

    drawPointers();

    // process
    game.update([
      handleContainers,
      handleCardVisibility,
      handlePickCard,
      handleCard2Img,
      handleButtons,
      handleMoveTargets,
      handleCallbacks,
      handleMovement,
    ]);

    updateTime(Time);
    updatePointers(Pointers);
    requestAnimationFrame(loop);
  })();
}
