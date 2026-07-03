function roundRectQuarter(
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const path = new Path2D();
  path.moveTo(x + w / 2, y);
  path.arcTo(x + w, y, x + w, y + h / 2, radius);
  path.lineTo(x + w, y + h / 2);
  return path;
}
function drawCardSuits(): {
  hearts: Path2D;
  spades: Path2D;
  clubs: Path2D;
  diamonds: Path2D;
} {
  const paths: {
    hearts: Path2D;
    spades: Path2D;
    clubs: Path2D;
    diamonds: Path2D;
  } = {
    hearts: new Path2D(),
    spades: new Path2D(),
    clubs: new Path2D(),
    diamonds: new Path2D(),
  };
  const symbolMargin = 1;
  {
    const path = paths["hearts"];
    const c = Math.cos(Math.PI / 4);
    const s = Math.sin(Math.PI / 4);
    let x = symbolMargin / 4;
    const y = symbolMargin / 4;
    const r = symbolMargin / 4;
    path.arc(x, y, r, 0, Math.PI * 2);
    path.arc(x + symbolMargin / 2, y, r, 0, Math.PI * 2);
    path.moveTo(x + -s * r, y + c * r);
    path.lineTo(symbolMargin / 2, symbolMargin);
    x += symbolMargin / 2;
    path.lineTo(x + c * r, y + s * r);
  }
  {
    const path = paths["spades"];
    const x = symbolMargin / 4;
    const y = symbolMargin / 2;
    const r = symbolMargin / 4;
    const c = Math.cos(Math.PI / 4);
    const s = Math.sin(Math.PI / 4);
    path.arc(x, y, r, 0, Math.PI * 2);
    path.arc(x + symbolMargin / 2, y, r, 0, Math.PI * 2);
    path.moveTo(x + c * -r, y + s * -r);
    path.lineTo(symbolMargin / 2, 0);
    path.lineTo(x + symbolMargin / 2 + -s * -r, y + c * -r);
    path.moveTo(symbolMargin / 2, y);
    path.lineTo(x + symbolMargin / 8, symbolMargin);
    path.lineTo((symbolMargin / 8) * 5, symbolMargin);
    path.closePath();
  }
  {
    // credits: https://en.wikipedia.org/wiki/Rhombus#Inradius
    const path = paths["diamonds"];
    const inradius =
      (symbolMargin * (symbolMargin - symbolMargin / 4)) /
      (2 * (symbolMargin ** 2 + (symbolMargin - symbolMargin / 4) ** 2) ** 0.5);
    path.arc(symbolMargin / 2, symbolMargin / 2, inradius, 0, Math.PI * 2);
    path.moveTo(symbolMargin / 2, 0);
    path.lineTo(symbolMargin / 8, symbolMargin / 2);
    path.lineTo(symbolMargin / 2, symbolMargin);
    path.lineTo(symbolMargin - symbolMargin / 8, symbolMargin / 2);
    path.closePath();
  }
  {
    const path = paths["clubs"];
    const x = symbolMargin / 4;
    const y = symbolMargin / 2;
    const r = symbolMargin / 4;
    path.arc(symbolMargin / 2, r, r, 0, Math.PI * 2);
    path.arc(x, y, r, 0, Math.PI * 2);
    path.arc(x + symbolMargin / 2, y, r, 0, Math.PI * 2);
    path.moveTo(symbolMargin / 2, y);
    path.lineTo(x + symbolMargin / 8, symbolMargin);
    path.lineTo((symbolMargin / 8) * 5, symbolMargin);
    path.closePath();
  }
  return paths;
}
function drawCard(
  cardWidth = 1,
  cardHeight = 1.43,
  cardRound = 0.05,
  symbol: "hearts" | "spades" | "diamonds" | "clubs",
  text: string,
  paths: Record<typeof symbol, Path2D>,
  ctx: CanvasRenderingContext2D,
  isBack = false,
) {
  const cardPadding = cardWidth * 0.03;
  const symbolMargin = cardWidth / 2;

  // rotation
  const c = Math.cos(Math.PI);
  const s = Math.sin(Math.PI);
  const x = cardWidth;
  const y = cardHeight;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // card body
  ctx.fillStyle = "lightgrey";
  ctx.beginPath();
  ctx.roundRect(0, 0, cardWidth, cardHeight, cardRound);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.stroke();
  if (isBack) {
    ctx.fillStyle = "darkgrey";
  } else {
    ctx.fillStyle = "silver";
  }
  ctx.beginPath();
  ctx.roundRect(
    cardPadding,
    cardPadding,
    cardWidth - cardPadding * 2,
    cardHeight - cardPadding * 2,
    cardRound,
  );
  ctx.fill();
  if (isBack) {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "silver";
    ctx.lineWidth = cardWidth * 0.05;
    const path = new Path2D();
    for (let i = cardHeight / 2; i > 0; i -= ctx.lineWidth * 2) {
      path.ellipse(cardWidth * 0.5, 0, cardWidth * 0.5, i, 0, 0, Math.PI);
    }
    ctx.setTransform(c, s, -s, c, x, y);
    ctx.transform(1, 0, 0, 1, cardWidth / 2, 0);
    ctx.stroke(path);
    ctx.transform(c, s, -s, c, x, y);
    ctx.stroke(path);
    ctx.transform(1, 0, 0, 1, cardWidth, 0);
    ctx.stroke(path);
    ctx.transform(c, s, -s, c, x, y);
    ctx.stroke(path);
    ctx.resetTransform();
    ctx.restore();
  }

  ctx.strokeStyle = "gold";
  ctx.fillStyle = "gold";

  // decorative lines
  if (!isBack) {
    {
      ctx.lineWidth = cardWidth / 30;
      const path = new Path2D();
      path.moveTo(cardPadding, cardHeight * 0.7 + cardPadding);
      path.arcTo(
        cardPadding,
        cardHeight - cardPadding,
        cardWidth * 0.3 - cardPadding,
        cardHeight - cardPadding,
        ctx.lineWidth,
      );
      path.lineTo(cardWidth * 0.3 - cardPadding, cardHeight - cardPadding);
      ctx.stroke(path);
      ctx.transform(c, s, -s, c, x, y);
      ctx.stroke(path);
      ctx.resetTransform();
    }
    {
      ctx.lineWidth = cardWidth / 100;
      const path = new Path2D();
      path.moveTo(cardPadding * 2, cardHeight * 0.7 + cardPadding * 2);
      path.arcTo(
        cardPadding * 2,
        cardHeight - cardPadding * 2,
        cardWidth * 0.3 - cardPadding * 2,
        cardHeight - cardPadding * 2,
        ctx.lineWidth,
      );
      path.lineTo(
        cardWidth * 0.3 - cardPadding * 2,
        cardHeight - cardPadding * 2,
      );
      ctx.stroke(path);
      ctx.transform(c, s, -s, c, x, y);
      ctx.stroke(path);
      ctx.resetTransform();
    }
  } else {
    ctx.lineWidth = cardWidth / 30;
    const path = roundRectQuarter(
      cardPadding,
      cardPadding,
      cardWidth - cardPadding * 2,
      cardHeight - cardPadding * 2,
      ctx.lineWidth,
    );
    ctx.stroke(path);
    ctx.setTransform(c, s, -s, c, x, y);
    ctx.stroke(path);
    ctx.resetTransform();

    ctx.lineWidth = cardWidth / 100;
    ctx.roundRect(
      cardPadding * 2,
      cardPadding * 2,
      cardWidth - cardPadding * 4,
      cardHeight - cardPadding * 4,
      ctx.lineWidth,
    );
    ctx.stroke();
  }

  // draw suits and ranks
  ctx.lineWidth = cardWidth / 10000;
  ctx.transform(symbolMargin, 0, 0, symbolMargin, cardPadding, cardPadding);
  if (!isBack) ctx.stroke(paths[symbol]);
  ctx.resetTransform();
  ctx.font = `${cardWidth / 2.5}px sans-serif`;
  const textMetrics = ctx.measureText(text);
  ctx.fillText(
    text,
    (cardWidth - cardPadding * 2) / 4 - textMetrics.width / 2 + cardPadding,
    cardHeight / 2 + textMetrics.actualBoundingBoxAscent,
  );
  ctx.transform(c, s, -s, c, x, y);
  ctx.fillText(
    text,
    (cardWidth - cardPadding * 2) / 4 - textMetrics.width / 2 + cardPadding,
    cardHeight / 2 + textMetrics.actualBoundingBoxAscent,
  );
  ctx.transform(symbolMargin, 0, 0, symbolMargin, cardPadding, cardPadding);
  if (!isBack) ctx.stroke(paths[symbol]);
  ctx.resetTransform();
  ctx.restore();
}
export function generateDeck(
  cardWidth = 1,
  cardHeight = 1.43,
  cardRound = 0.05,
) {
  const suits = drawCardSuits();
  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ] as const;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("cannot initialize 2d context.");
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const suitNames = Object.keys(suits);
  const deck: Record<string, HTMLImageElement> = {};
  drawCard(cardWidth, cardHeight, cardRound, "hearts", "", suits, ctx, true);
  const cardBack = new Image();
  cardBack.src = canvas.toDataURL();
  deck["back"] = cardBack;
  for (let i = 0, l = suitNames.length * ranks.length; i < l; i++) {
    const suitIndex = Math.floor(i / ranks.length);
    const rankIndex = i % ranks.length;
    drawCard(
      cardWidth,
      cardHeight,
      cardRound,
      suitNames[suitIndex] as keyof typeof suits,
      ranks[rankIndex],
      suits,
      ctx,
    );
    const img = new Image();
    img.src = canvas.toDataURL();
    deck[`${suitNames[suitIndex]}-${ranks[rankIndex]}`] = img;
  }
  return deck as Record<
    `${keyof typeof suits}-${(typeof ranks)[number]}` | "back",
    HTMLImageElement
  >;
}
