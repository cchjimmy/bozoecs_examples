import { serveDir } from "@std/http/file-server";
import { exists } from "@std/fs/exists";

const options: Deno.bundle.Options = {
  minify: true,
  entrypoints: [""],
  format: "iife",
};

if (Deno.args[0] == "debug") {
  options.sourcemap = "linked";
}

const path = "examples";
const examples = Deno.readDirSync(path);

for (const example of examples) {
  if (!example.isDirectory) continue;
  const examplePath = path + "/" + example.name;
  emptyDir(examplePath + "/build");
  buildExample(examplePath, options);
  watchExample(examplePath, options);
}

function isPrivate(networkInterfaces: Deno.NetworkInterfaceInfo) {
  const name = networkInterfaces.name.toLowerCase();
  return (
    name.includes("vboxnet") ||
    name.toLowerCase().includes("docker") ||
    name.toLowerCase().includes("lo")
  );
}
const hostname = Deno.networkInterfaces().find(
  (v) => v.family == "IPv4" && !isPrivate(v),
)?.address;
if (hostname) {
  Deno.serve({ hostname }, (req) => serveDir(req, { fsRoot: path }));
}

async function watchExample(
  examplePath: string,
  buildOpts: Deno.bundle.Options,
) {
  const watcher = Deno.watchFs(examplePath + "/src/");
  for await (const event of watcher) {
    if (event.kind != "modify") continue;
    console.log(`Files in ${examplePath} have changed`);
    buildExample(examplePath, buildOpts);
  }
}

async function buildExample(
  examplePath: string,
  buildOpts: Deno.bundle.Options,
) {
  console.log(`Building ${examplePath}`);
  buildOpts.entrypoints = [examplePath + "/src/main.ts"];
  buildOpts.outputPath = examplePath + "/build/out.js";
  await Deno.bundle(buildOpts);
}

async function emptyDir(path: string) {
  if (!(await exists(path))) return;
  Deno.remove(path, { recursive: true });
}
