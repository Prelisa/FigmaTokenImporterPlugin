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
const uiJs = fs.readFileSync(path.join(__dirname, "dist", "ui", "ui.js"), "utf-8");
html = html.replace('<script src="ui.js"></script>', `<script>\n${uiJs}\n</script>`);
fs.writeFileSync(path.join(distDir, "ui.html"), html);
console.log("✓ UI bundle created");

// 2. Read code.js and prepare HTML injection
let codeJs = fs.readFileSync(srcCodePath, "utf-8");

// 3. Create __html__ constant properly escaped
const htmlEscaped = JSON.stringify(html);

// 4. Replace the __html__ reference in showUI call with actual HTML
// This avoids the "not extensible" error
codeJs = codeJs.replace("figma.showUI(__html__, { width: 360, height: 640 });", `figma.showUI(${htmlEscaped}, { width: 360, height: 640 });`);

// 5. Save the final code.js
fs.writeFileSync(rootCodePath, codeJs);
console.log("✓ code.js created with inlined HTML");
