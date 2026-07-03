import {
  QtreeShapes,
  QtreeRect,
  isCircle,
  rectContainCircle,
  isRect,
  rectContainRect,
  isLine,
  rectContainLine,
  QtreeLine,
  RayIntersectShape,
  rectIntersectRay,
  rectIntersectShape,
  circleIntersectShape,
  rectIntersectCircle,
  rectIntersectRect,
  lineIntersectShape,
  rectIntersectLine,
  QtreeCircle,
  QtreePoint,
  rectContainPoint,
  isPoint,
  pointIntersectShape,
} from "./shapes.ts";

export type { QtreeCircle, QtreeLine, QtreeShapes, QtreeRect, QtreePoint };

enum QUADRANTS {
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
}

// radix 5 id
function calculateId(accum: number, quadrant: QUADRANTS, depth: number) {
  return accum + (quadrant + 1) * 5 ** depth;
}

type MapValue<T> = T extends Map<unknown, infer V> ? V : never;

export class Quadtree {
  private _storage: Map<number, Set<QtreeShapes>> = new Map();
  private _reverse: Map<QtreeShapes, number> = new Map();
  private _bounds: Map<number, QtreeRect> = new Map();
  private _maxDepth: number = 10;
  private _unusedRects: QtreeRect[] = [];

  constructor(
    boundary: QtreeRect = { x: 0, y: 0, width: 100, height: 100 },
    maxDepth: number = 10,
  ) {
    this._bounds.set(0, boundary);
    this._maxDepth = maxDepth;
  }

  setBoundary(boundary: QtreeRect) {
    for (const entry of this._bounds) {
      this._unusedRects.push(entry[1]);
      this._bounds.delete(entry[0]);
    }
    this._bounds.set(0, boundary);
    this.update();
  }

  insert(shape: QtreeShapes) {
    this._insert(shape);
  }

  forEach<S extends QtreeShapes>(
    query: S,
    fn: (s: QtreeShapes, store: Set<QtreeShapes>) => void,
  ): void {
    let shapeIntersectShapesFn: unknown;
    let rectIntersectShapeFn: unknown;
    if (isCircle(query)) {
      shapeIntersectShapesFn = circleIntersectShape;
      rectIntersectShapeFn = rectIntersectCircle;
    } else if (isRect(query)) {
      shapeIntersectShapesFn = rectIntersectShape;
      rectIntersectShapeFn = rectIntersectRect;
    } else if (isLine(query)) {
      shapeIntersectShapesFn = lineIntersectShape;
      rectIntersectShapeFn = rectIntersectLine;
    } else if (isPoint(query)) {
      shapeIntersectShapesFn = pointIntersectShape;
      rectIntersectShapeFn = rectContainPoint;
    }
    this._traverse(
      query,
      (store: MapValue<typeof this._storage>) => {
        for (const shape of store) {
          if (
            !(shapeIntersectShapesFn as (a: S, b: QtreeShapes) => boolean)(
              query,
              shape,
            )
          )
            continue;
          fn(shape, store);
        }
      },
      rectIntersectShapeFn as (a: QtreeRect, b: QtreeShapes) => boolean,
    );
  }

  query<S extends QtreeShapes>(
    shape: S,
    res: QtreeShapes[] = [],
  ): QtreeShapes[] {
    this.forEach(shape, (s) => res.push(s));
    return res;
  }

  queryRay(ray: QtreeLine, res: QtreeShapes[] = []): QtreeShapes[] {
    // (x1, y1) is origin, (x2, y2) provides direction for ray
    // this uses traverse because there are dedicated functions for rays
    // forEach does not work with rays
    this._traverse(
      ray,
      (store) => {
        for (const v of store) {
          if (!RayIntersectShape(ray, v)) continue;
          res.push(v);
        }
      },
      rectIntersectRay,
    );
    return res;
  }

  update() {
    for (const entry of this._storage) {
      for (const shape of entry[1]) {
        const index = this._index(shape);
        if (index == entry[0]) continue;
        entry[1].delete(shape);
        this._insert(shape, index);
      }
    }
  }

