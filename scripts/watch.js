/**
 * Simple rebuild-on-change (no deps).
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.join(__dirname, "..");
let timer = null;
let building = false;
let pending = false;

function build() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  const child = spawn(process.execPath, [path.join(__dirname, "build.js")], {
    stdio: "inherit",
    cwd: ROOT,
  });
  child.on("exit", () => {
    building = false;
    if (pending) {
      pending = false;
      build();
    }
  });
}

function watch(dir) {
  if (!fs.existsSync(dir)) return;
  fs.watch(dir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  });
}

console.log("Watching src/ and public/ …");
build();
watch(path.join(ROOT, "src"));
watch(path.join(ROOT, "public"));
