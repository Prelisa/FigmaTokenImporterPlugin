// Build script to bundle UI HTML with JavaScript and move code.js to root
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");
const srcCodePath = path.join(distDir, "src", "code.js");
const rootCodePath = path.join(distDir, "code.js");

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Build UI: Read HTML and inject compiled JS
let html = fs.readFileSync(path.join(__dirname, "ui", "ui.html"), "utf-8");
let uiJs = fs.readFileSync(path.join(__dirname, "dist", "ui", "ui.js"), "utf-8");
// Remove sourcemap reference which can cause issues when embedded
uiJs = uiJs.replace(/\/\/# sourceMappingURL=.*$/gm, '');
html = html.replace('<script src="ui.js"></script>', () => `<script>\n${uiJs}\n</script>`);
fs.writeFileSync(path.join(distDir, "ui.html"), html);
console.log("✓ UI bundle created");

// 2. Copy code.js to dist root as-is
// __html__ is automatically populated by Figma from the "ui" field in manifest.json
const codeJs = fs.readFileSync(srcCodePath, "utf-8");
fs.writeFileSync(rootCodePath, codeJs);
console.log("✓ code.js copied to dist root");