  eraseIntersected<S extends QtreeShapes>(shape: S) {
    this.forEach(shape, (s, store) => {
      store.delete(s);
      this._reverse.delete(s);
    });
  }

  eraseExact(shape: QtreeShapes) {
    const index = this._reverse.get(shape);
    this._reverse.delete(shape);
    if (index) this._storage.get(index)?.delete(shape);
  }

  clear() {
    for (const v of this._storage) {
      v[1].clear();
    }
    this._reverse.clear();
  }

  size() {
    return this._reverse.size;
  }

  drawTree(ctx: CanvasRenderingContext2D, color = "green") {
    for (const value of this._storage) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      for (const shape of value[1]) {
        if (isRect(shape)) {
          ctx.moveTo(shape.x, shape.y);
          ctx.rect(shape.x, shape.y, shape.width, shape.height);
        } else if (isCircle(shape)) {
          ctx.moveTo(shape.x + shape.radius, shape.y);
          ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        } else if (isLine(shape)) {
          ctx.moveTo(shape.x1, shape.y1);
          ctx.lineTo(shape.x2, shape.y2);
        }
      }
      if (value[1].size) {
        const bound = this._bounds.get(value[0]);
        if (!bound) continue;
        ctx.moveTo(bound.x, bound.y);
        ctx.rect(bound.x, bound.y, bound.width, bound.height);
      }
      ctx.stroke();
    }
  }

  private _index<S extends QtreeShapes>(shape: S): number {
    let index = 0;
    let depth = 1;
    let contained = true;
    let containFn: ((r: QtreeRect, s: S) => boolean) | undefined = undefined;
    if (isRect(shape)) {
      containFn = rectContainRect as (r: QtreeRect, s: S) => boolean;
    } else if (isCircle(shape)) {
      containFn = rectContainCircle as (r: QtreeRect, s: S) => boolean;
    } else if (isLine(shape)) {
      containFn = rectContainLine as (r: QtreeRect, s: S) => boolean;
    } else if (isPoint(shape)) {
      containFn = rectContainPoint as (r: QtreeRect, s: S) => boolean;
    }
    if (containFn == undefined) throw new Error();
    while (contained && depth <= this._maxDepth) {
      contained = false;
      const parentBound = this._bounds.get(index);
      if (!parentBound) throw new Error();
      for (let i = 0; i < 4; i++) {
        const id = calculateId(index, i, depth);
        let childBound = this._bounds.get(id);
        if (childBound == undefined) {
          childBound = this._unusedRects.pop() ?? {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          };
          childBound.x = parentBound.x + (parentBound.width / 2) * (i % 2);
          childBound.y = parentBound.y + (parentBound.height / 2) * +(i > 1);
          childBound.width = parentBound.width / 2;
          childBound.height = parentBound.height / 2;
          this._bounds.set(id, childBound);
        }
        if (!containFn(childBound, shape)) continue;
        index = id;
        contained = true;
        depth++;
        break;
      }
    }
    return index;
  }

  private _traverse<S extends QtreeShapes>(
    shape: S,
    op: (corresponding_storage: MapValue<typeof this._storage>) => void,
    rectIntersectShapeFn: (a: QtreeRect, b: S) => boolean = rectIntersectShape,
  ) {
    const queue: number[] = [];
    queue.push(0, 0);
    while (queue.length) {
      const index = queue.shift() as number;
      let depth = queue.shift() as number;
      const store = this._storage.get(index);
      if (store) op(store);
      depth++;
      if (depth > this._maxDepth) continue;
      for (let i = 0; i < 4; i++) {
        const id = calculateId(index, i, depth);
        const bound = this._bounds.get(id);
        if (!bound || !rectIntersectShapeFn(bound, shape)) continue;
        queue.push(id, depth);
      }
    }
  }

  private _insert<S extends QtreeShapes>(
    shape: S,
    index: number = this._index(shape),
  ): void {
    this._storage.getOrInsert(index, new Set()).add(shape);
    this._reverse.set(shape, index);
  }
}
