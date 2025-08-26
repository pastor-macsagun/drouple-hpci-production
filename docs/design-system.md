# HPCI-ChMS Design System

## Overview
This document defines the design patterns, components, and guidelines for maintaining a consistent user experience across the HPCI Church Management System.

## Core Principles

### 1. Clarity First
Every interface element should have a clear purpose and be immediately understandable.

### 2. Consistency
Use established patterns throughout the application to reduce cognitive load.

### 3. Accessibility
Design for all users, ensuring WCAG AA compliance.

### 4. Performance
Optimize for fast loading and smooth interactions.

### 5. Responsiveness
Design mobile-first, then enhance for larger screens.

## Color System

### Brand Colors
```css
/* Primary - Sacred Blue */
--primary-hsl: 217 91% 48%;
--primary-rgb: rgb(30, 124, 232);
--primary-hex: #1e7ce8;

/* Secondary - Soft Gold */
--secondary-hsl: 43 74% 66%;
--secondary-rgb: rgb(229, 196, 83);
--secondary-hex: #e5c453;
```

### Semantic Colors
```css
/* Success - Green */
--success: 142 71% 45%;

/* Warning - Amber */
--warning: 38 92% 50%;

/* Destructive - Red */
--destructive: 0 84% 60%;

/* Info - Light Blue */
--info: 199 89% 48%;
```

### Neutral Palette
```css
/* Light Mode */
--background: white;
--foreground: rgb(46, 52, 64);
--muted: rgb(245, 245, 247);
--accent: rgb(240, 244, 248);

/* Dark Mode */
--background-dark: rgb(24, 28, 38);
--foreground-dark: rgb(248, 250, 252);
--muted-dark: rgb(39, 45, 58);
--accent-dark: rgb(46, 52, 64);
```

## Typography

### Font Stack
```css
--font-sans: Inter, system-ui, -apple-system, sans-serif;
--font-mono: 'Fira Code', ui-monospace, monospace;
```

### Type Scale
```css
/* Headings */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System

### Base Unit
All spacing follows an 8px base unit system.

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

## Component Patterns

### Cards
```tsx
// Standard Card
<Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Stat Card
<Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-semibold text-muted-foreground">
      Metric Name
    </CardTitle>
    <div className="p-2 bg-primary/10 rounded-lg">
      <Icon className="h-4 w-4 text-primary" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">123</div>
    <p className="text-xs text-muted-foreground mt-1">
      Additional context
    </p>
  </CardContent>
</Card>
```

### Buttons

#### Primary Button
```tsx
<Button className="shadow-sm">
  Primary Action
</Button>
```

#### Secondary Button
```tsx
<Button variant="secondary">
  Secondary Action
</Button>
```

#### Outline Button
```tsx
<Button variant="outline" className="hover:bg-primary hover:text-primary-foreground">
  Outline Action
</Button>
```

#### Ghost Button
```tsx
<Button variant="ghost">
  Ghost Action
</Button>
```

#### Icon Button
```tsx
<Button size="icon" variant="ghost">
  <Icon className="h-4 w-4" />
</Button>
```

### Forms

#### Input Field
```tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input 
    id="field"
    type="text"
    placeholder="Enter value..."
    className="focus:ring-2 focus:ring-primary"
  />
  <p className="text-xs text-muted-foreground">
    Helper text
  </p>
</div>
```

#### Select Field
```tsx
<div className="space-y-2">
  <Label htmlFor="select">Select Option</Label>
  <Select>
    <SelectTrigger id="select">
      <SelectValue placeholder="Choose..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">Option 1</SelectItem>
      <SelectItem value="option2">Option 2</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Tables

#### Data Table
```tsx
<div className="rounded-lg border border-border/50 overflow-hidden">
  <Table>
    <TableHeader className="bg-muted/50">
      <TableRow>
        <TableHead>Column 1</TableHead>
        <TableHead>Column 2</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="hover:bg-muted/50">
        <TableCell>Data 1</TableCell>
        <TableCell>Data 2</TableCell>
        <TableCell className="text-right">
          <Button size="sm" variant="ghost">
            Edit
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### Empty States
```tsx
<EmptyState
  icon={<Icon className="h-10 w-10" />}
  title="No items found"
  description="Get started by creating your first item"
  action={{
    label: "Create Item",
    onClick: handleCreate
  }}
