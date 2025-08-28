# Drouple Theme Implementation Checklist

> **Status**: Ready for Frontend Engineering handoff  
> **Audit Date**: January 27, 2025  
> **Deliverables**: Complete theme token system with 6 documentation files  
> **Critical Issues**: 2 accessibility violations requiring immediate attention

## 📋 Pre-Implementation Checklist

### ✅ Audit Deliverables Verification
- [x] **`src/styles/tokens.css`** - CSS custom properties (light/dark modes)
- [x] **`src/styles/tokens.ts`** - TypeScript token exports  
- [x] **`docs/theme-audit.md`** - Comprehensive audit report (437 lines)
- [x] **`docs/theme-contrast.csv`** - WCAG compliance analysis (48 combinations)
- [x] **`docs/theme-components.md`** - Component state mappings
- [x] **`docs/theme-audit-summary.json`** - Machine-readable summary
- [x] **`docs/theme-swatches.html`** - Visual color reference

### 🚨 Critical Issues (Fix Immediately)
- [ ] **Soft Gold Contrast**: Change `229, 196, 83` → `200, 170, 70` (3.84:1 → 4.5:1+)
- [ ] **Dark Mode Surface Text**: Fix 1.04:1 contrast ratio on surface backgrounds
- [ ] **Test All Combinations**: Validate fixes don't break existing styles

## 🚀 Phase 1: Foundation Setup (Week 1)

### Token System Deployment
- [ ] Verify `src/styles/tokens.css` is imported in `app/globals.css`
- [ ] Confirm CSS custom properties are available in browser dev tools
- [ ] Test both light and dark mode token switching
- [ ] Validate no build errors or missing references

### Tailwind Configuration Update
- [ ] Update `tailwind.config.ts` to reference new tokens:
```javascript
extend: {
  colors: {
    accent: "rgb(var(--color-accent) / <alpha-value>)",
    "accent-secondary": "rgb(var(--color-accent-secondary) / <alpha-value>)",
    ink: "rgb(var(--color-ink) / <alpha-value>)",
    "ink-muted": "rgb(var(--color-ink-muted) / <alpha-value>)",
    // ... add all tokens
  }
}
```

### Critical Contrast Fixes
- [ ] Update Soft Gold token value for WCAG AA compliance
- [ ] Fix dark mode surface text contrast issue
- [ ] Run automated contrast checker on all combinations
- [ ] Document any visual changes from fixes

### Baseline Testing  
- [ ] Screenshot all major pages before changes
- [ ] Verify landing page maintains exact visual appearance
- [ ] Test responsive behavior on mobile/tablet/desktop
- [ ] Validate print styles still work correctly

## 🔧 Phase 2: Component Integration (Week 2-3)

### shadcn/ui Component Updates

#### Button Component
- [ ] Update `components/ui/button.tsx`:
  - Primary variant → `bg-accent text-accent-ink`
  - Secondary variant → `bg-surface text-ink border-border`
  - Ghost variant → `hover:bg-surface`
  - Destructive variant → `bg-danger text-danger-foreground`
- [ ] Implement hover states with `translateY(-1px)` and enhanced shadows
- [ ] Add focus ring with `outline-2 outline-accent/50 outline-offset-2`
- [ ] Test disabled states maintain contrast requirements

#### Input Components
- [ ] Update `components/ui/input.tsx`:
  - Background → `bg-bg` 
  - Text → `text-ink`
  - Border → `border-border focus:border-accent`
  - Placeholder → `placeholder-ink-muted`
- [ ] Implement focus ring with Sacred Blue accent
- [ ] Test form validation states

#### Card Component  
- [ ] Update `components/ui/card.tsx`:
  - Background → `bg-bg`
  - Border → `border-border`
  - Shadow → `shadow-md hover:shadow-lg`
  - Radius → `rounded-xl` (20px from landing page)
- [ ] Implement hover lift animation `hover:-translate-y-0.5`
- [ ] Test nested card scenarios

#### Badge Component
- [ ] Update `components/ui/badge.tsx`:
  - Info variant → `bg-accent/10 text-accent border-accent/20`
  - Warning variant → `bg-amber-50 text-amber-800 border-amber-200`
  - Success variant → `bg-success/10 text-success border-success/20`
  - Danger variant → `bg-danger/10 text-danger border-danger/20`
- [ ] Add featured variant with full accent background
- [ ] Verify all contrast ratios meet WCAG AA

### Navigation Components
- [ ] Update header with sticky backdrop blur effect
- [ ] Apply Sacred Blue to brand text/logo
- [ ] Update navigation hover states
- [ ] Test mobile navigation drawer

### Dark Mode Implementation
- [ ] Deploy corrected dark mode token overrides
- [ ] Test all components in dark mode
- [ ] Verify enhanced surface contrast fixes
- [ ] Validate brand colors maintain recognition

### Interactive States
- [ ] Implement consistent focus management across all components
- [ ] Add `prefers-reduced-motion` support for animations
- [ ] Test keyboard navigation with new focus indicators
- [ ] Verify touch target sizes meet 44px minimum

## 📱 Phase 3: App-wide Rollout (Week 4+)

### Page-by-Page Migration

