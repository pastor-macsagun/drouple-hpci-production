import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function introspectDatabase() {
  const results = {
    uniqueConstraints: [] as any[],
    indexes: [] as any[],
    foreignKeys: [] as any[],
    issues: [] as string[],
  }

  try {
    // Check unique constraints
    const uniqueConstraints = await prisma.$queryRawUnsafe(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name, tc.constraint_name;
    `) as any[]

    results.uniqueConstraints = uniqueConstraints

    // Check for expected unique constraints
    const expectedUniques = [
      { table: 'Checkin', columns: ['serviceId', 'userId'] },
      { table: 'EventRsvp', columns: ['eventId', 'userId'] },
      { table: 'User', columns: ['email'] },
    ]

    for (const expected of expectedUniques) {
      const found = uniqueConstraints.find(c => 
        c.table_name === expected.table &&
        expected.columns.every(col => c.columns.includes(col))
      )
      if (!found) {
        results.issues.push(`Missing unique constraint on ${expected.table}(${expected.columns.join(', ')})`)
      }
    }

    // Check indexes
    const indexes = await prisma.$queryRawUnsafe(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_key'
      ORDER BY tablename, indexname;
    `) as any[]

    results.indexes = indexes

    // Check for critical performance indexes
    const expectedIndexes = [
      { table: 'User', column: 'tenantId' },
      { table: 'User', column: 'role' },
      { table: 'Service', column: 'localChurchId' },
      { table: 'Service', column: 'date' },
      { table: 'LifeGroup', column: 'localChurchId' },
      { table: 'Event', column: 'scope' },
      { table: 'EventRsvp', column: 'status' },
      { table: 'Membership', column: 'localChurchId' },
    ]

    for (const expected of expectedIndexes) {
      const found = indexes.find(idx => 
        idx.tablename === expected.table &&
        idx.indexdef.includes(expected.column)
      )
      if (!found) {
        results.issues.push(`Missing index on ${expected.table}.${expected.column}`)
      }
    }

    // Check foreign key constraints
    const foreignKeys = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `) as any[]

    results.foreignKeys = foreignKeys

    // Check cascade behaviors
    const cascadeChecks = [
      { table: 'Checkin', column: 'serviceId', expectedDelete: 'CASCADE' },
      { table: 'EventRsvp', column: 'eventId', expectedDelete: 'CASCADE' },
      { table: 'LifeGroupMembership', column: 'lifeGroupId', expectedDelete: 'CASCADE' },
    ]

    for (const check of cascadeChecks) {
      const fk = foreignKeys.find(f => 
        f.table_name === check.table && 
        f.column_name === check.column
      )
      if (fk && fk.delete_rule !== check.expectedDelete) {
        results.issues.push(
          `${check.table}.${check.column} has ${fk.delete_rule} instead of ${check.expectedDelete}`
        )
      }
    }

    // Check for nullable columns that should be required
    const nullabilityCheck = await prisma.$queryRawUnsafe(`
      SELECT 
        table_name,
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('Service', 'LifeGroup', 'Event', 'Membership')
        AND column_name LIKE '%ChurchId'
      ORDER BY table_name, column_name;
    `) as any[]

    for (const col of nullabilityCheck) {
      // LOCAL_CHURCH scoped entities should have required localChurchId
      if (col.column_name === 'localChurchId' && col.is_nullable === 'YES') {
        // Event is special case - can be null for WHOLE_CHURCH
        if (col.table_name !== 'Event') {
          results.issues.push(
            `${col.table_name}.${col.column_name} should not be nullable`
          )
        }
      }
    }

    // Check for missing audit columns
    const auditColumns = await prisma.$queryRawUnsafe(`
      SELECT 
        table_name,
        bool_or(column_name = 'createdAt') as has_created_at,
        bool_or(column_name = 'updatedAt') as has_updated_at
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name NOT IN ('_prisma_migrations')
        AND table_name NOT LIKE '\\_%'
      GROUP BY table_name
      HAVING NOT (bool_or(column_name = 'createdAt') AND bool_or(column_name = 'updatedAt'));
    `) as any[]

    for (const table of auditColumns) {
      if (!table.has_created_at || !table.has_updated_at) {
        results.issues.push(`${table.table_name} missing audit timestamps`)
      }
    }

    return results
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  introspectDatabase()
    .then(results => {
      console.log('📊 Database Introspection Results:')
      console.log('\n🔑 Unique Constraints:', results.uniqueConstraints.length)
      console.log('📍 Indexes:', results.indexes.length)
      console.log('🔗 Foreign Keys:', results.foreignKeys.length)
      
      if (results.issues.length > 0) {
        console.log('\n⚠️ Issues Found:')
        results.issues.forEach(issue => console.log(`  - ${issue}`))
      } else {
        console.log('\n✅ No issues found')
      }
      
      process.exit(results.issues.length > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('❌ Introspection failed:', error)
      process.exit(1)
    })
}