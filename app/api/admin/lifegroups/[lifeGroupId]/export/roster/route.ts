import { NextRequest } from 'next/server'
import { exportRosterCsv } from '@/app/admin/lifegroups/actions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lifeGroupId: string }> }
) {
  const { lifeGroupId } = await params
  return await exportRosterCsv({ lifeGroupId })
}