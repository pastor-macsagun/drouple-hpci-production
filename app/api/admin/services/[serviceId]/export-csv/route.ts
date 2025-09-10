import { NextRequest } from 'next/server'
import { exportAttendanceCsv } from '@/app/admin/services/actions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params
  return await exportAttendanceCsv({ serviceId })
}