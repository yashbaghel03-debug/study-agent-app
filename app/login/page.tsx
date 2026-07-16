import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
