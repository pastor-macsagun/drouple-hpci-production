import { NextRequest } from 'next/server'
import { exportRosterCsv } from '@/app/admin/lifegroups/actions'

export async function GET(
  request: NextRequest,
  { params }: { params: { lifeGroupId: string } }
) {
  return await exportRosterCsv({ lifeGroupId: params.lifeGroupId })
}