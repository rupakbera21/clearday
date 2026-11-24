import fs from "node:fs";
import path from "node:path";

let errors = 0;

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".css",
  ".yml",
  ".yaml",
]);

function checkDocPaths(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  // Find backticked tokens like `domain/aqi.ts`, `docs/DESIGN.md`, `next.config.mjs`, etc.
  const pathMatches = content.matchAll(/`([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`/g);

  for (const match of pathMatches) {
    const candidate = match[1];
    const ext = path.extname(candidate);

    // Skip urls, package names, version strings like 1.0.0, generics
    if (
      candidate.startsWith("http") ||
      candidate.startsWith("npm") ||
      candidate.includes("<") ||
      candidate.includes(">") ||
      /^\d+\.\d+/.test(candidate)
    ) {
      continue;
    }

    // Must either contain a slash or have a recognized code/config extension
    if (!candidate.includes("/") && !CODE_EXTENSIONS.has(ext)) {
      continue;
    }

    const resolved = path.resolve(process.cwd(), candidate);
    if (!fs.existsSync(resolved)) {
      console.error(`[check:docs] Missing referenced file in ${filePath}: ${candidate}`);
      errors++;
    }
  }
}

function getMdFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getMdFilesRecursively(full));
    } else if (entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

// Check README.md
checkDocPaths("README.md");

// Check docs directory recursively
const docsDir = path.resolve(process.cwd(), "docs");
const docFiles = getMdFilesRecursively(docsDir);
for (const docFile of docFiles) {
  checkDocPaths(docFile);
}

if (errors > 0) {
  console.error(`[check:docs] Failed with ${errors} broken path reference(s).`);
  process.exit(1);
} else {
  console.log("[check:docs] Passed: All documented file paths exist.");
}
