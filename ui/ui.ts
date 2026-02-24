// UI script - handles file upload and parsing

type ParsedTokens = Record<string, Record<string, string | number | boolean>>;

// State Management
interface AppState {
  currentStep: number;
  files: File[];
  parsedTokens: ParsedTokens | null;
  selectedCollection: string;
  existingCollections: string[];
}

const state: AppState = {
  currentStep: 1,
  files: [],
  parsedTokens: null,
  selectedCollection: 'new',
  existingCollections: []
};

// DOM Elements
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const fileQueue = document.getElementById('file-queue') as HTMLDivElement;
const queueList = document.getElementById('queue-list') as HTMLDivElement;
const collectionSelectBtn = document.getElementById('collection-select-btn') as HTMLButtonElement;
const collectionSelectText = document.getElementById('collection-select-text') as HTMLSpanElement;
const collectionList = document.getElementById('collection-list') as HTMLDivElement;
const collectionOptions = document.getElementById('collection-options') as HTMLDivElement;
const collectionSearch = document.getElementById('collection-search') as HTMLInputElement;
const previewContent = document.getElementById('preview-content') as HTMLDivElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
const backBtn = document.getElementById('back-btn') as HTMLButtonElement;
const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
const importAnotherBtn = document.getElementById('import-another') as HTMLButtonElement;
const closeBtn = document.getElementById('close-btn') as HTMLButtonElement;
const successMessage = document.getElementById('success-message') as HTMLDivElement;
const toastContainer = document.getElementById('toast-container') as HTMLDivElement;
const addMoreBtn = document.getElementById('add-more-btn') as HTMLButtonElement;

// Step Management
class StepManager {
  static updateStep(step: number) {
    state.currentStep = step;

    // Update step containers
    document.querySelectorAll('.step-container').forEach(container => {
      const stepNum = parseInt(container.getAttribute('data-step') || '0');
      container.setAttribute('data-active', stepNum === step ? 'true' : 'false');
    });

    // Update step indicators — done (green) for completed, active (blue) for current
    document.querySelectorAll('.step-dot').forEach(dot => {
      const stepNum = parseInt(dot.getAttribute('data-step') || '0');
      dot.classList.toggle('done', stepNum < step);
      dot.classList.toggle('active', stepNum === step);
    });

    // Update footer buttons
    this.updateFooterButtons(step);
  }

  static updateFooterButtons(step: number) {
    backBtn.style.display = step === 3 ? 'block' : 'none';
    cancelBtn.style.display = step === 3 ? 'block' : 'none';
    nextBtn.style.display = step === 2 ? 'block' : 'none';
    importBtn.style.display = step === 3 ? 'block' : 'none';
    closeBtn.style.display = step === 4 ? 'block' : 'none';
  }

  static next() {
    if (state.currentStep < 4) {
      this.updateStep(state.currentStep + 1);
    }
  }

  static back() {
    if (state.currentStep > 1) {
      this.updateStep(state.currentStep - 1);
    }
  }

  static reset() {
    state.files = [];
    state.parsedTokens = null;
    state.selectedCollection = 'new';
    fileInput.value = '';
    FileHandler.updateFileQueue();
    this.updateStep(1);
  }
}

