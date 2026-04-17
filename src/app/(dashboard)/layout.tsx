'use client'

import ProtectedRoute from '@/components/common/ProtectedRoute'
import Layout from '@/components/common/Layout'
import React from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  )
}

