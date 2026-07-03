import { systemT, World } from "bozoecs";
import { Quadtree } from "../../quadtree/quadtree.ts";

const world: World = new World();
const qtree: Quadtree = new Quadtree();
const systems: systemT[] = [];
