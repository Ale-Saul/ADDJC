import { Suspense } from 'react'
import ResetPasswordPage from './ResetPasswordPage'
import LoadingFallback from '@/components/common/LoadingFallback'

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordPage />
    </Suspense>
  )
}