/>
```

### Loading States
```tsx
// Inline Spinner
<Spinner size="sm" />

// Loading Card
<LoadingCard message="Loading data..." />

// Skeleton Loader
<div className="space-y-3">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>
```

## Layout Patterns

### Page Layout
```tsx
<AppLayout user={user}>
  <PageHeader
    title="Page Title"
    description="Page description"
  />
  <div className="space-y-6">
    {/* Page content */}
  </div>
</AppLayout>
```

### Grid Layouts
```tsx
// Responsive Card Grid
<div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  {/* Cards */}
</div>

// Two Column Layout
<div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div>
    {/* Sidebar */}
  </div>
</div>
```

### Section Spacing
```tsx
// Page sections
<div className="space-y-8">
  <section>
    <h2 className="text-2xl font-semibold mb-4">Section Title</h2>
    {/* Section content */}
  </section>
</div>
```

## Icons

### Icon Usage Guidelines
- Use Lucide icons consistently
- Default size: 16px (h-4 w-4)
- Large icons: 24px (h-6 w-6)
- Icon-only buttons must have aria-label
- Use semantic icons that match the action

### Common Icon Mappings
```tsx
// Navigation
Home, Users, Calendar, Route, Settings

// Actions
Plus, Edit, Trash2, Download, Upload, Search

// Status
CheckCircle, XCircle, AlertCircle, Info

// UI Controls
ChevronLeft, ChevronRight, Menu, X, Moon, Sun
```

## Animation & Transitions

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Durations
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Common Transitions
```css
/* Hover effects */
transition: all 300ms ease-in-out;
transition: shadow 300ms ease-in-out;
transition: colors 150ms ease-in-out;

/* Loading states */
animation: spin 1s linear infinite;
animation: pulse 2s ease-in-out infinite;
```

## Responsive Design

### Breakpoints
```css
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

### Mobile-First Approach
```tsx
// Start with mobile styles, enhance for larger screens
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  {/* Content */}
</div>
```

### Touch Targets
- Minimum touch target: 44x44px
- Add padding to small interactive elements
- Space interactive elements appropriately

## Accessibility Guidelines

### Focus Management
- All interactive elements must be keyboard accessible
- Focus indicators must be visible
- Focus trap in modals and drawers
- Skip navigation links

### ARIA Labels
```tsx
// Icon buttons
<Button size="icon" aria-label="Edit item">
  <Edit className="h-4 w-4" />
</Button>

// Loading states
<Spinner aria-label="Loading..." />
```

### Color Contrast
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- Interactive elements: 3:1 contrast ratio
- Never rely solely on color to convey information

## Best Practices

### Do's
- ✅ Use semantic HTML elements
- ✅ Follow established patterns
- ✅ Test in both light and dark modes
- ✅ Consider mobile experience first
- ✅ Provide feedback for user actions
- ✅ Use loading states for async operations
- ✅ Include empty states for no data
- ✅ Write descriptive labels and messages

### Don'ts
- ❌ Create one-off custom styles
- ❌ Use inline styles except for dynamic values
- ❌ Ignore accessibility requirements
- ❌ Use color as the only differentiator
- ❌ Create components that duplicate existing ones
- ❌ Skip loading or error states
- ❌ Use technical jargon in user-facing text

## Component Checklist

When creating new components:
- [ ] Follows design system patterns
- [ ] Responsive across breakpoints
- [ ] Works in light and dark modes
- [ ] Keyboard accessible
- [ ] Has proper ARIA labels
- [ ] Includes loading states
- [ ] Handles errors gracefully
- [ ] Has empty state if applicable
- [ ] TypeScript types defined
- [ ] Documented with examples

## Resources

### Internal Documentation
- [UI Redesign Documentation](./ui-redesign.md)
- [Component Examples](../components/patterns/)
- [Global Styles](../app/globals.css)

### External Resources
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev/icons)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

Last Updated: August 24, 2025