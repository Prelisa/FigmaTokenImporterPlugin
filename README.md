# Figma Token Importer Plugin

A Figma plugin that imports design tokens from JSON or CSV files directly into Figma Variables.

## Features

- 📥 Import tokens from JSON or CSV files
- 🎨 Automatic type detection (colors, numbers, strings, booleans)
- 📦 Create multiple variable collections
- 🎯 Preview tokens before import
- 🔄 Update existing variables

## Setup & Development

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Figma desktop app
- TypeScript knowledge (helpful)

### Installation

1. **Clone/Download this project:**

   ```bash
   cd /Users/prelisa/Documents/Fun\ Projects/FigmaTokenPlugin
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the plugin:**

   ```bash
   npm run build
   ```

4. **Load in Figma:**
   - Open Figma Desktop
   - Go to `Plugins` → `Development` → `New plugin`
   - Select the `manifest.json` from this folder
   - The plugin will appear in your menu

### Development

For live development with auto-recompile:

```bash
npm run watch
```

## File Format Guide

### JSON Format

Create a `.json` file with token collections and variables:

```json
{
  "Colors": {
    "primary": "#0066FF",
    "secondary": "#FF0000",
    "success": "#00CC00"
  },
  "Typography": {
    "heading-size": 32,
    "body-size": 14
  },
  "Spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32
  }
}
```

### CSV Format

Create a `.csv` file with three columns: `collection`, `variable`, `value`

```csv
collection,variable,value
Colors,primary,#0066FF
Colors,secondary,#FF0000
Colors,success,#00CC00
Typography,heading-size,32
Typography,body-size,14
Spacing,xs,4
Spacing,sm,8
Spacing,md,16
Spacing,lg,24
Spacing,xl,32
```

## How It Works

1. **UI Layer** (`ui/ui.ts`):
   - User selects file format (JSON/CSV)
   - Uploads file
   - Preview shows parsed tokens
   - Sends data to plugin when "Import" is clicked

2. **Main Plugin** (`src/code.ts`):
   - Receives parsed tokens
   - Detects variable types (color, number, string, boolean)
   - Creates variable collections
   - Creates/updates variables in Figma
   - Handles all Figma API interactions

3. **Type Detection**:
   - **Color**: Hex (#0066FF), RGB/RGBA, or color names
   - **Number**: Plain numbers without units
   - **String**: Text, values with units (8px, 0.5em)
   - **Boolean**: true/false

## Project Structure

```
FigmaTokenPlugin/
├── manifest.json          # Plugin configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── build-ui.js            # Build script
├── src/
│   └── code.ts            # Main plugin code (runs in Figma)
├── ui/
│   ├── ui.ts              # UI logic (runs in iframe)
│   └── ui.html            # UI layout
└── dist/                  # Compiled output
    ├── code.js
    ├── ui/
    │   └── ui.js
    └── ui.html
```

## Key Concepts

### Figma Variables API

The plugin uses the Figma Variables API to:

- Get existing variable collections: `figma.variables.getLocalVariableCollections()`
- Create collections: `figma.variables.createVariableCollection()`
- Create variables: `figma.variables.createVariable()`
- Set values: `variable.setValueForMode()`

### Communication

The plugin communicates between UI and main code via messages:

```typescript
// From UI to main code
parent.postMessage({ pluginMessage: { type: "import-tokens", tokens } }, "*");

// From main code to UI
figma.ui.postMessage({ type: "import-success", message: "..." });
```

## Customization Ideas

1. **Add more token types**: Shadows, gradients, opacity
2. **Support nested tokens**: Auto-flatten or use naming conventions
3. **Token validation**: Ensure format/color validity before import
4. **Export feature**: Export Figma variables back to JSON/CSV
5. **Token versioning**: Track changes and allow rollback
6. **Design token standards**: Support Figma Tokens plugin format
7. **Mode support**: Create variables for different modes (light/dark)

## Troubleshooting

**Plugin not loading:**

- Check manifest.json is valid JSON
- Ensure dist folder exists with compiled files
- Try rebuilding: `npm run build`

**Variables not creating:**

- Check browser console (Plugins → View on development)
- Verify token format matches expected structure
- Ensure variable names are unique within collection

**Type conversion issues:**

- Hex colors must be 6 or 8 characters (#RRGGBB or #RRGGBBAA)
- Numbers without units are treated as FLOAT type
- RGB values must be 0-255

## Resources

- [Figma Plugin API Docs](https://www.figma.com/plugin-docs/)
- [Figma Variables API](https://www.figma.com/plugin-docs/api/variables/)
- [Design Tokens Format Module](https://design-tokens.github.io/format-module/)

## Next Steps

1. Try building the plugin and loading it in Figma
2. Test with sample JSON/CSV files
3. Explore the Figma API docs for advanced features
4. Consider adding features like token validation or export
5. Share your tokens across team files

Happy coding! 🚀
# FigmaTokenImporterPlugin
