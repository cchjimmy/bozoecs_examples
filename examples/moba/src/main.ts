import { App } from "./core/app.ts";
import resizingCanvas from "./plugins/resizingCanvas/plugin.ts";
import keys from "./plugins/keyboard/plugin.ts";
import pointers from "./plugins/pointers/plugin.ts";
import time from "./plugins/time/plugin.ts";
import moba from "./plugins/moba/plugin.ts";
import gameInfo from "./plugins/gameInfo/plugin.ts";

App.addPlugin(resizingCanvas);
App.addPlugin(moba);
App.addPlugin(gameInfo);
App.addPlugin(keys);
App.addPlugin(pointers);
App.addPlugin(time);
App.run();
