export type QtreeRect = {
  width: number;
  height: number;
  x: number;
  y: number;
  rad?: number;
};
export type QtreeLine = { x1: number; y1: number; x2: number; y2: number };
export type QtreeCircle = { x: number; y: number; radius: number };
export type QtreePoint = { x: number; y: number };
export type QtreeShapes = QtreeRect | QtreeCircle | QtreeLine | QtreePoint;

/**
 * using vector representation of Line {x1, y1, x2, y2}, calculates x in origin {x1, y1} + x * dir {x2 - x1, y2 - y1}, which gives the point that Point {px, py} intersects perpendicularly
 */
export function perpendicularCoefficient(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  px: number,
  py: number,
): number {
  // dot product / (line mag * line mag)
  return (
    ((x2 - x1) * (px - x1) + (y2 - y1) * (py - y1)) /
    ((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
  );
}

export function rectContainShape(a: QtreeRect, b: QtreeShapes): boolean {
  if (isRect(b)) {
    return rectContainRect(a, b);
  } else if (isLine(b)) {
    return rectContainLine(a, b);
  } else if (isCircle(b)) {
    return rectContainCircle(a, b);
  } else if (isPoint(b)) {
    return rectContainPoint(a, b);
  }
  return false;
}
export function rectIntersectShape(a: QtreeRect, b: QtreeShapes): boolean {
  if (isRect(b)) {
    return rectIntersectRect(a, b);
  } else if (isCircle(b)) {
    return rectIntersectCircle(a, b);
  } else if (isLine(b)) {
    return rectIntersectLine(a, b);
  } else if (isPoint(b)) {
    return rectContainPoint(a, b);
  }
  return false;
}
export function rectContainRect(a: QtreeRect, b: QtreeRect): boolean {
  if (a.width * a.height < b.width * b.height) return false;
  const cosA = a.rad ? Math.cos(a.rad) : 1;
  const cosB = b.rad ? Math.cos(b.rad) : 1;
  const sinA = a.rad ? Math.sin(a.rad) : 0;
  const sinB = b.rad ? Math.sin(b.rad) : 0;
  let contained = true;
  for (let i = 0; i < 4; i++) {
    const pointX =
      b.x + b.width * cosB * (i % 2) + b.height * -sinB * Math.floor(i / 2);
    const pointY =
      b.y + b.width * sinB * (i % 2) + b.height * cosB * Math.floor(i / 2);
    let coeff = perpendicularCoefficient(
      a.x,
      a.y,
      a.x + a.width * cosA,
      a.y + a.width * sinA,
      pointX,
      pointY,
    );
    contained &&= coeff > 0 && coeff < 1;
    coeff = perpendicularCoefficient(
      a.x,
      a.y,
      a.x + a.height * -sinA,
      a.y + a.height * cosA,
      pointX,
      pointY,
    );
    contained &&= coeff > 0 && coeff < 1;
    if (!contained) break;
  }
  return contained;
}
export function rectIntersectRect(a: QtreeRect, b: QtreeRect): boolean {
  const cosA = a.rad ? Math.cos(a.rad) : 1;
  const cosB = b.rad ? Math.cos(b.rad) : 1;
  const sinA = a.rad ? Math.sin(a.rad) : 0;
  const sinB = b.rad ? Math.sin(b.rad) : 0;
  let intersected = false;
  let r1 = a;
  let r2 = b;
  let cos1 = cosA;
  let cos2 = cosB;
  let sin1 = sinA;
  let sin2 = sinB;
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 4; i++) {
      const pointX =
        r2.x +
        r2.width * cos2 * (i % 2) +
        r2.height * -sin2 * Math.floor(i / 2);
      const pointY =
        r2.y + r2.width * sin2 * (i % 2) + r2.height * cos2 * Math.floor(i / 2);
      const coeffX = perpendicularCoefficient(
        r1.x,
        r1.y,
        r1.x + r1.width * cos1,
        r1.y + r1.width * sin1,
        pointX,
        pointY,
      );
      const coeffY = perpendicularCoefficient(
        r1.x,
        r1.y,
        r1.x + r1.height * -sin1,
        r1.y + r1.height * cos1,
        pointX,
        pointY,
      );
      intersected ||= coeffX >= 0 && coeffX <= 1 && coeffY >= 0 && coeffY <= 1;
      if (intersected) break;
    }
    if (intersected) break;
    r1 = b;
    r2 = a;
    cos1 = cosB;
    cos2 = cosA;
    sin1 = sinB;
    sin2 = sinA;
  }
  return intersected;
}
export function rectIntersectRay(a: QtreeRect, b: QtreeLine): boolean {
  // credit: https://stackoverflow.com/questions/10906381/how-to-find-out-if-a-ray-intersects-a-rectangle
  const normalX = b.y2 - b.y1;
  const normalY = b.x1 - b.x2;
  const cos = a.rad ? Math.cos(a.rad) : 1;
  const sin = a.rad ? Math.sin(a.rad) : 0;
  let prev = -2;
  for (let i = 0; i < 4; i++) {
    const dot =
      (a.x +
        a.width * cos * (i % 2) +
        a.height * -sin * Math.floor(i / 2) +
        -b.x1) *
        normalX +
      (a.y +
        a.width * sin * (i % 2) +
        a.height * cos * Math.floor(i / 2) +
        -b.y1) *
        normalY;
    if (prev != -2 && prev * dot < 0) return true;
    prev = dot;
  }
  return false;
}
export function lineIntersectRay(
  QtreeLine: QtreeLine,
  ray: QtreeLine,
): boolean {
  const d =
    (ray.x2 - ray.x1) * (QtreeLine.y2 - QtreeLine.y1) -
    (QtreeLine.x2 - QtreeLine.x1) * (ray.y2 - ray.y1);
  if (d == 0) return false;
  const t =
    (1 / d) *
    -(
      -(QtreeLine.x1 - ray.x1) * (ray.y2 - ray.y1) +
      (QtreeLine.y1 - ray.y1) * (ray.x2 - ray.x1)
    );
  return t >= 0 && t <= 1;
}
export function pointIntersectRay(a: QtreePoint, b: QtreeLine): boolean {
  const t = (a.x - b.x1) / (b.x2 - b.x1);
  const u = (a.y - b.y1) / (b.y2 - b.y1);
  return t == u && t >= 0;
}
export function pointIntersectPoint(a: QtreePoint, b: QtreePoint): boolean {
  return a.x == b.x && a.y == b.y;
}
export function circleIntersectRay(a: QtreeCircle, b: QtreeLine): boolean {
  const t = perpendicularCoefficient(b.x1, b.y1, b.x2, b.x2, a.x, a.y);
  const x = b.x1 + t * (b.x2 - b.x1);
  const y = b.y1 + t * (b.y2 - b.y1);
  return (
    t >= 0 &&
    (a.x - x) * (a.x - x) + (a.y - y) * (a.y - y) <= a.radius * a.radius
  );
}
export function RayIntersectShape(a: QtreeLine, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleIntersectRay(b, a);
  } else if (isRect(b)) {
    return rectIntersectRay(b, a);
  } else if (isLine(b)) {
    return lineIntersectRay(a, b);
  } else if (isPoint(b)) {
    return pointIntersectRay(b, a);
  }
  return false;
}
export function rectContainCircle(a: QtreeRect, b: QtreeCircle): boolean {
  const cos = a.rad ? Math.cos(a.rad) : 1;
  const sin = a.rad ? Math.sin(a.rad) : 0;
  const circleXTransformed = (b.x - a.x) * cos + (b.y - a.y) * sin;
  const circleYTransformed = (b.x - a.x) * -sin + (b.y - a.y) * cos;
  return (
    (a.width / 2 - circleXTransformed) ** 2 < (a.width / 2 - b.radius) ** 2 &&
    (a.height / 2 - circleYTransformed) ** 2 < (a.height / 2 - b.radius) ** 2
  );
}
export function rectIntersectCircle(a: QtreeRect, b: QtreeCircle): boolean {
  const cos = a.rad ? Math.cos(a.rad) : 1;
  const sin = a.rad ? Math.sin(a.rad) : 0;
  const t = perpendicularCoefficient(
    a.x,
    a.y,
    a.x + a.width * cos,
    a.y + a.width * sin,
    b.x,
    b.y,
  );
  const u = perpendicularCoefficient(
    a.x,
    a.y,
    a.x + a.height * -sin,
    a.y + a.height * cos,
    b.x,
    b.y,
  );
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  const circleXTransformed = (b.x - a.x) * cos + (b.y - a.y) * sin;
  const circleYTransformed = (b.x - a.x) * -sin + (b.y - a.y) * cos;
  if (
    (Math.abs(a.width / 2 - circleXTransformed) - a.width / 2) ** 2 +
      (Math.abs(a.height / 2 - circleYTransformed) - a.height / 2) ** 2 <
    b.radius * b.radius
  )
    return true;
  return false;
}
export function rectContainLine(a: QtreeRect, b: QtreeLine): boolean {
  const cos = a.rad ? Math.cos(a.rad) : 1;
  const sin = a.rad ? Math.sin(a.rad) : 0;
  const x1 = (b.x1 - a.x) * cos + (b.y1 - a.y) * sin;
  const y1 = (b.x1 - a.x) * -sin + (b.y1 - a.y) * cos;
  const x2 = (b.x2 - a.x) * cos + (b.y2 - a.y) * sin;
  const y2 = (b.x2 - a.x) * -sin + (b.y2 - a.y) * cos;
  return (
    (a.width / 2 - x1) ** 2 < (a.width / 2) ** 2 &&
    (a.width / 2 - x2) ** 2 < (a.width / 2) ** 2 &&
    (a.height / 2 - y1) ** 2 < (a.height / 2) ** 2 &&
    (a.height / 2 - y2) ** 2 < (a.height / 2) ** 2
  );
}
export function lineIntersectLine(a: QtreeLine, b: QtreeLine): boolean {
  // credit: https://stackoverflow.com/questions/4977491/determining-if-two-QtreeLine-segments-intersect/4977569#4977569
  const d = (b.x2 - b.x1) * (a.y2 - a.y1) - (a.x2 - a.x1) * (b.y2 - b.y1);
  if (d == 0) return false;
  const s =
    (1 / d) * ((a.x1 - b.x1) * (a.y2 - a.y1) - (a.y1 - b.y1) * (a.x2 - a.x1));
  const t =
    (1 / d) * -(-(a.x1 - b.x1) * (b.y2 - b.y1) + (a.y1 - b.y1) * (b.x2 - b.x1));
  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}
