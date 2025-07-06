'use client'

import { Suspense } from 'react'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

function OverviewContent() {
  return <DashboardContent />
}

export default function DashboardPage() {
  return (
    <DashboardLayout activeSection="overview">
      <Suspense fallback={<div>Loading...</div>}>
        <OverviewContent />
      </Suspense>
    </DashboardLayout>
  )
}