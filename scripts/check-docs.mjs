import fs from "node:fs";
import path from "node:path";

let errors = 0;

function checkDocPaths(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  // Find backticked paths like `domain/aqi.ts`, `docs/DESIGN.md`, etc.
  const pathMatches = content.matchAll(/`([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`/g);

  for (const match of pathMatches) {
    const candidate = match[1];
    // Filter out code expressions, command names, urls, types
    if (
      !candidate.includes("/") ||
      candidate.startsWith("http") ||
      candidate.startsWith("npm") ||
      candidate.includes("<") ||
      candidate.includes(">")
    ) {
      continue;
    }

    const resolved = path.resolve(process.cwd(), candidate);
    if (!fs.existsSync(resolved)) {
      console.error(`[check:docs] Missing referenced file in ${filePath}: ${candidate}`);
      errors++;
    }
  }
}

// Check README.md
checkDocPaths("README.md");

// Check docs directory
const docsDir = path.resolve(process.cwd(), "docs");
if (fs.existsSync(docsDir)) {
  const docFiles = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
  for (const docFile of docFiles) {
    checkDocPaths(path.join("docs", docFile));
  }
}

if (errors > 0) {
  console.error(`[check:docs] Failed with ${errors} broken path reference(s).`);
  process.exit(1);
} else {
  console.log("[check:docs] Passed: All documented file paths exist.");
}
