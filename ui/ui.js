const state = {
    currentStep: 1,
    files: [],
    parsedTokens: null,
    selectedCollection: 'new',
    existingCollections: []
};
// DOM Elements
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileQueue = document.getElementById('file-queue');
const queueList = document.getElementById('queue-list');
const collectionSelectBtn = document.getElementById('collection-select-btn');
const collectionSelectText = document.getElementById('collection-select-text');
const collectionList = document.getElementById('collection-list');
const collectionOptions = document.getElementById('collection-options');
const collectionSearch = document.getElementById('collection-search');
const previewContent = document.getElementById('preview-content');
const cancelBtn = document.getElementById('cancel-btn');
const backBtn = document.getElementById('back-btn');
const nextBtn = document.getElementById('next-btn');
const importBtn = document.getElementById('import-btn');
const importAnotherBtn = document.getElementById('import-another');
const successMessage = document.getElementById('success-message');
const toastContainer = document.getElementById('toast-container');
const addMoreBtn = document.getElementById('add-more-btn');
// Step Management
class StepManager {
    static updateStep(step) {
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
    static updateFooterButtons(step) {
        cancelBtn.style.display = step === 1 ? 'none' : 'block';
        backBtn.style.display = step === 2 ? 'block' : 'none';
        nextBtn.style.display = step === 1 && state.files.length > 0 ? 'block' : 'none';
        importBtn.style.display = step === 2 ? 'block' : 'none';
    }
    static next() {
        if (state.currentStep < 3) {
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
    static async handleFiles(files) {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => file.name.endsWith('.json') || file.name.endsWith('.csv'));
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
        // Parse the first file for preview
        if (state.files.length > 0) {
            await this.parseFirstFile();
            StepManager.updateFooterButtons(1);
        }
    }
    static updateFileQueue() {
        const emptyState = document.querySelector('[data-step="1"] .empty-state');
        if (state.files.length === 0) {
            fileQueue.style.display = 'none';
            if (emptyState)
                emptyState.style.display = 'flex';
            return;
        }
        // Hide drop zone, show file queue
        if (emptyState)
            emptyState.style.display = 'none';
        fileQueue.style.display = 'block';
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
    static removeFile(index) {
        state.files.splice(index, 1);
        this.updateFileQueue();
        StepManager.updateFooterButtons(1);
        if (state.files.length === 0) {
            state.parsedTokens = null;
            fileInput.value = '';
        }
        else {
            // Re-parse since the first file may have changed
            this.parseFirstFile();
        }
    }
    static async parseFirstFile() {
        if (state.files.length === 0)
            return;
        const file = state.files[0];
        const content = await file.text();
        const format = file.name.endsWith('.json') ? 'json' : 'csv';
        try {
            state.parsedTokens = format === 'json'
                ? parseJson(content)
                : parseCsv(content);
        }
        catch (error) {
            Toast.show(`Error parsing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            state.parsedTokens = null;
        }
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
    const files = e.target.files;
    if (files) {
        FileHandler.handleFiles(files);
    }
    // Reset file input so the same file can be selected again
    fileInput.value = '';
});
addMoreBtn.addEventListener('click', () => {
    fileInput.click();
});
// Toast Notifications
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        // Add icon based on type
        const icon = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        }[type];
        toast.innerHTML = `<span>${icon}</span> ${message}`;
        toastContainer.appendChild(toast);
        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}
/**
 * Parse JSON format tokens
 * Expected format: { "collection-name": { "variable-name": "value" } }
 */
function parseJson(content) {
    const data = JSON.parse(content);
    // Flatten nested structures if needed
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result[key] = value;
        }
        else {
            // If flat structure, use single collection name
            if (!result['Default'])
                result['Default'] = {};
            result['Default'][key] = value;
        }
    }
    return result;
}
/**
 * Parse CSV format tokens
 * Expected format:
 * collection,variable,value
 * Colors,primary-blue,#0066FF
 * Colors,secondary-red,#FF0000
 * Spacing,small,8px
 */
function parseCsv(content) {
    const lines = content.trim().split('\n');
    const result = {};
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const [collection, variable, value] = lines[i].split(',').map(s => s.trim());
        if (!collection || !variable || !value)
            continue;
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
function parseTokenValue(value) {
    // Boolean
    if (value.toLowerCase() === 'true')
        return true;
    if (value.toLowerCase() === 'false')
        return false;
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
    static updateCollectionList(collections) {
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
    static selectCollection(name) {
        state.selectedCollection = name;
        collectionSelectText.textContent = name === 'new' ? 'New Collection' : name;
        collectionList.classList.remove('open');
    }
    static filterCollections(query) {
        const lowerQuery = query.toLowerCase();
        const options = collectionOptions.querySelectorAll('.collection-option:not(.collection-option-new)');
        options.forEach((option) => {
            const text = option.textContent?.toLowerCase() || '';
            option.style.display = text.includes(lowerQuery) ? 'flex' : 'none';
        });
    }
}
// Collection dropdown handlers
collectionSelectBtn.addEventListener('click', () => {
    collectionList.classList.toggle('open');
    CollectionSelector.loadExistingCollections();
});
collectionSearch.addEventListener('input', (e) => {
    const query = e.target.value;
    CollectionSelector.filterCollections(query);
});
// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!collectionSelectBtn.contains(e.target) && !collectionList.contains(e.target)) {
        collectionList.classList.remove('open');
    }
});
/**
 * Show preview of parsed tokens
 */
function showPreview(tokens) {
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
function isColor(value) {
    // Hex color pattern
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3})$/.test(value))
        return true;
    // RGB/RGBA pattern
    if (/^rgba?\(/.test(value))
        return true;
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
                }
                else if (state.currentStep > 1) {
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
                if (state.currentStep === 1 && nextBtn.style.display !== 'none') {
                    nextBtn.click();
                }
                else if (state.currentStep === 2 && importBtn.style.display !== 'none') {
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
        if (!container)
            return;
        container.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab')
                return;
            const focusableElements = container.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
            const focusableArray = Array.from(focusableElements);
            const firstFocusable = focusableArray[0];
            const lastFocusable = focusableArray[focusableArray.length - 1];
            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
            }
            else if (!e.shiftKey && document.activeElement === lastFocusable) {
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
        Toast.show('Please select at least one file', 'warning');
        return;
    }
    // Parse and show preview
    await FileHandler.parseFirstFile();
    if (state.parsedTokens) {
        showPreview(state.parsedTokens);
        StepManager.next();
    }
    else {
        Toast.show('Failed to parse tokens', 'error');
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
            importBtn.innerHTML = '<i data-feather="download"></i> Import Tokens';
            if (typeof feather !== 'undefined')
                feather.replace();
            Toast.show('Import timed out — are you running inside Figma?', 'warning');
        }
    }, 5000);
});
importAnotherBtn.addEventListener('click', () => {
    StepManager.reset();
});
// Listen for messages from the main plugin
window.addEventListener('message', (event) => {
    const msg = event.data.pluginMessage;
    if (msg.type === 'import-success') {
        const tokenCount = msg.tokenCount || 0;
        successMessage.textContent = `${tokenCount} tokens have been imported to Figma`;
        StepManager.updateStep(3);
        Toast.show('Import successful!', 'success');
    }
    else if (msg.type === 'import-error') {
        Toast.show(`Import failed: ${msg.message}`, 'error');
        importBtn.disabled = false;
        importBtn.textContent = 'Import Tokens';
    }
    else if (msg.type === 'collections-list') {
        CollectionSelector.updateCollectionList(msg.collections || []);
    }
});
// Initialize keyboard handler
KeyboardHandler.init();
// Make FileHandler.removeFile available globally for onclick handlers
window.FileHandler = FileHandler;
//# sourceMappingURL=ui.js.map