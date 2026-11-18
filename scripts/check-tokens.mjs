import fs from "node:fs";
import path from "node:path";

const COMPONENT_DIRS = ["components", "app"];
const EMOJI_REGEX = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const RAW_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,8})\b|rgb\([^)]+\)|rgba\([^)]+\)/;
const ARBITRARY_TAILWIND_REGEX = /\b(?:bg|text|border|p|m|w|h|gap)-\[[^\]]+\]/;

let errors = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && /\.(tsx|jsx|ts|js)$/.test(entry.name)) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Skip comment lines
    if (line.trim().startsWith("//") || line.trim().startsWith("/*")) return;

    if (RAW_COLOR_REGEX.test(line)) {
      // Allow in test files or token definition files if any
      if (!filePath.includes("token") && !filePath.includes("test")) {
        console.error(`[check:tokens] Raw color found in ${filePath}:${index + 1}: ${line.trim()}`);
        errors++;
      }
    }

    if (ARBITRARY_TAILWIND_REGEX.test(line)) {
      console.error(`[check:tokens] Arbitrary Tailwind class in ${filePath}:${index + 1}: ${line.trim()}`);
      errors++;
    }

    if (EMOJI_REGEX.test(line) && !filePath.includes("test")) {
      console.error(`[check:tokens] Direct emoji found in ${filePath}:${index + 1}: ${line.trim()}`);
      errors++;
    }
  });
}

for (const dir of COMPONENT_DIRS) {
  scanDir(dir);
}

if (errors > 0) {
  console.error(`[check:tokens] Failed with ${errors} token violation(s).`);
  process.exit(1);
} else {
  console.log("[check:tokens] Passed: No raw colors, arbitrary Tailwind values, or emoji found.");
}
