#!/usr/bin/env node
/**
 * Cross-platform development server script
 * Works on Windows, macOS, and Linux without symlink issues
 */

const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT_DIR, "app");
const DIST_DIR = path.join(APP_DIR, "dist");

const isWindows = process.platform === "win32";

console.log(`
  _    ___                  ___             ___      __          _
 | |  / (_)______  ______ _/ (_)___  ___   /   | ___/ /___ ___  (_)___
 | | / / / ___/ / / / __ \`/ / /_  / / _ \\ / /| |/ __  / __ \`__ \\/ / __ \\
 | |/ / (__  ) /_/ / /_/ / / / / /_/  __// ___ / /_/ / / / / / / / / / /
 |___/_/____/\\__,_/\\__,_/_/_/ /___/\\___//_/  |_\\__,_/_/ /_/ /_/_/_/ /_/

  Development Server
  Platform: ${process.platform} | Node: ${process.version}
`);

/**
 * Setup the dist directory with proper exports
 * This bypasses preconstruct's symlink requirement on Windows
 */
function setupDistDirectory() {
  console.log("📦 Setting up app/dist directory...");

  // Create dist directory
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Check if we can use symlinks (Unix or Windows with proper permissions)
  let canSymlink = false;
  if (!isWindows) {
    canSymlink = true;
  } else {
    // Test if symlinks work on Windows
    const testSymlink = path.join(DIST_DIR, ".symlink-test");
    const testTarget = path.join(APP_DIR, "package.json");
    try {
      if (fs.existsSync(testSymlink)) fs.unlinkSync(testSymlink);
      fs.symlinkSync(testTarget, testSymlink);
      fs.unlinkSync(testSymlink);
      canSymlink = true;
    } catch (e) {
      canSymlink = false;
    }
  }

  const esmFile = path.join(DIST_DIR, "interactivethings-visualize-app.esm.js");
  const cjsFile = path.join(DIST_DIR, "interactivethings-visualize-app.cjs.js");
  const dtsFile = path.join(DIST_DIR, "interactivethings-visualize-app.cjs.d.ts");
  const srcIndex = path.join(APP_DIR, "src", "index.ts");

  if (canSymlink) {
    console.log("   Using symlinks (native performance)");
    // Use symlinks like preconstruct does
    try {
      if (fs.existsSync(esmFile)) fs.unlinkSync(esmFile);
      fs.symlinkSync(srcIndex, esmFile);
    } catch (e) {
      // Fall back to re-export files
      canSymlink = false;
    }
  }

  if (!canSymlink) {
    console.log("   Using re-export files (Windows compatibility mode)");
    // Create re-export files instead of symlinks
    fs.writeFileSync(esmFile, `export * from "../src/index";\n`);
  }

  // Always create these files
  fs.writeFileSync(cjsFile, `"use strict";\nmodule.exports = require("../src/index");\n`);
  fs.writeFileSync(dtsFile, `export * from "../src/index";\n`);

  console.log("   ✓ dist directory ready\n");
}

/**
 * Run the Next.js development server
 */
function startNextDev() {
  console.log("🚀 Starting Next.js development server...\n");

  const nodeOptions = ["--inspect", "--openssl-legacy-provider"];

  const env = {
    ...process.env,
    NODE_OPTIONS: nodeOptions.join(" "),
  };

  const args = ["next", "--webpack", "./app"];

  const child = spawn("npx", args, {
    cwd: ROOT_DIR,
    env,
    stdio: "inherit",
    shell: true,
  });

  child.on("error", (err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });

  // Handle Ctrl+C gracefully
  process.on("SIGINT", () => {
    child.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    child.kill("SIGTERM");
  });
}

// Main
try {
  setupDistDirectory();
  startNextDev();
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
