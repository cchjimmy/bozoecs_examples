import { World, systemT } from "bozoecs";

export default class ECS {
  private _worlds: World[] = [];
  private _systems: systemT[][] = [];
  private _worldUpdateSequence: number[] = [];

  createWorld(initWorld: (_: World) => void): number {
    const world = new World();
    initWorld(world);
    return this._worlds.push(world) - 1;
  }

  getWorld(worldId: number): World | undefined {
    return this._worlds[worldId];
  }

  getWorldId(world: World): number {
    let id = -1;
    for (let i = 0, l = this._worlds.length; i < l; i++) {
      if (this._worlds[i] != world) continue;
      id = i;
      break;
    }
    return id;
  }

  setSystems(worldId: number, systems: systemT[]): void {
    this._systems[worldId] = systems;
  }

  updateWorld(worldId: number): void {
    if (this._systems[worldId])
      this._worlds[worldId]?.update(this._systems[worldId]);
  }

  setWorldUpdateSequence(wus: number[]): void {
    this._worldUpdateSequence = wus;
  }

  getWorldUpdateSequence(): number[] {
    return this._worldUpdateSequence;
  }

  update(): void {
    for (let i = 0, l = this._worldUpdateSequence.length; i < l; i++) {
      if (!this._systems[this._worldUpdateSequence[i]]) continue;
      this._worlds[this._worldUpdateSequence[i]].update(
        this._systems[this._worldUpdateSequence[i]],
      );
    }
  }
}