// File Handling
class FileHandler {
  static async handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file =>
      file.name.endsWith('.json') || file.name.endsWith('.csv')
    );

    if (validFiles.length === 0) {
      Toast.show('Please select JSON or CSV files', 'error');
      return;
    }

    // Append new files, deduplicating by filename
    const existingNames = new Set(state.files.map(f => f.name));
    const newFiles = validFiles.filter(f => !existingNames.has(f.name));
    state.files.push(...newFiles);

    if (newFiles.length < validFiles.length) {
      const dupeCount = validFiles.length - newFiles.length;
      Toast.show(`${dupeCount} duplicate file(s) skipped`, 'warning');
    }

    this.updateFileQueue();

    // Parse the first file for preview and go to step 2
    if (state.files.length > 0) {
      await this.parseFirstFile();
      if (state.currentStep === 1) {
        StepManager.updateStep(2);
      }
    }
  }

  static updateFileQueue() {
    if (state.files.length === 0) {
      StepManager.updateStep(1);
      return;
    }

    queueList.innerHTML = '';

    state.files.forEach((file, index) => {
      const queueItem = document.createElement('div');
      queueItem.className = 'queue-item';
      queueItem.innerHTML = `
        <div class="queue-item-name">${file.name}</div>
        <div class="queue-item-status caption">${(file.size / 1024).toFixed(1)} KB</div>
        <button class="text" onclick="FileHandler.removeFile(${index})">×</button>
      `;
      queueList.appendChild(queueItem);
    });
  }

  static removeFile(index: number) {
    state.files.splice(index, 1);
    this.updateFileQueue();

    if (state.files.length === 0) {
      state.parsedTokens = null;
      fileInput.value = '';
    } else {
      // Re-parse since the first file may have changed
      this.parseFirstFile();
    }
  }

  static async parseFirstFile() {
    if (state.files.length === 0) return;

    const file = state.files[0];
    const content = await file.text();
    const format = file.name.endsWith('.json') ? 'json' : 'csv';

    try {
      state.parsedTokens = format === 'json'
        ? parseJson(content)
        : parseCsv(content);
    } catch (error) {
      Toast.show(`Error parsing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      state.parsedTokens = null;
    }
  }
}

// Toast Notifications
class Toast {
  static show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }[type];

    toast.innerHTML = `<span>${icon}</span> ${message}`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Drag and Drop
dropZone.addEventListener('click', () => {
  fileInput.click();
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');

  const files = e.dataTransfer?.files;
  if (files) {
    FileHandler.handleFiles(files);
  }
});

fileInput.addEventListener('change', (e) => {
  const files = (e.target as HTMLInputElement).files;
  if (files) {
    FileHandler.handleFiles(files);
  }
  // Reset file input so the same file can be selected again
  fileInput.value = '';
});

addMoreBtn.addEventListener('click', () => {
  fileInput.click();
});

/**
 * Parse JSON format tokens
 * Expected format: { "collection-name": { "variable-name": "value" } }
 */
function parseJson(content: string): ParsedTokens {
  const data = JSON.parse(content);

  // Check if this is DTCG format (tokens have $value property)
  const isDTCG = containsDTCGTokens(data);

  if (isDTCG) {
    return parseDTCGTokens(data);
  }

  // Simple format: { "CollectionName": { "variableName": "value" } }
  const result: ParsedTokens = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check if this is a flat collection (values are primitives) or nested structure
      const valueObj = value as Record<string, any>;
      const hasOnlyPrimitives = Object.values(valueObj).every(
        v => typeof v !== 'object' || v === null
      );

      if (hasOnlyPrimitives) {
        result[key] = valueObj;
      } else {
        // Nested structure without $value - flatten it
        if (!result[key]) result[key] = {};
        flattenObject(valueObj, result[key], '');
      }
    } else {
      // If flat structure, use single collection name
      if (!result['Default']) result['Default'] = {};
      result['Default'][key] = value as string | number | boolean;
    }
  }

  return result;
}

/**
 * Check if the data contains DTCG-format tokens (with $value property)
 */
function containsDTCGTokens(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  if ('$value' in obj) return true;

  for (const value of Object.values(obj)) {
    if (containsDTCGTokens(value)) return true;
  }
  return false;
}

/**
 * Parse DTCG (Design Tokens Community Group) format tokens
 * Tokens have { "$value": "...", "$type": "..." } structure
 */
function parseDTCGTokens(data: any): ParsedTokens {
  const result: ParsedTokens = {};

  function traverse(obj: any, path: string[], collectionName: string) {
    if (typeof obj !== 'object' || obj === null) return;

    // Check if this is a token (has $value)
    if ('$value' in obj) {
      const variableName = path.join('/');
      if (!result[collectionName]) result[collectionName] = {};

      // Extract the actual value
      let value = obj['$value'];

      // Parse the value to appropriate type
      if (typeof value === 'string') {
        value = parseTokenValue(value);
      }

      result[collectionName][variableName] = value;
      return;
    }

    // Otherwise, traverse deeper
    for (const [key, value] of Object.entries(obj)) {
      // Skip metadata keys
      if (key.startsWith('$')) continue;

      // Use first level as collection name
      if (path.length === 0) {
        traverse(value, [], key);
      } else {
        traverse(value, [...path, key], collectionName);
      }
    }
  }

  traverse(data, [], 'Default');
  return result;
}

/**
 * Flatten a nested object into variable names with path separators
 */
function flattenObject(obj: Record<string, any>, result: Record<string, any>, prefix: string) {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}/${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattenObject(value, result, newKey);
    } else {
      result[newKey] = value;
    }
  }
}

/**
 * Parse CSV format tokens
 * Expected format:
 * collection,variable,value
 * Colors,primary-blue,#0066FF
 * Colors,secondary-red,#FF0000
 * Spacing,small,8px
 */
function parseCsv(content: string): ParsedTokens {
  const lines = content.trim().split('\n');
  const result: ParsedTokens = {};

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const [collection, variable, value] = lines[i].split(',').map(s => s.trim());

    if (!collection || !variable || !value) continue;

    if (!result[collection]) {
      result[collection] = {};
    }

    result[collection][variable] = parseTokenValue(value);
  }

  return result;
}

/**
 * Parse token value - try to convert to appropriate type
 */
function parseTokenValue(value: string): string | number | boolean {
  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Number (without units)
  if (!isNaN(Number(value)) && !value.includes('px') && !value.includes('em')) {
    return Number(value);
  }

  // String (including values with units)
  return value;
}

// Collection Selector
class CollectionSelector {
  static async loadExistingCollections() {
    // Request existing collections from the plugin
    parent.postMessage({ pluginMessage: { type: 'get-collections' } }, '*');
  }

  static updateCollectionList(collections: string[]) {
    state.existingCollections = collections;
    collectionOptions.innerHTML = '';

    // Add "New Collection" option
    const newOption = document.createElement('div');
    newOption.className = 'collection-option collection-option-new';
    newOption.innerHTML = `
      <span>+ New Collection</span>
    `;
    newOption.onclick = () => this.selectCollection('new');
    collectionOptions.appendChild(newOption);

    // Add existing collections
    collections.forEach(name => {
      const option = document.createElement('div');
      option.className = 'collection-option';
      option.innerHTML = `
        <span>${name}</span>
        <span class="collection-badge">Existing</span>
      `;
      option.onclick = () => this.selectCollection(name);
      collectionOptions.appendChild(option);
    });

    // Show search if more than 10 collections
    if (collections.length > 10) {
      collectionSearch.style.display = 'block';
    }
  }

  static selectCollection(name: string) {
    state.selectedCollection = name;
    collectionSelectText.textContent = name === 'new' ? 'New Collection' : name;
    collectionList.classList.remove('open');
  }

  static filterCollections(query: string) {
    const lowerQuery = query.toLowerCase();
    const options = collectionOptions.querySelectorAll('.collection-option:not(.collection-option-new)');

    options.forEach((option: Element) => {
      const text = option.textContent?.toLowerCase() || '';
      (option as HTMLElement).style.display = text.includes(lowerQuery) ? 'flex' : 'none';
    });
  }
}

// Collection dropdown handlers
collectionSelectBtn.addEventListener('click', () => {
  collectionList.classList.toggle('open');
  CollectionSelector.loadExistingCollections();
});

collectionSearch.addEventListener('input', (e) => {
  const query = (e.target as HTMLInputElement).value;
  CollectionSelector.filterCollections(query);
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!collectionSelectBtn.contains(e.target as Node) && !collectionList.contains(e.target as Node)) {
    collectionList.classList.remove('open');
  }
});

/**
 * Show preview of parsed tokens
 */
function showPreview(tokens: ParsedTokens): void {
  previewContent.innerHTML = '';

  for (const [collection, variables] of Object.entries(tokens)) {
    const group = document.createElement('div');
    group.className = 'token-group';

    const header = document.createElement('div');
    header.className = 'token-group-header';
    header.innerHTML = `
      <span>${collection}</span>
      <span class="token-count">${Object.keys(variables).length} tokens</span>
    `;
    group.appendChild(header);

    const list = document.createElement('div');
    list.className = 'token-list';

    // Show first 10 tokens, then add "and X more..."
    const entries = Object.entries(variables);
    const displayCount = Math.min(10, entries.length);

    for (let i = 0; i < displayCount; i++) {
      const [name, value] = entries[i];
      const item = document.createElement('div');
      item.className = 'token-item';

      // Check if it's a color
      const isColorValue = typeof value === 'string' && isColor(value);

      item.innerHTML = `
        <span class="token-name">${name}</span>
        <div class="token-value">
          ${isColorValue ? `<div class="color-swatch" style="background: ${value}"></div>` : ''}
          <span class="mono">${JSON.stringify(value)}</span>
        </div>
      `;
      list.appendChild(item);
    }

    if (entries.length > displayCount) {
      const more = document.createElement('div');
      more.className = 'token-item';
      more.innerHTML = `<span class="caption">...and ${entries.length - displayCount} more</span>`;
      list.appendChild(more);
    }

    group.appendChild(list);
    previewContent.appendChild(group);
  }
}

// Helper function to check if a string is a color
function isColor(value: string): boolean {
  // Hex color pattern
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3})$/.test(value)) return true;
  // RGB/RGBA pattern
  if (/^rgba?\(/.test(value)) return true;
  // Named colors
  const namedColors = ['red', 'blue', 'green', 'black', 'white', 'transparent'];
  return namedColors.includes(value.toLowerCase());
}

// Keyboard Navigation
class KeyboardHandler {
  static init() {
    document.addEventListener('keydown', (e) => {
      // Escape key
      if (e.key === 'Escape') {
        if (collectionList.classList.contains('open')) {
          collectionList.classList.remove('open');
        } else if (state.currentStep > 1) {
          StepManager.back();
        }
      }

      // Enter key
      if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;

        // Don't interfere with input fields
        if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
          return;
        }

        // Trigger next/import based on current step
        if (state.currentStep === 2 && nextBtn.style.display !== 'none') {
          nextBtn.click();
        } else if (state.currentStep === 3 && importBtn.style.display !== 'none') {
          importBtn.click();
        }
      }

      // Cmd/Ctrl + V for paste
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        // Focus on file input area if on step 1
        if (state.currentStep === 1) {
          fileInput.focus();
        }
      }

      // Cmd/Ctrl + O for open file
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        if (state.currentStep === 1) {
          fileInput.click();
        }
      }
    });

    // Tab navigation enhancement
    this.setupTabTrapping();
  }

  static setupTabTrapping() {
    const container = document.querySelector('.container');
    if (!container) return;

    container.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const focusableArray = Array.from(focusableElements) as HTMLElement[];
      const firstFocusable = focusableArray[0];
      const lastFocusable = focusableArray[focusableArray.length - 1];

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    });
  }
}

// Footer button handlers
cancelBtn.addEventListener('click', () => {
  StepManager.reset();
});

backBtn.addEventListener('click', () => {
  StepManager.back();
});

nextBtn.addEventListener('click', async () => {
  if (state.files.length === 0) {
    return;
  }

  // Parse and show preview
  await FileHandler.parseFirstFile();

  if (state.parsedTokens) {
    showPreview(state.parsedTokens);
    StepManager.next();
  }
});

importBtn.addEventListener('click', async () => {
  if (!state.parsedTokens) {
    Toast.show('No tokens to import', 'error');
    return;
  }

  importBtn.disabled = true;
  importBtn.innerHTML = '<div class="spinner"></div> Importing...';

  // Send tokens to the main plugin code
  parent.postMessage({
    pluginMessage: {
      type: 'import-tokens',
      tokens: state.parsedTokens,
      collectionName: state.selectedCollection === 'new' ? null : state.selectedCollection
    }
  }, '*');

  // Timeout: recover if no response from Figma within 5 seconds
  setTimeout(() => {
    if (importBtn.disabled) {
      importBtn.disabled = false;
      importBtn.textContent = 'Import Tokens';
      Toast.show('Import timed out — are you running inside Figma?', 'warning');
    }
  }, 5000);
});

importAnotherBtn.addEventListener('click', () => {
  StepManager.reset();
});

closeBtn.addEventListener('click', () => {
  parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
});

// Listen for messages from the main plugin
window.addEventListener('message', (event: MessageEvent) => {
  const msg = event.data?.pluginMessage;
  if (!msg) return;

  if (msg.type === 'import-success') {
    const tokenCount = msg.tokenCount || 0;
    successMessage.textContent = `${tokenCount} tokens have been imported to Figma`;
    StepManager.updateStep(4);
  } else if (msg.type === 'import-error') {
    Toast.show(`Import failed: ${msg.message}`, 'error');
    importBtn.disabled = false;
    importBtn.textContent = 'Import Tokens';
  } else if (msg.type === 'collections-list') {
    CollectionSelector.updateCollectionList(msg.collections || []);
  }
});

// Initialize keyboard handler
KeyboardHandler.init();

// Make FileHandler.removeFile available globally for onclick handlers
(window as any).FileHandler = FileHandler;
