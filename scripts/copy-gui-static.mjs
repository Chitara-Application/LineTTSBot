import {
  mkdir,
  copyFile
} from "node:fs/promises";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const projectRoot =
  path.resolve(__dirname, "..");

const source =
  path.join(
    projectRoot,
    "src",
    "gui",
    "renderer"
  );

const destination =
  path.join(
    projectRoot,
    "dist",
    "gui",
    "renderer"
  );

await mkdir(
  destination,
  {
    recursive: true
  }
);

await copyFile(
  path.join(
    source,
    "index.html"
  ),
  path.join(
    destination,
    "index.html"
  )
);

await copyFile(
  path.join(
    source,
    "style.css"
  ),
  path.join(
    destination,
    "style.css"
  )
);

process.stdout.write(
  "GUI static files copied.\n"
);