#### High Priority Pages
- [ ] `/` (Landing page) - Maintain exact visual parity
- [ ] `/auth/signin` - Apply new button and input styles
- [ ] `/dashboard` - Update stat cards and layout
- [ ] `/admin` - Apply consistent component styling

#### Medium Priority Pages
- [ ] `/admin/members` - Update data tables and forms
- [ ] `/admin/services` - Apply card and button updates
- [ ] `/events` - Update event cards and RSVP buttons
- [ ] `/lifegroups` - Apply consistent styling

#### Lower Priority Pages
- [ ] `/profile` - Update form components
- [ ] `/pathways` - Apply progress indicators styling
- [ ] Error pages and edge cases

### Component Library Updates
- [ ] Update custom components in `components/` directory
- [ ] Replace hardcoded colors with token references
- [ ] Apply consistent spacing using space tokens
- [ ] Update shadow usage to predefined shadow tokens

### Layout Components
- [ ] Update `components/layout/header.tsx`
- [ ] Update `components/layout/sidebar.tsx`
- [ ] Update `components/layout/page-header.tsx`
- [ ] Apply Sacred Blue to active navigation states

## 🧪 Testing & Validation

### Visual Regression Testing
- [ ] Screenshot all pages after token implementation
- [ ] Compare before/after images for unintended changes
- [ ] Test across different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Validate mobile responsive behavior

### Accessibility Testing
- [ ] Run automated WCAG checker on all pages
- [ ] Test keyboard navigation flow
- [ ] Verify screen reader compatibility
- [ ] Test high contrast mode support
- [ ] Validate focus indicators meet 3:1 contrast minimum

### Performance Validation
- [ ] Monitor bundle size impact of new tokens
- [ ] Test page load performance with new CSS
- [ ] Verify no paint/layout thrashing from token usage
- [ ] Check for any unused CSS after migration

### Cross-Browser Testing
- [ ] Chrome (latest + 1 previous version)
- [ ] Firefox (latest + 1 previous version)  
- [ ] Safari (latest + 1 previous version)
- [ ] Edge (latest version)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## 📊 Quality Assurance

### Brand Consistency Validation
- [ ] Sacred Blue usage matches landing page exactly
- [ ] Soft Gold usage (after contrast fix) maintains brand feel
- [ ] Typography hierarchy maintains landing page proportions
- [ ] Interactive states feel consistent across all components

### Accessibility Compliance
- [ ] All text combinations achieve WCAG AA (4.5:1) minimum
- [ ] Focus indicators meet WCAG 2.2 requirements (3:1 for UI components)
- [ ] Dark mode maintains accessibility standards
- [ ] High contrast mode support functions properly

### Performance Metrics
- [ ] Bundle size increase < 5% from token addition
- [ ] First contentful paint not degraded
- [ ] Layout shift metrics remain stable
- [ ] JavaScript execution time not impacted

## 🚢 Production Deployment

### Pre-Deployment
- [ ] Code review with design team approval
- [ ] All automated tests passing
- [ ] Manual QA sign-off on visual changes
- [ ] Performance benchmarks within acceptable ranges

### Deployment Strategy
- [ ] Feature flag setup for gradual rollout (if needed)
- [ ] Database migration plan (if any schema changes)
- [ ] CDN cache invalidation plan for CSS assets
- [ ] Rollback plan documented and tested

### Post-Deployment Monitoring
- [ ] Monitor error rates for CSS-related issues
- [ ] Track user feedback on visual changes
- [ ] Watch Core Web Vitals for performance impact
- [ ] Monitor accessibility complaints/reports

## 🔧 Tools & Resources

### Development Tools
- **Contrast Checker**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Color Picker**: Browser dev tools or specialized color tools
- **WCAG Testing**: axe-core browser extension
- **Visual Regression**: Playwright or similar testing framework

### Documentation References
- Landing page analysis: `docs/theme-audit.md`
- Component mappings: `docs/theme-components.md`  
- Contrast report: `docs/theme-contrast.csv`
- Token reference: `src/styles/tokens.ts`

### Team Communication
- [ ] Design team review of critical fixes
- [ ] Frontend team walkthrough of token system
- [ ] QA team briefing on what to test
- [ ] Product team approval of visual changes

## ✅ Sign-off Requirements

### Technical Sign-offs
- [ ] **Frontend Lead**: Code implementation review
- [ ] **Design Lead**: Visual consistency approval  
- [ ] **QA Lead**: Testing completion verification
- [ ] **Accessibility Expert**: WCAG compliance validation

### Business Sign-offs  
- [ ] **Product Manager**: Feature parity confirmation
- [ ] **Brand Manager**: Brand consistency approval
- [ ] **Stakeholder**: Final visual approval

---

## 📞 Support & Questions

**Theme Audit Contact**: UI/UX Design Agent  
**Implementation Support**: Frontend Engineering Team Lead  
**Design Questions**: Design System Maintainer  
**Accessibility Concerns**: Accessibility Champion

**Documentation Location**: `/docs/theme-*` files  
**Token Reference**: `/src/styles/tokens.css` and `/src/styles/tokens.ts`  
**Visual Reference**: `/docs/theme-swatches.html`

---

**Status**: Ready for implementation  
**Priority**: High (accessibility violations need immediate attention)  
**Timeline**: 4-6 weeks for complete rollout  
**Risk Level**: Medium (extensive component dependencies, but strong foundation)
