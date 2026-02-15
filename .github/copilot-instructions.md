# Figma Token Importer Plugin - AI Instructions

## Project Overview

A TypeScript-based Figma plugin that imports design tokens from JSON/CSV files into Figma Variables. The plugin separates concerns between:

- **Plugin code** (`src/code.ts`): Runs in Figma context, handles variable creation and Figma API calls
- **UI code** (`ui/ui.ts`): Browser-based interface for file upload, parsing, and preview
- **Types** (`src/types.ts`): Shared type definitions

## Architecture & Data Flow

### Plugin Execution Model

1. User opens plugin → Figma loads `dist/code.js` (main) and `dist/ui.html` (UI iframe)
2. UI layer parses file (JSON/CSV) → sends `{type: 'import-tokens', tokens}` via `parent.postMessage()`
3. Main plugin receives via `figma.ui.onmessage` handler
4. Plugin creates/updates Figma Variables and Collections, posts response back to UI
5. UI updates status; user closes via `figma.closePlugin()`

### Token Structure

Tokens are normalized to `ParsedTokens` format (see [src/types.ts](src/types.ts)):

```typescript
Record<string, Record<string, string | number | boolean>>;
// Example: { "Colors": { "primary": "#0066FF" }, "Spacing": { "xs": 4 } }
```

### Type Detection & Conversion

In [src/code.ts](src/code.ts):

- `resolveVariableType()`: Determines Figma type (BOOLEAN, FLOAT, COLOR, STRING)
- `isColor()`: Detects hex, RGB/RGBA, and named colors
- `hexToRgba()`: Converts hex → Figma's RGBA format (0-1 normalized values)

## Build System & Workflow

### Build Command (npm run build)

```
tsc (TypeScript compilation) → node build-ui.js (bundle UI into HTML)
```

**Critical:** [build-ui.js](build-ui.js) injects compiled `dist/ui/ui.js` into the `<script>` tag placeholder in [ui/ui.html](ui/ui.html). The HTML
template references `<script src="ui.js"></script>` which gets replaced with inline JavaScript. **Do not modify this pattern** without understanding
the bundling process.

### Watch Mode

`npm run watch` rebuilds TypeScript continuously but requires manual `npm run build` afterward to update the UI bundle.

## File Format Handling

### JSON Format (parseJson in ui.ts)

- Expected: `{ "CollectionName": { "variableName": "value" } }`
- Flat structures default to "Default" collection
- Nested objects become variable collections

### CSV Format (parseCsv in ui.ts)

- Header: `collection,variable,value`
- Value parsing: `parseTokenValue()` converts "true"/"false" to boolean, numeric strings to numbers
- Detects presence of units (px, em) to keep as strings

## Key Patterns & Conventions

1. **Two-way Messaging Protocol**: Use `parent.postMessage()` (UI→Plugin) and `figma.ui.postMessage()` (Plugin→UI) with `{type: '...'}` message
   objects for clear intent
2. **Error Handling**: UI catches parsing errors; Plugin catches Figma API errors and warns on individual variable failures (doesn't halt entire
   import)
3. **Type Inference**: Automatic detection rather than requiring explicit type specification in token files
4. **Color Normalization**: All colors convert to 0-1 RGBA normalized values for Figma compatibility
5. **Variable Reuse**: Script reuses existing collections/variables by name instead of always creating new ones (prevents duplicates on re-import)

## Important Development Notes

- **Figma Types**: Plugin uses `declare const figma: any` (untyped). Refer to [Figma Plugin API docs](https://www.figma.com/developers/api) for
  available methods and behavior
- **UI Sandbox**: UI runs in iframe sandbox; can only communicate via `postMessage`, cannot directly access Figma API
- **Permissions**: [manifest.json](manifest.json) declares `"documentAccess": "full"` for full variable access
- **TypeScript Config**: Strict mode disabled (`"strict": false`) for flexibility with Figma's any-typed API
- **No External Dependencies**: Intentionally minimal (only @figma/plugin-typings, typescript, concurrently for dev)

## Testing Patterns

Use sample files:

- [sample-tokens.json](sample-tokens.json): Test nested JSON structure with mixed types
- [sample-tokens.csv](sample-tokens.csv): Test CSV parsing with type coercion

## Common Tasks

**Add new color format support**: Update `isColor()` regex and `hexToRgba()` function in [src/code.ts](src/code.ts)

**Add new variable type**: Update `resolveVariableType()` return type and add case in [src/code.ts](src/code.ts)

**Modify UI layout**: Edit [ui/ui.html](ui/ui.html); ensure `build-ui.js` script placeholder remains untouched

**Debug plugin behavior**: Use `figma.notify()` and browser console (UI messages) for diagnostics
