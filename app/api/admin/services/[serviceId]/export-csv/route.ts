import { NextRequest } from 'next/server'
import { exportAttendanceCsv } from '@/app/admin/services/actions'

export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return await exportAttendanceCsv({ serviceId: params.serviceId })
}