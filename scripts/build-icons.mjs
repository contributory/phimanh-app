// Generate PNG icons from SVG sources using @resvg/resvg-js.
// Outputs:
//   assets/icon.png            1024x1024  (master, all platforms)
//   assets/adaptive-icon.png   1024x1024  (Android adaptive foreground)
//   assets/splash-icon.png     1024x1024  (Expo splash, resizeMode=contain)
//   assets/favicon.png         48x48      (web)
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const assets = resolve(root, "assets");

const targets = [
  { svg: "icon.svg",          out: "icon.png",          size: 1024 },
  { svg: "adaptive-icon.svg", out: "adaptive-icon.png", size: 1024 },
  { svg: "icon.svg",          out: "splash-icon.png",   size: 1024 },
  { svg: "favicon.svg",       out: "favicon.png",       size: 48   },
];

for (const t of targets) {
  const svg = readFileSync(resolve(assets, t.svg), "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: t.size },
    background: "rgba(0,0,0,0)",
  });
  const png = resvg.render().asPng();
  writeFileSync(resolve(assets, t.out), png);
  console.log(`wrote ${t.out} (${t.size}px, ${png.length} bytes)`);
}
