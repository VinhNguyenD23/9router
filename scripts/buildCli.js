const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const cliApp = path.join(root, "cli", "app");

function rm(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function cp(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, dereference: true });
}

function step(msg) { console.log(`\n📦 ${msg}`); }

// 1. Clean
step("Clean cli/app/");
rm(cliApp);
fs.mkdirSync(cliApp, { recursive: true });

// 2. Build Next.js if needed
const standalone = path.join(root, ".next", "standalone");
if (!fs.existsSync(path.join(standalone, "server.js"))) {
  step("Build Next.js (standalone)");
  execSync("npm run build", { cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } });
}

// 3. Copy standalone
step("Copy .next/standalone → cli/app/");
cp(standalone, cliApp);

// 4. Copy runtime modules
step("Copy open-sse/");
cp(path.join(root, "open-sse"), path.join(cliApp, "open-sse"));

step("Copy src/mitm/");
cp(path.join(root, "src", "mitm"), path.join(cliApp, "src", "mitm"));

step("Copy node_modules/node-forge/");
cp(
  path.join(root, "node_modules", "node-forge"),
  path.join(cliApp, "node_modules", "node-forge")
);

// 5. Copy public + .next/static
step("Copy public/ + .next/static/");
cp(path.join(root, "public"), path.join(cliApp, "public"));
cp(path.join(root, ".next", "static"), path.join(cliApp, ".next", "static"));

// Copy transitive deps from pnpm store that Next.js standalone tracing misses.
// Turbopack NFT doesn't trace all pnpm-hoisted packages (e.g. @swc/helpers, @next/env).
const pnpmDir = path.join(root, "node_modules", ".pnpm");
const pnpmPkgs = fs.readdirSync(pnpmDir);
const missingDeps = {
  "@swc+helpers": ["@swc", "helpers"],
  "@next+env":     ["@next", "env"],
};
for (const name of pnpmPkgs) {
  const match = Object.keys(missingDeps).find(prefix => name.startsWith(prefix + "@"));
  if (!match) continue;
  const destParts = missingDeps[match];
  const src = path.join(pnpmDir, name, "node_modules", ...destParts);
  const dest = path.join(cliApp, "node_modules", ...destParts);
  if (fs.existsSync(src)) cp(src, dest);
}

// 6. Copy standalone to root app/ (buildMitm.js reads from there as input)
const appDir = path.join(root, "app");
step("Copy .next/standalone → app/");
rm(appDir);
cp(standalone, appDir);
cp(path.join(root, "src", "mitm"), path.join(appDir, "src", "mitm"));

// 7. Bundle MITM with esbuild (reads from app/ → outputs to cli/app/)
step("Bundle MITM server");
execSync("node cli/scripts/buildMitm.js", { cwd: root, stdio: "inherit" });

// 8. Cleanup temp app/
rm(appDir);

console.log("\n✅ build:cli done → cli/app/\n");
console.log("Next:  cd cli && npm pack");
console.log("                 npm publish");
console.log("       npm i -g 9router-0.4.33.tgz");
