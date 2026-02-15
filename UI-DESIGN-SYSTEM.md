# Figma Token Importer - UI Design System & Research

## 📊 Research Overview

### User Flow Analysis

Based on the UI flow mockups in `/UIFlow/` directory, the plugin follows a clear 3-step progressive disclosure pattern:

1. **Initial State** - Empty state with file upload
2. **Configuration State** - Collection selection and token preview
3. **Success State** - Confirmation with toast notifications

### Design Principles

#### 1. Minimalism First

- Remove all unnecessary visual elements
- Use whitespace as primary separator
- Single accent color for actions
- Typography-driven hierarchy

#### 2. Progressive Disclosure

- Show only relevant options at each step
- Hide complexity until needed
- Smart defaults to reduce decisions
- Contextual help appears inline

#### 3. Immediate Feedback

- Instant file format detection
- Live preview while typing
- Micro-animations for state changes
- Clear success/error states

## 🎨 Design System

### Color Palette

| Token          | Value     | Usage                         |
| -------------- | --------- | ----------------------------- |
| **Primary**    | `#0D0D0D` | Main text, headers            |
| **Secondary**  | `#6B6B6B` | Secondary text, placeholders  |
| **Accent**     | `#0066FF` | Primary actions, links, focus |
| **Success**    | `#00C896` | Success states, confirmations |
| **Warning**    | `#F5A623` | Warning states, caution       |
| **Error**      | `#F24822` | Error states, validation      |
| **Background** | `#FFFFFF` | Main background               |
| **Surface**    | `#FAFAFA` | Cards, elevated surfaces      |
| **Border**     | `#E5E5E5` | Dividers, borders             |
| **Hover**      | `#F5F5F5` | Interactive hover states      |

### Typography Scale

```css
/* Display - Main title */
font-family:
  "Inter",
  -apple-system,
  BlinkMacSystemFont;
font-size: 20px;
line-height: 28px;
font-weight: 600;
letter-spacing: -0.02em;

/* Title - Section headers */
font-size: 14px;
line-height: 20px;
font-weight: 500;
letter-spacing: -0.01em;

/* Body - Default text */
font-size: 13px;
line-height: 18px;
font-weight: 400;

/* Caption - Help text */
font-size: 11px;
line-height: 16px;
font-weight: 400;
color: #6b6b6b;

/* Mono - Code/tokens */
font-family: "SF Mono", "Monaco", monospace;
font-size: 11px;
line-height: 16px;
```

### Spacing System (8px Grid)

```css
--space-xs: 4px; /* Inline elements */
--space-sm: 8px; /* Related items */
--space-md: 16px; /* Sections */
--space-lg: 24px; /* Major sections */
--space-xl: 32px; /* Screen padding */
```

### Component Specifications

#### Buttons

```css
/* Primary Button */
height: 32px;
padding: 0 16px;
background: #0066ff;
color: white;
border-radius: 6px;
font-size: 13px;
font-weight: 500;
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover State */
transform: translateY(-1px);
box-shadow: 0 2px 8px rgba(0, 102, 255, 0.2);

/* Disabled State */
background: #e5e5e5;
color: #6b6b6b;
cursor: not-allowed;
```

#### Input Fields

```css
height: 32px;
padding: 0 12px;
border: 1px solid #e5e5e5;
border-radius: 6px;
font-size: 13px;
transition: border-color 0.2s ease;

/* Focus State */
border-color: #0066ff;
outline: none;
box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
```

#### Cards

```css
background: #fafafa;
border-radius: 8px;
padding: 16px;
/* No borders - use background for definition */
```

## 🏗 Component Architecture

### 1. Step Manager

Handles the multi-step flow with smooth transitions between states.

```typescript
interface StepManager {
  currentStep: number;
  totalSteps: number;
  next(): void;
  previous(): void;
  goToStep(step: number): void;
  onStepChange: (step: number) => void;
}
```

### 2. File Uploader

Drag-and-drop enabled file upload with format detection.

**Features:**

- Drag-and-drop zone with visual feedback
- Automatic format detection from extension
- File validation before upload
- Queue support for multiple files

### 3. Collection Selector

Smart collection management with search and filtering.

**States:**

- New collection creation
- Add to existing collection
- Replace existing collection
- Merge with existing tokens

### 4. Token Preview

Visual representation of parsed tokens before import.

**Display Modes:**

- Compact view (default)
- Detailed view (expandable)
- Group by type (colors, spacing, typography)
- Search/filter capabilities

### 5. Queue Manager

Handle multiple file imports efficiently.

```typescript
interface QueueItem {
  file: File;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  result?: ImportResult;
}
```

