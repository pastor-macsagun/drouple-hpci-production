import { NextRequest } from 'next/server'
import { exportAttendanceCsv } from '@/app/admin/lifegroups/actions'

export async function GET(
  request: NextRequest,
  { params }: { params: { lifeGroupId: string } }
) {
  return await exportAttendanceCsv({ lifeGroupId: params.lifeGroupId })
}