# Quick-Fix Cheatsheet

This document provides design-system aligned fixes for the visual audit findings.

## Critical Token Issues (P0 - Must Fix)

### Primary/Primary-Foreground Token Mismatch
**Problem:** The `--primary` token resolves to `--color-accent` (blue-600: `rgb(37, 99, 235)`) but `--primary-foreground` resolves to `--color-accent-ink` (white: `rgb(255, 255, 255)`). However, the computed styles show yellow foreground on white background.

**Root Cause:** CSS variable cascade issue where `--primary-foreground` is not properly inheriting the intended color values.

**Fix:** Update CSS variables in `app/globals.css`:
```css
/* Current (broken): */
--primary-foreground: var(--color-accent-ink);

/* Fixed: */
--primary-foreground: 255 255 255; /* Explicit white for primary buttons */
```

### Skip-to-Content Link (Critical Accessibility)
**Problem:** Yellow text on white background (1.07:1 contrast ratio) - fails WCAG AA.
**Location:** All pages - skip-to-content link
**Fix:** 
```css
/* Replace: */
bg-primary text-primary-foreground

/* With: */
bg-accent text-white
```

## High Priority Issues (P1)

### Design Token Replacements

| Current Class | Replace With | Reason |
|---------------|-------------|---------|
| `text-white` | `text-accent-ink` | Use semantic token for text on accent backgrounds |
| `bg-white` | `bg-surface` or `bg-elevated` | Use surface tokens that adapt to theme |
| `border-white` | `border-border` | Use semantic border token |
| `text-black` | `text-ink` | Use semantic text token |
| `bg-black` | `bg-surface` (handled by theme) | Let theme system handle dark colors |
| `border-black` | `border-border` | Use semantic border token |
| `text-gray-400` | `text-ink-muted` | Use semantic muted text token |
| `text-gray-500` | `text-ink-muted` | Use semantic muted text token |
| `text-gray-600` | `text-ink-muted` | Use semantic muted text token |
| `text-gray-700` | `text-ink` | Use primary text token |
| `text-gray-800` | `text-ink` | Use primary text token |
| `text-gray-900` | `text-ink` | Use primary text token |
| `bg-gray-50` | `bg-surface` | Use semantic surface token |
| `bg-gray-100` | `bg-elevated` | Use semantic elevated token |
| `bg-gray-200` | `bg-elevated` | Use semantic elevated token |

### Hard-Coded Colors to Replace

| Hard-Coded Value | Replace With |
|------------------|-------------|
| `#fffefc` | `bg-surface` |
| `#f5f3ed` | `bg-elevated` |
| `#4F46E5` | `bg-accent` |
| `#666` | `text-ink-muted` |
| `#eee` | `border-border` |
| `#999` | `text-ink-muted` |

## Component-Specific Fixes

### Button Component (components/ui/button.tsx)
**Status:** ✅ Already using correct tokens
**Note:** The issue is in CSS variable resolution, not component classes

### Card Component (components/ui/card.tsx)
**Issue:** CardDescription uses `text-ink-muted` which is correct
**Status:** ✅ Already using correct tokens

### Input Component (components/ui/input.tsx) 
**Issue:** Uses `placeholder:text-ink-muted` which is correct
**Status:** ✅ Already using correct tokens

### Table Component (components/ui/table.tsx)
**Issue:** Uses `text-ink-muted` for headers which is correct
**Status:** ✅ Already using correct tokens

### Dark Mode Issues

| Component | Problem | Fix |
|-----------|---------|-----|
| Role badges on public landing | `text-gray-700` on dark surface (1.83:1) | Use `text-ink` instead |
| Overlay backdrops | `bg-black/50` hardcoded | Use `bg-surface/80` with backdrop-blur |

## File Priority List

### Immediate Action Required (P0)
1. `app/globals.css:62` - Fix `--primary-foreground` token value
2. All skip-to-content links - Replace `bg-primary text-primary-foreground` with `bg-accent text-white`

### High Priority (P1) 
1. `app/public-landing.tsx` - 47 instances of hard-coded colors
2. `app/messages/page.tsx` - 20 instances of gray classes
3. `app/members/page.tsx` - 18 instances of gray classes
4. `app/(errors)/forbidden/page.tsx` - 4 instances of gray classes
5. `app/(public)/register/page.tsx` - 8 instances of gray classes

### Medium Priority (P2)
1. All `components/layout/` files - Replace `bg-black` overlays
2. Email templates - Replace hard-coded hex colors with CSS custom properties
3. Admin pages - Systematic gray class replacement

## Token Validation

After implementing fixes, verify these token mappings work correctly:

```css
/* Light mode values */
--color-ink: 17 24 39;           /* ~4.5:1+ on light backgrounds */
--color-ink-muted: 71 85 105;    /* ~4.5:1+ on light backgrounds */
--color-surface: 248 250 252;    /* Light surface */
--color-elevated: 241 245 249;   /* Elevated surface */
--color-border: 226 232 240;     /* Subtle borders */

/* Dark mode values */
--color-ink: 250 250 250;        /* ~4.5:1+ on dark backgrounds */
--color-ink-muted: 161 161 170;  /* ~4.5:1+ on dark backgrounds */
--color-surface: 17 17 20;       /* Dark surface */
--color-elevated: 24 24 27;      /* Elevated dark surface */
--color-border: 39 39 42;        /* Subtle dark borders */
```

## Implementation Priority

1. **P0 (Critical):** Fix primary token cascade - 15 minutes
2. **P1 (High):** Replace hard-coded colors in top 5 files - 2 hours
3. **P2 (Medium):** Systematic gray class replacement - 4 hours

## Testing Checklist

After implementing fixes:
- [ ] All primary buttons have >4.5:1 contrast
- [ ] Skip-to-content links are visible and accessible
- [ ] Dark mode role badges are readable
- [ ] No hard-coded hex colors remain in component files
- [ ] All gray-* classes replaced with semantic tokens
- [ ] Overlay backdrops use semantic tokens