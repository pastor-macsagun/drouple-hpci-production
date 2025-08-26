#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const coverageFile = join(process.cwd(), 'coverage', 'coverage-summary.json')

if (!existsSync(coverageFile)) {
  console.error('❌ Coverage file not found. Run `npm run test:unit:coverage` first.')
  process.exit(1)
}

try {
  const coverage = JSON.parse(readFileSync(coverageFile, 'utf-8'))
  const total = coverage.total
  
  // Critical modules to check
  const criticalModules = [
    'lib/rbac.ts',
    'lib/db/middleware/tenancy.ts',
    'app/events/actions.ts',
    'app/(public)/register/actions.ts',
    'app/lib/pathways/enrollment.ts',
    'app/lib/pathways/progress.ts',
    'src/lib/services/checkin.ts'
  ]
  
  console.log('\n📊 Coverage Summary\n')
  console.log('━'.repeat(60))
  console.log('Overall Coverage:')
  console.log('━'.repeat(60))
  console.log(`Lines:      ${total.lines.pct.toFixed(1)}% (${total.lines.covered}/${total.lines.total})`)
  console.log(`Statements: ${total.statements.pct.toFixed(1)}% (${total.statements.covered}/${total.statements.total})`)
  console.log(`Functions:  ${total.functions.pct.toFixed(1)}% (${total.functions.covered}/${total.functions.total})`)
  console.log(`Branches:   ${total.branches.pct.toFixed(1)}% (${total.branches.covered}/${total.branches.total})`)
  
  console.log('\n━'.repeat(60))
  console.log('Critical Module Coverage:')
  console.log('━'.repeat(60))
  
  let criticalCoverage = { lines: 0, count: 0 }
  
  for (const module of criticalModules) {
    const modulePath = join(process.cwd(), module)
    const key = Object.keys(coverage).find(k => k.includes(module.replace(/\//g, '/')))
    
    if (key && coverage[key]) {
      const moduleCov = coverage[key]
      const pct = moduleCov.lines.pct
      criticalCoverage.lines += pct
      criticalCoverage.count++
      
      const status = pct >= 80 ? '✅' : '❌'
      console.log(`${status} ${module.padEnd(40)} ${pct.toFixed(1)}%`)
    } else {
      console.log(`⚠️  ${module.padEnd(40)} No coverage data`)
    }
  }
  
  if (criticalCoverage.count > 0) {
    const avgCritical = criticalCoverage.lines / criticalCoverage.count
    console.log('\n━'.repeat(60))
    console.log(`Average Critical Module Coverage: ${avgCritical.toFixed(1)}%`)
    console.log('━'.repeat(60))
    
    if (avgCritical >= 80) {
      console.log('\n✅ Coverage target met! (≥80% on critical modules)')
    } else {
      console.log('\n❌ Coverage below target. Need ≥80% on critical modules.')
      process.exit(1)
    }
  }
  
} catch (error) {
  console.error('❌ Error reading coverage file:', error)
  process.exit(1)
}