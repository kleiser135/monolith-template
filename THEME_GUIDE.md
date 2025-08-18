# Theme System Documentation

This template includes a comprehensive semantic theme system built on top of Tailwind CSS. The theme provides consistent colors, typography, spacing, and component styles across your application.

## Overview

The theme system consists of:
- **Semantic color tokens** - Colors that adapt automatically to light/dark modes
- **Typography scale** - Consistent font sizes and line heights
- **Component classes** - Pre-built UI component styles
- **Utility classes** - Extended Tailwind utilities for common patterns

## Color System

### Core Semantic Colors

All colors automatically adapt between light and dark modes:

```css
/* Usage in components */
.my-component {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}
```

**Available color tokens:**
- `background` / `foreground` - Main page colors
- `primary` / `primary-foreground` - Brand colors
- `secondary` / `secondary-foreground` - Secondary actions
- `muted` / `muted-foreground` - Subdued content
- `accent` / `accent-foreground` - Highlighted content
- `destructive` / `destructive-foreground` - Error states
- `success` / `success-foreground` - Success states
- `warning` / `warning-foreground` - Warning states
- `info` / `info-foreground` - Info states
- `card` / `card-foreground` - Card backgrounds
- `popover` / `popover-foreground` - Overlay backgrounds
- `border` - Border colors
- `input` - Form input borders
- `ring` - Focus ring colors

### Using Colors in Tailwind

```tsx
// Background colors
<div className="bg-primary text-primary-foreground">
  Primary button
</div>

// Text colors
<p className="text-muted-foreground">
  Subdued text
</p>

// Border colors
<div className="border border-border">
  Card with border
</div>
```

## Typography System

### Semantic Font Sizes

The theme includes a semantic typography scale:

```tsx
// Display sizes (for headlines)
<h1 className="text-display-lg">Large Display</h1>
<h1 className="text-display-md">Medium Display</h1>
<h1 className="text-display-sm">Small Display</h1>

// Heading sizes
<h2 className="text-heading-lg">Large Heading</h2>
<h3 className="text-heading-md">Medium Heading</h3>
<h4 className="text-heading-sm">Small Heading</h4>

// Body text
<p className="text-body-lg">Large body text</p>
<p className="text-body-md">Regular body text</p>
<p className="text-body-sm">Small body text</p>

// Caption text
<span className="text-caption">Caption text</span>
```

### Font Families

Three semantic font stacks are available:

```tsx
// Sans-serif (default)
<p className="font-sans">Default text</p>

// Monospace (for code)
<code className="font-mono">Code text</code>

// Heading font (for emphasis)
<h1 className="font-heading">Special heading</h1>
```

## Component Classes

### Button Components

Pre-built button styles following the design system:

```tsx
// Base button with variants
<button className="btn btn-primary btn-md">Primary Button</button>
<button className="btn btn-secondary btn-md">Secondary Button</button>
<button className="btn btn-destructive btn-md">Delete Button</button>
<button className="btn btn-outline btn-md">Outline Button</button>
<button className="btn btn-ghost btn-md">Ghost Button</button>

// Button sizes
<button className="btn btn-primary btn-sm">Small</button>
<button className="btn btn-primary btn-md">Medium</button>
<button className="btn btn-primary btn-lg">Large</button>
```

### Form Components

```tsx
// Input field
<input className="input" placeholder="Enter text..." />

// Label
<label className="label">Field Label</label>

// Complete form field
<div>
  <label className="label" htmlFor="email">Email</label>
  <input id="email" className="input" type="email" />
</div>
```

### Card Components

```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
    <p className="card-description">Card description text</p>
  </div>
  <div className="card-content">
    <p>Card content goes here</p>
  </div>
  <div className="card-footer">
    <button className="btn btn-primary">Action</button>
  </div>
</div>
```

### Alert Components

```tsx
// Status alerts
<div className="alert alert-success">
  <p>Success message</p>
</div>

<div className="alert alert-warning">
  <p>Warning message</p>
</div>

<div className="alert alert-error">
  <p>Error message</p>
</div>

<div className="alert alert-info">
  <p>Info message</p>
</div>
```

## Utility Classes

### Layout Utilities

```tsx
// Container variants
<div className="container-narrow">Narrow content (45rem max)</div>
<div className="container-content">Content width (90rem max)</div>
<div className="container-prose">Prose width (65ch max)</div>

// Grid utilities
<div className="grid-auto-fit">Auto-fitting grid</div>
<div className="grid-auto-fill">Auto-filling grid</div>
```

### Animation Utilities

```tsx
// Basic animations
<div className="fade-in">Fades in</div>
<div className="slide-in-from-bottom">Slides in from bottom</div>
<div className="slide-in-from-top">Slides in from top</div>
<div className="scale-in">Scales in</div>

// Interactive animations
<button className="interactive">Hover and click effects</button>
<div className="hover-lift">Lifts on hover</div>
<div className="active-press">Presses on click</div>
```

### Focus Utilities

```tsx
// Focus ring
<button className="focus-ring">Accessible focus ring</button>
```

## Customization

### Changing Colors

To customize the color scheme, update the CSS variables in `src/app/globals.css`:

```css
:root {
  /* Update primary color */
  --primary: 220 90% 56%;           /* Blue primary */
  --primary-foreground: 0 0% 100%;  /* White text */
  
  /* Update success color */
  --success: 120 70% 45%;           /* Green success */
  --success-foreground: 0 0% 100%;  /* White text */
}
```

### Adding Custom Components

Create new component classes in the `@layer components` section:

```css
@layer components {
  .btn-custom {
    @apply btn bg-purple-500 text-white hover:bg-purple-600;
  }
  
  .card-special {
    @apply card border-purple-200 bg-purple-50;
  }
}
```

### Extending Typography

Add custom font sizes in `tailwind.config.ts`:

```typescript
fontSize: {
  // Add custom sizes
  'huge': ['5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
  'tiny': ['0.625rem', { lineHeight: '1.2' }],
}
```

### Custom Animations

Add new animations in `tailwind.config.ts`:

```typescript
keyframes: {
  'bounce-in': {
    '0%': { transform: 'scale(0.3)', opacity: '0' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
},
animation: {
  'bounce-in': 'bounce-in 0.5s ease-out',
}
```

## Best Practices

### Semantic Usage

Always use semantic color names rather than hardcoded colors:

```tsx
// ✅ Good - semantic colors
<div className="bg-primary text-primary-foreground">

// ❌ Avoid - hardcoded colors
<div className="bg-blue-500 text-white">
```

### Consistent Spacing

Use the spacing scale consistently:

```tsx
// ✅ Good - consistent spacing
<div className="p-4 mb-6 space-y-4">

// ❌ Avoid - arbitrary values
<div className="p-[17px] mb-[23px]">
```

### Component Composition

Build complex components by combining base classes:

```tsx
// ✅ Good - composable classes
<button className="btn btn-primary btn-lg interactive">
  
// ❌ Avoid - inline styles
<button style={{ background: '#007bff', padding: '12px 24px' }}>
```

### Accessibility

Always include focus states and proper contrast:

```tsx
// ✅ Good - accessible
<button className="btn btn-primary focus-ring">

// ❌ Avoid - poor accessibility
<button className="bg-gray-300 text-gray-400">
```

## Dark Mode

The theme automatically handles dark mode. All semantic colors have light and dark variants. To toggle dark mode:

```tsx
// Toggle dark mode
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])
  
  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="btn btn-ghost"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
```

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