export function lineIntersectPoint(a: QtreeLine, b: QtreePoint): boolean {
  // checks if point is on the line AND within line segment.
  const t = (b.x - a.x1) / (a.x2 - a.x1);
  const u = (b.y - a.y1) / (a.y2 - a.y1);
  return t == u && t >= 0 && t <= 1;
}
function _rectContainPoint(rect: QtreeRect, x: number, y: number): boolean {
  const cos = rect.rad ? Math.cos(rect.rad) : 1;
  const sin = rect.rad ? Math.sin(rect.rad) : 0;
  return (
    (rect.width / 2 - ((x - rect.x) * cos + (y - rect.y) * sin)) ** 2 <=
      (rect.width / 2) ** 2 &&
    (rect.height / 2 - ((x - rect.x) * -sin + (y - rect.y) * cos)) ** 2 <=
      (rect.height / 2) ** 2
  );
}
export function rectContainPoint(a: QtreeRect, b: QtreePoint): boolean {
  return _rectContainPoint(a, b.x, b.y);
}
export function rectIntersectLine(a: QtreeRect, b: QtreeLine): boolean {
  // checks if either points of the QtreeLine lies within QtreeRect
  const cos = a.rad ? Math.cos(a.rad) : 1;
  const sin = a.rad ? Math.sin(a.rad) : 0;
  const side: QtreeLine = { x1: 0, y1: 0, x2: 0, y2: 0 };
  for (let i = 0; i < 4; i++) {
    side.x1 =
      a.x +
      a.width * cos * +(i == 1 || i == 2) +
      a.height * -sin * Math.floor(i / 2);
    side.y1 =
      a.y +
      a.width * sin * +(i == 1 || i == 2) +
      a.height * cos * Math.floor(i / 2);
    side.x2 = a.x + a.width * +(i < 2) + a.height * cos * +(i == 1 || i == 2);
    side.y2 =
      a.y + a.width * sin * +(i < 2) + a.height * sin * +(i == 1 || i == 2);
    if (!lineIntersectLine(side, b)) continue;
    return true;
  }
  return false;
}
export function circleIntersectLine(a: QtreeCircle, b: QtreeLine): boolean {
  const t = perpendicularCoefficient(b.x1, b.y1, b.x2, b.y2, a.x, a.y);
  const x = b.x1 + t * (b.x2 - b.x1);
  const y = b.y1 + t * (b.y2 - b.y1);
  const ratio = Math.sqrt(
    (a.radius * a.radius) /
      ((b.x2 - b.x1) * (b.x2 - b.x1) + (b.y2 - b.y1) * (b.y2 - b.y1)),
  );
  return t >= -ratio && t <= 1 + ratio && x * x + y * y <= a.radius * a.radius;
}
export function circleIntersectCircle(a: QtreeCircle, b: QtreeCircle): boolean {
  return (
    (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) <
    (a.radius + b.radius) * (a.radius + b.radius)
  );
}
export function circleContainPoint(a: QtreeCircle, b: QtreePoint): boolean {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= a.radius ** 2;
}
export function circleIntersectShape(a: QtreeCircle, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleIntersectCircle(a, b);
  } else if (isLine(b)) {
    return circleIntersectLine(a, b);
  } else if (isRect(b)) {
    return rectIntersectCircle(b, a);
  } else if (isPoint(b)) {
    return circleContainPoint(a, b);
  }
  return false;
}
export function lineIntersectShape(a: QtreeLine, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleIntersectLine(b, a);
  } else if (isLine(b)) {
    return lineIntersectLine(a, b);
  } else if (isRect(b)) {
    return rectIntersectLine(b, a);
  } else if (isPoint(b)) {
    return lineIntersectPoint(a, b);
  }
  return false;
}
export function pointIntersectShape(a: QtreePoint, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleContainPoint(b, a);
  } else if (isLine(b)) {
    return lineIntersectPoint(b, a);
  } else if (isRect(b)) {
    return rectContainPoint(b, a);
  } else if (isPoint(b)) {
    return pointIntersectPoint(a, b);
  }
  return false;
}
export function shapeIntersectShape(a: QtreeShapes, b: QtreeShapes): boolean {
  if (isCircle(a)) {
    return circleIntersectShape(a, b);
  } else if (isRect(a)) {
    return rectIntersectShape(a, b);
  } else if (isLine(a)) {
    return lineIntersectShape(a, b);
  } else if (isPoint(a)) {
    return pointIntersectShape(a, b);
  }
  return false;
}

export function isCircle(shape: object): shape is QtreeCircle {
  return Object.hasOwn(shape, "radius");
}

export function isRect(shape: object): shape is QtreeRect {
  return Object.hasOwn(shape, "width");
}

export function isLine(shape: object): shape is QtreeLine {
  return Object.hasOwn(shape, "x1");
}

export function isPoint(shape: object): shape is QtreePoint {
  return (
    Object.hasOwn(shape, "x") &&
    !Object.hasOwn(shape, "width") &&
    !Object.hasOwn(shape, "radius")
  );
}
