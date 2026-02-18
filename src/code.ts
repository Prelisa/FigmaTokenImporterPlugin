// Main plugin code - runs in Figma context
// This script handles variable creation and import logic

declare const figma: any;

// Types
type ParsedTokens = Record<string, Record<string, string | number | boolean>>;

// Show the UI (HTML will be injected by build script)
// @ts-ignore - __html__ is a placeholder replaced during build
figma.showUI(__html__, { width: 360, height: 640 });

// Listen for messages from the UI
figma.ui.onmessage = async (msg: any) => {
  if (msg.type === 'import-tokens') {
    try {
      const tokens = msg.tokens as ParsedTokens;
      const collectionName = msg.collectionName as string | null;
      const tokenCount = await importTokensToFigma(tokens, collectionName);
      figma.ui.postMessage({
        type: 'import-success',
        message: 'Tokens imported successfully!',
        tokenCount: tokenCount
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'import-error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  } else if (msg.type === 'get-collections') {
    try {
      const collections = await figma.variables.getLocalVariableCollections();
      const collectionNames = collections.map(c => c.name);
      figma.ui.postMessage({
        type: 'collections-list',
        collections: collectionNames
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'collections-list',
        collections: []
      });
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

/**
 * Import tokens into Figma variables
 * Creates variable collections and variables based on token structure
 * @returns The total number of tokens imported
 */
async function importTokensToFigma(tokens: ParsedTokens, preferredCollectionName: string | null = null): Promise<number> {
  const existingCollections = await figma.variables.getLocalVariableCollections();
  let totalTokens = 0;

  for (const [collectionName, variables] of Object.entries(tokens)) {
    // Use preferred collection name if provided and this is the first/only collection
    const targetCollectionName = preferredCollectionName && Object.keys(tokens).length === 1
      ? preferredCollectionName
      : collectionName;

    let collection = existingCollections.find((c: any) => c.name === targetCollectionName);

    // Create collection if it doesn't exist
    if (!collection) {
      collection = figma.variables.createVariableCollection(targetCollectionName);
    }

    const modeId = collection.defaultModeId;

    // Resolve all existing variables in this collection (getVariableById is async)
    const existingVariables = await Promise.all(
      collection.variableIds.map((id: string) => figma.variables.getVariableById(id))
    );

    // Create or update variables
    for (const [variableName, value] of Object.entries(variables)) {
      let variable = existingVariables.find((v: any) => v !== null && v.name === variableName);

      // Create variable if it doesn't exist
      if (!variable) {
        variable = figma.variables.createVariable(variableName, collection.id, resolveVariableType(value));
      }

      // Set the value in the default mode
      try {
        variable.setValueForMode(modeId, parseValue(value));
        totalTokens++;
      } catch (e) {
        console.warn(`Failed to set value for ${variableName}:`, e);
      }
    }
  }

  figma.notify(`✓ ${totalTokens} tokens imported successfully!`, { timeout: 3 });
  return totalTokens;
}

/**
 * Determine the Figma variable type based on the value
 */
function resolveVariableType(value: any): 'STRING' | 'BOOLEAN' | 'FLOAT' | 'COLOR' {
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'number') return 'FLOAT';
  if (typeof value === 'string') {
    // Check if it's a color (hex, rgb, or color name)
    if (isColor(value)) return 'COLOR';
    return 'STRING';
  }
  return 'STRING';
}

/**
 * Parse value to appropriate Figma format
 */
function parseValue(value: any): string | number | boolean | any {
  if (typeof value === 'string' && isColor(value)) {
    return hexToRgba(value);
  }
  return value;
}

/**
 * Check if a string is a valid color
 */
function isColor(value: string): boolean {
  // Hex color pattern
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value)) return true;
  // RGB/RGBA pattern
  if (/^rgba?\(/.test(value)) return true;
  // Named colors (add more as needed)
  const namedColors = ['red', 'blue', 'green', 'black', 'white', 'transparent'];
  return namedColors.includes(value.toLowerCase());
}

/**
 * Convert hex color to RGBA object
 */
function hexToRgba(hex: string): any {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: result[4] ? parseInt(result[4], 16) / 255 : 1
  };
}

// Note: figma.ui.onclose cannot be set due to Figma's security restrictions
// The plugin will close when the user clicks the X button
