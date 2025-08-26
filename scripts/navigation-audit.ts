#!/usr/bin/env tsx

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// Define the expected navigation structure from the components
const HEADER_NAVIGATION = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Events", href: "/events" },
  { name: "LifeGroups", href: "/lifegroups" },
  { name: "Pathways", href: "/pathways" },
];

const SIDEBAR_NAVIGATION = {
  main: [
    { name: "Dashboard", href: "/dashboard", roles: ["SUPER_ADMIN", "ADMIN", "LEADER", "MEMBER"] },
    { name: "Check-In", href: "/checkin", roles: ["MEMBER", "LEADER", "ADMIN", "PASTOR", "SUPER_ADMIN"] },
    { name: "Events", href: "/events", roles: ["MEMBER", "LEADER", "ADMIN", "PASTOR", "SUPER_ADMIN"] },
    { name: "LifeGroups", href: "/lifegroups", roles: ["MEMBER", "LEADER", "ADMIN", "PASTOR", "SUPER_ADMIN"] },
    { name: "Pathways", href: "/pathways", roles: ["MEMBER", "LEADER", "ADMIN", "PASTOR", "SUPER_ADMIN"] },
  ],
  admin: [
    { name: "Admin Services", href: "/admin/services", roles: ["ADMIN", "PASTOR", "SUPER_ADMIN"] },
    { name: "Admin Events", href: "/admin/events", roles: ["ADMIN", "PASTOR", "SUPER_ADMIN"] },
    { name: "Admin LifeGroups", href: "/admin/lifegroups", roles: ["ADMIN", "PASTOR", "SUPER_ADMIN"] },
    { name: "Admin Pathways", href: "/admin/pathways", roles: ["ADMIN", "PASTOR", "SUPER_ADMIN"] },
  ],
  bottom: [
    { name: "Profile", href: "/profile", roles: ["SUPER_ADMIN", "ADMIN", "LEADER", "MEMBER"] },
  ],
};

// Function to check if a route exists
function checkRouteExists(href: string): 'PASS' | 'STUB' | 'MISSING' {
  const appDir = join(process.cwd(), 'app');
  
  // Convert href to file path
  let routePath = href.slice(1); // Remove leading slash
  if (!routePath) routePath = '';
  
  // Check for dynamic routes
  const segments = routePath.split('/');
  const possiblePaths = [
    join(appDir, ...segments, 'page.tsx'),
    join(appDir, ...segments, 'page.ts'),
  ];
  
  // Also check for dynamic segments
  if (segments.length > 1) {
    const dynamicPath = segments.map((seg, idx) => {
      // Check if parent directories have [id] or [slug] patterns
      const parentPath = join(appDir, ...segments.slice(0, idx));
      if (existsSync(parentPath) && statSync(parentPath).isDirectory()) {
        const dirs = readdirSync(parentPath);
        const dynamicDir = dirs.find(d => d.startsWith('[') && d.endsWith(']'));
        if (dynamicDir && idx === segments.length - 1) {
          return seg; // Keep original for last segment
        }
        return dynamicDir || seg;
      }
      return seg;
    });
    
    possiblePaths.push(
      join(appDir, ...dynamicPath, 'page.tsx'),
      join(appDir, ...dynamicPath, 'page.ts'),
    );
  }
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      // Check if file has meaningful content (not a stub)
      const content = readFileSync(path, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));
      
      // Check for minimal implementation indicators
      const hasReturn = content.includes('return');
      const hasJSX = content.includes('<') && content.includes('>');
      const hasContent = lines.length > 20;
      
      if (!hasReturn || !hasJSX || !hasContent) {
        return 'STUB';
      }
      
      return 'PASS';
    }
  }
  
  return 'MISSING';
}

// Analyze navigation
function analyzeNavigation() {
  const results = {
    redundancy: [] as any[],
    routeStatus: [] as any[],
    missingPages: [] as string[],
    stubPages: [] as string[],
    workingPages: [] as string[],
  };
  
  // Check header redundancy
  console.log('=== HEADER REDUNDANCY ANALYSIS ===\n');
  for (const headerItem of HEADER_NAVIGATION) {
    const sidebarMatch = SIDEBAR_NAVIGATION.main.find(s => s.href === headerItem.href);
    const redundant = !!sidebarMatch;
    results.redundancy.push({
      location: 'Header',
      name: headerItem.name,
      href: headerItem.href,
      redundant,
      sidebarMatch: sidebarMatch?.name || 'N/A',
    });
    
    console.log(`${headerItem.name} (${headerItem.href}): ${redundant ? '⚠️  REDUNDANT' : '✅ Unique'}`);
    if (redundant) {
      console.log(`  └─ Duplicates sidebar item: ${sidebarMatch?.name}`);
    }
  }
  
  // Check all routes
  console.log('\n=== ROUTE STATUS ANALYSIS ===\n');
  
  const allRoutes = [
    ...SIDEBAR_NAVIGATION.main,
    ...SIDEBAR_NAVIGATION.admin,
    ...SIDEBAR_NAVIGATION.bottom,
  ];
  
  for (const route of allRoutes) {
    const status = checkRouteExists(route.href);
    results.routeStatus.push({
      section: route.href.startsWith('/admin') ? 'Admin' : route.href === '/profile' ? 'Bottom' : 'Main',
      name: route.name,
      href: route.href,
      status,
      roles: route.roles.join(', '),
    });
    
    let icon = '✅';
    if (status === 'STUB') {
      icon = '⚠️';
      results.stubPages.push(route.href);
    } else if (status === 'MISSING') {
      icon = '❌';
      results.missingPages.push(route.href);
    } else {
      results.workingPages.push(route.href);
    }
    
    console.log(`${icon} ${route.name} (${route.href}): ${status}`);
  }
  
  // Summary
  console.log('\n=== SUMMARY ===\n');
  console.log(`Total Routes: ${allRoutes.length}`);
  console.log(`Working Pages: ${results.workingPages.length}`);
  console.log(`Stub Pages: ${results.stubPages.length}`);
  console.log(`Missing Pages: ${results.missingPages.length}`);
  console.log(`Redundant Header Links: ${results.redundancy.filter(r => r.redundant).length}/4`);
  
  if (results.missingPages.length > 0) {
    console.log('\n❌ MISSING PAGES:');
    results.missingPages.forEach(p => console.log(`  - ${p}`));
  }
  
  if (results.stubPages.length > 0) {
    console.log('\n⚠️  STUB PAGES:');
    results.stubPages.forEach(p => console.log(`  - ${p}`));
  }
  
  return results;
}

// Main execution
console.log('🔍 HPCI-ChMS Navigation Audit\n');
console.log('=' .repeat(50) + '\n');

const auditResults = analyzeNavigation();

// Export results for report generation
export default auditResults;