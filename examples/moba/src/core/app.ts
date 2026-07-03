export type Plugin = { run: () => void };

export class App {
  private static _plugins: Plugin[] = [];

  static addPlugin(plug: Plugin): void {
    App._plugins.push(plug);
  }

  static removePlugin(plug: Plugin): void {
    for (let i = 0, l = App._plugins.length; i < l; i++) {
      if (App._plugins[i] != plug) continue;
      App._plugins.splice(i, 1);
      break;
    }
  }

  static run() {
    for (let i = 0, l = App._plugins.length; i < l; i++) {
      App._plugins[i].run();
    }
  }
}
