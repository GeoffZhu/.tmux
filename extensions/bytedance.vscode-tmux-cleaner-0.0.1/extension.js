"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const cp = require("child_process");
const vscode = require("vscode");

const META_DIR = "/tmp/vscode-tmux-meta";
const pidByTerminal = new WeakMap();
const activePids = new Set();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function execFile(cmd, args) {
  return new Promise((resolve) => {
    cp.execFile(cmd, args, () => resolve());
  });
}

async function readMeta(pid) {
  try {
    const content = await fsp.readFile(path.join(META_DIR, `${pid}.json`), "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function removeMeta(pid) {
  try {
    await fsp.rm(path.join(META_DIR, `${pid}.json`), { force: true });
  } catch {
    // ignore
  }
}

function readMetaSync(pid) {
  try {
    const content = fs.readFileSync(path.join(META_DIR, `${pid}.json`), "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function removeMetaSync(pid) {
  try {
    fs.rmSync(path.join(META_DIR, `${pid}.json`), { force: true });
  } catch {
    // ignore
  }
}

async function trackTerminal(terminal) {
  try {
    const pid = await terminal.processId;
    if (pid) {
      pidByTerminal.set(terminal, pid);
      activePids.add(pid);
    }
  } catch {
    // ignore
  }
}

async function cleanupTerminal(terminal) {
  const pid = pidByTerminal.get(terminal);
  if (!pid) {
    return;
  }

  const meta = await readMeta(pid);
  if (!meta) {
    return;
  }

  try {
    process.kill(pid, "TERM");
  } catch {
    // ignore
  }

  await delay(400);

  if (meta.winId) {
    await execFile("tmux", ["kill-window", "-t", meta.winId]);
  }
  if (meta.clientSession) {
    await execFile("tmux", ["kill-session", "-t", meta.clientSession]);
  }

  await removeMeta(pid);
  activePids.delete(pid);
}

function cleanupPidSync(pid) {
  const meta = readMetaSync(pid);
  if (!meta) {
    activePids.delete(pid);
    return;
  }

  try {
    process.kill(pid, "TERM");
  } catch {
    // ignore
  }

  if (meta.winId) {
    cp.spawnSync("tmux", ["kill-window", "-t", meta.winId], { stdio: "ignore" });
  }
  if (meta.clientSession) {
    cp.spawnSync("tmux", ["kill-session", "-t", meta.clientSession], { stdio: "ignore" });
  }

  removeMetaSync(pid);
  activePids.delete(pid);
}

function activate(context) {
  for (const terminal of vscode.window.terminals) {
    void trackTerminal(terminal);
  }

  context.subscriptions.push(
    vscode.window.onDidOpenTerminal((terminal) => {
      void trackTerminal(terminal);
    })
  );

  context.subscriptions.push(
    vscode.window.onDidCloseTerminal((terminal) => {
      void cleanupTerminal(terminal);
    })
  );
}

function deactivate() {
  for (const pid of Array.from(activePids)) {
    cleanupPidSync(pid);
  }
}

module.exports = {
  activate,
  deactivate
};
