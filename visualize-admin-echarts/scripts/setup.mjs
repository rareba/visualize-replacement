#!/usr/bin/env node
/**
 * Cross-platform setup and run script for visualize-admin
 * Works on Windows, macOS, and Linux without Docker
 *
 * Usage:
 *   node scripts/setup.mjs           - Full setup (install, build, migrate)
 *   node scripts/setup.mjs --dev     - Setup for development
 *   node scripts/setup.mjs --check   - Check prerequisites only
 *   node scripts/setup.mjs --help    - Show help
 */

import { spawnSync } from "child_process";
import { existsSync, copyFileSync, writeFileSync } from "fs";
import { platform } from "os";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logStep(step, message) {
  console.log(`\n${COLORS.cyan}[${step}]${COLORS.reset} ${message}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, "green");
}

function logError(message) {
  log(`  ✗ ${message}`, "red");
}

function logWarning(message) {
  log(`  ⚠ ${message}`, "yellow");
}

/**
 * Run a command safely using spawnSync (no shell injection risk)
 */
function run(command, args = [], options = {}) {
  const { silent = false, ignoreError = false } = options;
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    stdio: silent ? "pipe" : "inherit",
    shell: platform() === "win32",
  });

  if (result.error) {
    if (ignoreError) {
      return { success: false, output: result.error.message };
    }
    throw result.error;
  }

  if (result.status !== 0 && !ignoreError) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }

  return {
    success: result.status === 0,
    output: result.stdout || "",
  };
}

function runSilent(command, args = []) {
  return run(command, args, { silent: true, ignoreError: true });
}

function checkCommand(command) {
  const checkCmd = platform() === "win32" ? "where" : "which";
  const result = runSilent(checkCmd, [command]);
  return result.success;
}

function getVersion(command, versionFlag = "--version") {
  const result = runSilent(command, [versionFlag]);
  if (result.success) {
    const match = result.output.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : result.output.trim().split("\n")[0];
  }
  return null;
}

function checkPrerequisites() {
  logStep("1/5", "Checking prerequisites...");

  const prerequisites = [
    { name: "Node.js", command: "node", minVersion: "18.0.0" },
    { name: "Yarn", command: "yarn", minVersion: "1.22.0" },
  ];

  const optionalDeps = [
    { name: "Docker", command: "docker" },
    { name: "Docker Compose", command: "docker-compose" },
    { name: "PostgreSQL", command: "psql" },
  ];

  let allRequired = true;

  for (const dep of prerequisites) {
    if (checkCommand(dep.command)) {
      const version = getVersion(dep.command);
      logSuccess(`${dep.name} found (${version})`);
    } else {
      logError(`${dep.name} not found - required`);
      allRequired = false;
    }
  }

  log("\n  Optional dependencies:", "blue");
  let hasDocker = false;
  let hasPostgres = false;

  for (const dep of optionalDeps) {
    if (checkCommand(dep.command)) {
      const version = getVersion(dep.command);
      logSuccess(`${dep.name} found (${version || "available"})`);
      if (dep.command === "docker") hasDocker = true;
      if (dep.command === "psql") hasPostgres = true;
    } else {
      logWarning(`${dep.name} not found`);
    }
  }

  if (!hasDocker && !hasPostgres) {
    logWarning("No database option available. Install Docker or PostgreSQL.");
  }

  return allRequired;
}

function setupEnvFile() {
  logStep("2/5", "Setting up environment...");

  const envPath = resolve(ROOT_DIR, ".env");
  const envExamplePath = resolve(ROOT_DIR, ".env.example");

  if (existsSync(envPath)) {
    logSuccess(".env file already exists");
    return;
  }

  if (existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath);
    logSuccess("Created .env from .env.example");
    logWarning("Review .env and update values as needed");
  } else {
    // Create minimal .env
    const minimalEnv = `# Auto-generated environment file
DATABASE_URL=postgres://postgres:password@localhost:5433/visualization_tool

# Auth configuration (optional for development)
ADFS_ISSUER=
ADFS_ID=
ADFS_SECRET=
ADFS_PROFILE_URL=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# Maptile configuration (optional)
NEXT_PUBLIC_MAPTILER_STYLE_KEY=

# SEO
PREVENT_SEARCH_BOTS=true
`;
    writeFileSync(envPath, minimalEnv);
    logSuccess("Created minimal .env file");
    logWarning("Review .env and update values as needed");
  }
}

function installDependencies() {
  logStep("3/5", "Installing dependencies...");
  run("yarn", ["install"]);
  logSuccess("Dependencies installed");
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Busy wait - simple cross-platform sleep
  }
}

function setupDatabase(useDocker) {
  logStep("4/5", "Setting up database...");

  if (useDocker) {
    log("  Starting PostgreSQL with Docker...", "blue");

    // Check if container is already running
    const checkResult = runSilent("docker", [
      "ps",
      "--filter",
      "name=visualize-admin-echarts-db",
      "-q",
    ]);
    if (checkResult.success && checkResult.output.trim()) {
      logSuccess("Database container already running");
    } else {
      run("docker-compose", ["up", "-d", "db"]);
      log("  Waiting for database to be ready...", "blue");

      // Wait for database
      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts) {
        const result = runSilent("docker", [
          "exec",
          "visualize-admin-echarts-db-1",
          "pg_isready",
          "-U",
          "postgres",
          "-d",
          "visualization_tool",
        ]);
        if (result.success) {
          break;
        }
        // Try alternative container name
        const result2 = runSilent("docker", [
          "exec",
          "visualize-admin-echarts_db_1",
          "pg_isready",
          "-U",
          "postgres",
          "-d",
          "visualization_tool",
        ]);
        if (result2.success) {
          break;
        }
        attempts++;
        sleep(1000);
      }

      if (attempts >= maxAttempts) {
        logWarning("Database may not be ready yet. Continuing anyway...");
      } else {
        logSuccess("Database is ready");
      }
    }
  } else {
    logWarning("Docker not available. Ensure PostgreSQL is running manually.");
    log(
      "  Expected: postgres://postgres:password@localhost:5433/visualization_tool",
      "blue"
    );
  }

  // Run migrations
  log("  Running database migrations...", "blue");
  const migrateResult = run("yarn", ["db:migrate:dev"], { ignoreError: true });
  if (migrateResult.success !== false) {
    logSuccess("Database migrations complete");
  } else {
    logWarning("Migration may have failed. Check database connection.");
  }
}

function compileAssets() {
  logStep("5/5", "Compiling assets...");

  log("  Compiling locales...", "blue");
  run("yarn", ["locales:compile"]);
  logSuccess("Locales compiled");
}

function showHelp() {
  console.log(`
${COLORS.cyan}Visualize Admin - Cross-Platform Setup Script${COLORS.reset}

Usage:
  node scripts/setup.mjs [options]

Options:
  --dev       Setup for development (skip production build)
  --check     Check prerequisites only
  --no-docker Skip Docker database setup (use local PostgreSQL)
  --help      Show this help message

Examples:
  node scripts/setup.mjs           Full setup with Docker
  node scripts/setup.mjs --dev     Development setup
  node scripts/setup.mjs --check   Check system requirements

After setup, run the app with:
  yarn dev                         Start development server
  yarn build && yarn start         Production build and start
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  console.log(
    `\n${COLORS.cyan}╔════════════════════════════════════════╗${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}║   Visualize Admin - Setup Script       ║${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}║   Platform: ${platform().padEnd(26)}║${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}╚════════════════════════════════════════╝${COLORS.reset}`
  );

  // Check prerequisites
  const prereqsOk = checkPrerequisites();

  if (args.includes("--check")) {
    process.exit(prereqsOk ? 0 : 1);
  }

  if (!prereqsOk) {
    logError("\nPrerequisites check failed. Please install missing dependencies.");
    process.exit(1);
  }

  const useDocker = !args.includes("--no-docker") && checkCommand("docker");

  try {
    setupEnvFile();
    installDependencies();
    setupDatabase(useDocker);
    compileAssets();

    console.log(
      `\n${COLORS.green}╔════════════════════════════════════════╗${COLORS.reset}`
    );
    console.log(
      `${COLORS.green}║   Setup Complete!                      ║${COLORS.reset}`
    );
    console.log(
      `${COLORS.green}╚════════════════════════════════════════╝${COLORS.reset}`
    );

    console.log(`
${COLORS.cyan}Next steps:${COLORS.reset}

  Development:
    ${COLORS.yellow}yarn dev${COLORS.reset}                 Start development server
    ${COLORS.yellow}yarn dev:ssl${COLORS.reset}             Start with HTTPS (for auth)

  Production:
    ${COLORS.yellow}yarn build${COLORS.reset}               Build for production
    ${COLORS.yellow}yarn start${COLORS.reset}               Start production server

  Testing:
    ${COLORS.yellow}yarn test${COLORS.reset}                Run unit tests
    ${COLORS.yellow}yarn e2e:dev${COLORS.reset}             Run e2e tests

  Database:
    ${COLORS.yellow}yarn db:studio${COLORS.reset}           Open database GUI

  App will be available at: ${COLORS.green}http://localhost:3000${COLORS.reset}
`);
  } catch (error) {
    logError(`\nSetup failed: ${error.message}`);
    process.exit(1);
  }
}

main();
