import { Quadtree, QtreeLine, QtreeRect, QtreeCircle } from "./quadtree.ts";
import { assert } from "@std/assert";

Deno.test({
  name: "insertShape",
  fn() {
    const l1: QtreeLine = { x1: -1, y1: 0, x2: 1, y2: 0 };
    const qt = new Quadtree({ x: -50, y: 50, width: 100, height: 100 });
    qt.insert(l1);
    assert(qt.size() == 1);
    const r1: QtreeRect = { x: -2, y: -2, width: 4, height: 4 };
    qt.insert(r1);
    assert(qt.size() == 2);
  },
});
Deno.test({
  name: "clear",
  fn() {
    const l1: QtreeLine = { x1: -1, y1: 0, x2: 1, y2: 0 };
    const qt = new Quadtree({ x: -50, y: 50, width: 100, height: 100 });
    qt.insert(l1);
    const r1: QtreeRect = { x: -2, y: -2, width: 4, height: 4 };
    qt.insert(r1);
    qt.clear();
    assert(qt.size() == 0);
  },
});
Deno.test({
  name: "query rect with rect",
  fn() {
    const r1: QtreeRect = { x: -0.5, y: -0.5, width: 1, height: 1 };
    const r2: QtreeRect = { x: -2, y: -2, width: 4, height: 4 };
    const qt = new Quadtree({ x: -50, y: 50, width: 100, height: 100 });
    qt.insert(r1);
    assert(qt.query(r2).length == 1);
  },
});
Deno.test({
  name: "query line with rect",
  fn() {
    const l1: QtreeLine = { x1: -1, y1: 0, x2: 1, y2: 0 };
    const r1: QtreeRect = { x: -2, y: -2, width: 4, height: 4 };
    const qt = new Quadtree({ x: -50, y: 50, width: 100, height: 100 });
    qt.insert(l1);
    assert(qt.query(r1).length == 1);
  },
});
Deno.test({
  name: "query line with circle",
  fn() {
    const l1: QtreeLine = { x1: -1, y1: 0, x2: 1, y2: 0 };
    const c1: QtreeCircle = { x: 0, y: 0, radius: 2 };
    const qt = new Quadtree({ x: -50, y: 50, width: 100, height: 100 });
    qt.insert(l1);
    assert(qt.query(c1).length == 1);
  },
});
Deno.test({
  name: "query rect with circle",
  fn() {
    const r: QtreeRect = { x: -1, y: -1, width: 2, height: 2 };
    const c: QtreeCircle = { x: -1, y: -1, radius: 1 };
    const qt = new Quadtree({ x: -50, y: 50, width: 100, height: 100 });
    qt.insert(r);
    assert(qt.query(c).length == 1);
  },
});
Deno.test({
  name: "query circle with circle",
  fn() {
    const c1: QtreeCircle = { x: -1, y: -1, radius: 2 };
    const c2: QtreeCircle = { x: -1, y: -1, radius: 1 };
    const qt = new Quadtree({ x: -50, y: 50, width: 100, height: 100 });
    qt.insert(c1);
    assert(qt.query(c2).length == 1);
    const c3: QtreeCircle = { x: 3, y: 3, radius: 1 };
    assert(qt.query(c3).length == 0);
  },
});
Deno.test({
  name: "query line with line",
  fn() {
    const l: QtreeLine = { x1: -1, y1: 0, x2: 1, y2: 0 };
    const qt = new Quadtree({ x: -50, y: 50, width: 100, height: 100 });
    qt.insert(l);
    const l1: QtreeLine = { x1: 0, y1: -1, x2: 0, y2: 1 };
    assert(qt.query(l1).length == 1);
    const l2: QtreeLine = { x1: -1, y1: 1, x2: 1, y2: 1 };
    assert(qt.query(l2).length == 0);
    const l3: QtreeLine = { x1: -1, y1: -1, x2: 1, y2: 1 };
    assert(qt.query(l3).length == 1);
  },
});
Deno.test({
  name: "index",
  fn() {
    const qt = new Quadtree({ x: -50, y: -50, width: 100, height: 100 });
    const r1: QtreeRect = { x: 1, y: 1, width: 1, height: 1 };
    const r2: QtreeRect = { x: -1, y: -1, width: 2, height: 2 };
    qt.insert(r1);
    qt.insert(r2);
    qt.forEach(r2, (_, store) => assert(store.size == 1));
  },
});
