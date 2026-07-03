import { Quadtree } from "../../quadtree/quadtree.ts";

export class QuadtreeManager {
  private _qtrees: Quadtree[] = [];

  createQtree(): number {
    return this._qtrees.push(new Quadtree()) - 1;
  }

  getQuadtree(qtreeId: number): Quadtree | undefined {
    return this._qtrees[qtreeId];
  }

  getQtreeId(qtree: Quadtree): number {
    let id = -1;
    for (let i = 0, l = this._qtrees.length; i < l; i++) {
      if (this._qtrees[i] != qtree) continue;
      id = i;
      break;
    }
    return id;
  }

  update(): void {
    for (let i = 0, l = this._qtrees.length; i < l; i++) {
      this._qtrees[i].update();
    }
  }
}