### 6. Toast Notifier

Non-blocking feedback system.

**Properties:**

- Position: Top-center
- Duration: 3s auto-dismiss
- Stackable with 8px gap
- Types: success, error, warning, info

### 7. Keyboard Handler

Complete keyboard navigation support.

| Key           | Action                         |
| ------------- | ------------------------------ |
| Tab/Shift+Tab | Navigate between elements      |
| Enter/Space   | Activate buttons               |
| Escape        | Cancel operations/close modals |
| Cmd/Ctrl+V    | Paste JSON directly            |
| Cmd/Ctrl+O    | Open file picker               |
| Arrow Keys    | Navigate lists/options         |

## 🎭 Micro-interactions

### Animation Timing Functions

```css
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
```

### State Transitions

1. **Button Hover**
   - Transform: translateY(-1px)
   - Shadow: 0 2px 8px rgba(0,102,255,0.2)
   - Duration: 200ms

2. **Focus States**
   - Outline: 2px solid #0066FF
   - Outline-offset: 2px
   - No color change

3. **Loading States**
   - Spinner: 16px, 2px stroke
   - Rotation: 360deg/1s linear infinite
   - Fade in: 200ms

4. **Success Animation**
   - Checkmark path animation
   - Duration: 400ms ease-out
   - Scale: 0.8 → 1.0

## 🔄 User Flow States

### Step 1: Initial Upload

```
┌─────────────────────────┐
│  [Light illustration]   │
│    Drag file here or    │
│    click to browse      │
│                         │
│  ┌──────────────────┐   │
│  │  Choose File     │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

### Step 2: Configuration

```
┌─────────────────────────┐
│  ✓ tokens.json loaded  │
│                         │
│  Import to:             │
│  ┌──────────────────┐   │
│  │ ▼ New Collection │   │
│  └──────────────────┘   │
│                         │
│  Preview (25 tokens):   │
│  ┌──────────────────┐   │
│  │ • primary: #000  │   │
│  │ • spacing: 8px   │   │
│  │ • ...            │   │
│  └──────────────────┘   │
│                         │
│  [Cancel]  [Import]     │
└─────────────────────────┘
```

### Step 3: Success

```
┌─────────────────────────┐
│      ✓ Success          │
│  25 tokens imported     │
└─────────────────────────┘
    (Toast notification)
```

## 📱 Responsive Behavior

### Breakpoints

- **Minimum width**: 400px
- **Default width**: 600px
- **Maximum width**: 800px

### Adaptive Elements

1. **Token preview**: Virtual scrolling after 100 items
2. **Collection list**: Searchable after 10 items
3. **File queue**: Collapsible after 5 files
4. **Toast stack**: Maximum 3 visible, others queued

## ♿ Accessibility

### WCAG 2.1 AA Compliance

- Color contrast: Minimum 4.5:1 for normal text
- Focus indicators: Visible on all interactive elements
- Keyboard navigation: Full support
- Screen reader: ARIA labels and live regions
- Error messages: Clear and actionable

### Focus Management

```typescript
// Focus trap within modal
const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
```

## 🚀 Performance Optimizations

### Rendering

- Virtual scrolling for large lists
- Debounced search (300ms)
- Lazy loading for preview data
- Request animation frame for animations

### Memory

- Cleanup event listeners on unmount
- Limit preview to first 100 tokens
- Clear file references after import
- Use WeakMap for component cache

## 📝 Implementation Notes

### CSS Architecture

- Use CSS custom properties for theming
- BEM methodology for class naming
- Utility classes for common patterns
- CSS Grid for layout, Flexbox for components

### JavaScript Patterns

- Event delegation for dynamic content
- Pub/sub for component communication
- Factory pattern for toast creation
- Observer pattern for step changes

### Testing Considerations

- Unit tests for token parsing
- Integration tests for file upload
- Visual regression tests for UI states
- Accessibility audits with axe-core

## 🎯 Success Metrics

### Usability Goals

- Time to first import: < 30 seconds
- Error rate: < 5%
- Task completion: > 95%
- User satisfaction: > 4.5/5

### Performance Goals

- Initial load: < 500ms
- File parse: < 100ms per 1000 tokens
- UI response: < 100ms
- Animation FPS: 60fps consistent

## 📚 References

### Design Inspiration

- Figma's native UI patterns
- Linear's command palette
- Stripe's form design
- Vercel's deployment flow

### Technical Resources

- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Motion](https://material.io/design/motion)
- [Inclusive Components](https://inclusive-components.design/)

---

_Last updated: February 15, 2026_ _Version: 1.0.0_
